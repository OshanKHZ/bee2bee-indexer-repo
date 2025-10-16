#!/usr/bin/env python3
"""
CLI wrapper for bee2bee-indexer to be used by n8n node.
Reads JSON config from stdin, processes repo, outputs JSON to stdout.
"""
import sys
import json
import asyncio
import os
from pathlib import Path
from typing import Dict, Any, List

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from gh_client.client import GitHubClient
from parsers.tree_sitter_parser import TreeSitterParser
from chunkers.function_chunker import FunctionChunker
from embeddings.dual_embedder import DualEmbedder
from core.types import Language


# Language mapping
LANG_MAP = {
    ".py": Language.PYTHON,
    ".js": Language.JAVASCRIPT,
    ".ts": Language.TYPESCRIPT,
    ".tsx": Language.TYPESCRIPT,
    ".jsx": Language.JAVASCRIPT,
    ".rs": Language.RUST,
    ".go": Language.GO,
    ".java": Language.JAVA,
    ".c": Language.C,
    ".cpp": Language.CPP,
}


async def index_repository(config: Dict[str, Any]) -> Dict[str, Any]:
    """Index a repository and return structured JSON output."""

    # Extract config
    owner = config["owner"]
    repo = config["repo"]
    branch = config["branch"]
    github_token = config["githubToken"]
    openai_api_key = config.get("openaiApiKey", "")
    embedding_provider = config.get("embeddingProvider", "local")
    output_format = config.get("outputFormat", "full")
    max_files = config.get("maxFiles", 0)
    file_extensions = config.get("fileExtensions", [".py", ".js", ".ts", ".tsx"])
    exclude_patterns = config.get("excludePatterns", ["node_modules", "dist", "__pycache__"])
    include_docstrings = config.get("includeDocstrings", True)
    chunk_strategy = config.get("chunkStrategy", "function")

    import time
    start_time = time.time()

    # Initialize components
    github_client = GitHubClient(github_token)
    parser = TreeSitterParser()
    chunker = FunctionChunker()

    # Setup embedder
    if embedding_provider == "openai":
        nlp_model = "text-embedding-3-small"
        code_model = nlp_model
    else:
        nlp_model = "sentence-transformers/all-MiniLM-L6-v2"
        code_model = "jinaai/jina-embeddings-v2-base-code"

    embedder = DualEmbedder(
        provider=embedding_provider,
        nlp_model=nlp_model,
        code_model=code_model,
        openai_api_key=openai_api_key if openai_api_key else None,
    )

    # Download repo
    repo_path = await github_client.download_repo(owner, repo, branch)

    # Find files
    all_files = []
    for ext in file_extensions:
        all_files.extend(list(Path(repo_path).rglob(f"*{ext}")))

    # Filter excluded patterns
    filtered_files = []
    for file in all_files:
        rel_path = str(file.relative_to(repo_path))
        excluded = False
        for pattern in exclude_patterns:
            if pattern in rel_path:
                excluded = True
                break
        if not excluded:
            filtered_files.append(file)

    # Limit files if needed
    if max_files > 0:
        filtered_files = filtered_files[:max_files]

    # Statistics
    stats = {
        "totalFiles": len(all_files),
        "processedFiles": 0,
        "skippedFiles": 0,
        "totalChunks": 0,
        "totalLines": 0,
        "languageBreakdown": {},
    }

    # Process files
    all_chunks = []

    for file in filtered_files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                content = f.read()

            # Detect language
            suffix = file.suffix.lower()
            language = LANG_MAP.get(suffix, Language.PYTHON)

            # Update stats
            lang_name = language.value
            stats["languageBreakdown"][lang_name] = stats["languageBreakdown"].get(lang_name, 0) + 1

            # Parse
            tree = parser.parse(content, file.suffix)
            if not tree:
                stats["skippedFiles"] += 1
                continue

            # Chunk
            chunks = chunker.extract_chunks(
                tree=tree,
                content=content,
                repo=f"{owner}/{repo}",
                file_path=str(file.relative_to(repo_path)),
                language=language,
            )

            all_chunks.extend(chunks)
            stats["processedFiles"] += 1
            stats["totalChunks"] += len(chunks)
            stats["totalLines"] += len(content.splitlines())

        except Exception as e:
            stats["skippedFiles"] += 1
            continue

    # Build response
    response = {
        "success": True,
        "repository": {
            "owner": owner,
            "name": repo,
            "branch": branch,
            "fullName": f"{owner}/{repo}",
        },
        "indexing": {
            "startTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(start_time)),
            "endTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "duration": round(time.time() - start_time, 2),
        },
        "statistics": stats,
    }

    # Add chunks based on output format
    if output_format in ["full", "chunks", "chunks_embeddings"]:
        chunks_data = []

        for chunk in all_chunks:
            chunk_dict = {
                "id": chunk.id,
                "code": chunk.code,
                "metadata": {
                    "file_path": chunk.file_path,
                    "language": chunk.language.value,
                    "chunk_type": chunk.chunk_type.value,
                    "name": chunk.name,
                    "signature": chunk.signature,
                    "docstring": chunk.docstring if include_docstrings else None,
                    "lines": [chunk.start_line, chunk.end_line],
                    "linesOfCode": chunk.lines_of_code,
                    "module": chunk.module,
                },
            }

            chunks_data.append(chunk_dict)

        response["chunks"] = chunks_data

    # Add embeddings based on output format
    if output_format in ["full", "chunks_embeddings"]:
        nlp_dim, code_dim = embedder.get_dimensions()

        response["embeddings"] = {
            "provider": embedding_provider,
            "nlpDimension": nlp_dim,
            "codeDimension": code_dim,
        }

        # Generate embeddings for all chunks
        if all_chunks:
            chunk_dicts = [
                {
                    "code": c.code,
                    "name": c.name,
                    "chunk_type": c.chunk_type.value,
                    "signature": c.signature,
                    "docstring": c.docstring,
                    "file_path": c.file_path,
                    "module": c.module,
                }
                for c in all_chunks
            ]

            embeddings = embedder.embed_batch(chunk_dicts)

            # Add embeddings to chunks
            for i, (nlp_emb, code_emb) in enumerate(embeddings):
                response["chunks"][i]["embeddings"] = {
                    "nlp": nlp_emb.tolist() if hasattr(nlp_emb, 'tolist') else list(nlp_emb),
                    "code": code_emb.tolist() if hasattr(code_emb, 'tolist') else list(code_emb),
                }

    # Cleanup
    await github_client.cleanup_temp_repo(repo_path)
    await github_client.close()

    return response


def main():
    """Main CLI entry point."""
    try:
        # Read config from stdin
        config = json.load(sys.stdin)

        # Run async indexing
        result = asyncio.run(index_repository(config))

        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        sys.exit(0)

    except Exception as e:
        # Output error as JSON
        error_response = {
            "success": False,
            "error": str(e),
            "errorType": type(e).__name__,
        }
        print(json.dumps(error_response, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
