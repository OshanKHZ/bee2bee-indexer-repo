# n8n-nodes-bee2bee-indexer

This is an n8n community node that lets you index GitHub repositories and generate embeddings for RAG (Retrieval-Augmented Generation) systems.

## Features

- 🐝 **Multi-language support**: Python, JavaScript, TypeScript, Rust, Go, Java, C, C++
- 🔍 **Smart code parsing**: Uses tree-sitter for accurate AST-based parsing
- 🧠 **Dual embeddings**: Generates both NLP and code-specific embeddings
- ⚡ **Flexible output**: Choose between full data, chunks only, or metadata only
- 🔐 **Multiple providers**: Local embeddings (free) or OpenAI (paid)
- 🎯 **Customizable chunking**: Function-level, class-level, or file-level strategies

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Node Installation

1. Go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-bee2bee-indexer` in **Enter npm package name**.
4. Agree to the [risks](https://docs.n8n.io/integrations/community-nodes/risks/) of using community nodes.
5. Select **Install**.

### Manual Installation

To get started locally, install the dependencies:

```bash
cd n8n-node
npm install
```

Build the node:

```bash
npm run build
```

Link it to your local n8n installation:

```bash
npm link
```

Then in your n8n custom directory (`~/.n8n/custom/`):

```bash
npm link n8n-nodes-bee2bee-indexer
```

## Credentials

This node requires the following credentials:

- **GitHub Token**: Personal Access Token for downloading repositories
- **OpenAI API Key** (optional): Only needed if using OpenAI embeddings
- **Embedding Provider**: Choose between `local` (free) or `openai` (paid)

## Operations

### Index Repository

Downloads a GitHub repository and generates embeddings for all code files.

**Parameters:**

- **Repository Owner** (required): GitHub username or organization
- **Repository Name** (required): Repository name
- **Branch** (required): Git branch to index (default: `main`)
- **Output Format**:
  - `Full`: Metadata + Chunks + Embeddings
  - `Chunks + Embeddings`: Only code chunks with embeddings
  - `Chunks Only`: Code chunks without embeddings
  - `Metadata Only`: Repository statistics only

**Additional Options:**

- **Max Files**: Limit number of files to process (0 = no limit)
- **File Extensions**: Comma-separated list of extensions to include
- **Exclude Patterns**: Directories to exclude (e.g., `node_modules,dist`)
- **Include Docstrings**: Extract and include documentation
- **Chunk Strategy**: `function`, `class`, or `file` level chunking

## Output

The node outputs a JSON object with the following structure:

```json
{
  "success": true,
  "repository": {
    "owner": "facebook",
    "name": "react",
    "branch": "main",
    "fullName": "facebook/react"
  },
  "statistics": {
    "totalFiles": 150,
    "processedFiles": 145,
    "totalChunks": 1234,
    "languageBreakdown": {
      "javascript": 80,
      "typescript": 65
    }
  },
  "chunks": [
    {
      "id": "unique_id",
      "code": "function example() {...}",
      "metadata": {
        "file_path": "src/index.js",
        "language": "javascript",
        "chunk_type": "function",
        "name": "example",
        "lines": [10, 25]
      },
      "embeddings": {
        "nlp": [0.1, 0.2, ...],
        "code": [0.3, 0.4, ...]
      }
    }
  ]
}
```

## Usage in n8n Workflows

### Example: Index → Store in Vector DB

```
[Schedule Trigger] → [Bee2Bee Indexer] → [Pinecone] → [Webhook]
```

1. **Bee2Bee Indexer** node processes the repository
2. Output is sent to **Pinecone** (or ChromaDB/Qdrant/Weaviate)
3. Final webhook confirms indexing is complete

### Example: Search Flow

```
[Webhook] → [Pinecone Search] → [OpenAI] → [Response]
```

1. User sends search query via webhook
2. **Pinecone** searches indexed embeddings
3. **OpenAI** uses retrieved chunks for context
4. Response sent back with answer

## Compatibility

Tested with n8n version 1.0.0+

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Bee2Bee documentation](https://docs.bee2bee.ai)

## License

[MIT](LICENSE.md)
