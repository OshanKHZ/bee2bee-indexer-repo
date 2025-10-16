# 🐝 Bee2Bee Indexer

**Code indexing and embedding generation for RAG systems**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![n8n Community Node](https://img.shields.io/badge/n8n-community%20node-ff6d5a.svg)](https://n8n.io)

Bee2Bee Indexer is a powerful tool for indexing GitHub repositories and generating embeddings optimized for Retrieval-Augmented Generation (RAG) systems. It parses code across multiple programming languages, chunks it intelligently, and generates dual embeddings (NLP + Code-specific) ready for vector databases.

## ✨ Features

- 🌍 **Multi-language support**: Python, JavaScript, TypeScript, Rust, Go, Java, C, C++
- 🌳 **AST-based parsing**: Uses tree-sitter for accurate syntax understanding
- 🧠 **Dual embeddings**: Generates both NLP and code-specific embeddings
- ⚡ **Flexible chunking**: Function-level, class-level, or file-level strategies
- 🔐 **Multiple providers**: Local embeddings (free) or OpenAI (paid)
- 🎯 **n8n integration**: Custom community node for workflow automation
- 📦 **Standalone CLI**: Use without n8n for custom integrations
- 🚀 **Production-ready**: Battle-tested on large codebases

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/heronlancellot/bee2bee-indexer.git
cd bee2bee-indexer

# Install Python dependencies
pip install -e .

# Or using poetry
poetry install
```

### Basic Usage (Python)

```python
from bee2bee_indexer import GitHubClient, TreeSitterParser, FunctionChunker, DualEmbedder

# Initialize components
github_client = GitHubClient(token="your_github_token")
parser = TreeSitterParser()
chunker = FunctionChunker()
embedder = DualEmbedder(provider="local")

# Download and parse repository
repo_path = await github_client.download_repo("facebook", "react", "main")
files = repo_path.glob("**/*.js")

# Process files
for file in files:
    tree = parser.parse(file.read_text(), ".js")
    chunks = chunker.extract_chunks(tree, file.read_text(), "facebook/react", str(file))
    embeddings = embedder.embed_batch([chunk.dict() for chunk in chunks])

    # Store in your vector database
    # your_vector_db.insert(chunks, embeddings)
```

### CLI Usage

```bash
# Create config
cat > config.json << EOF
{
  "owner": "facebook",
  "repo": "react",
  "branch": "main",
  "githubToken": "your_token",
  "embeddingProvider": "local",
  "outputFormat": "chunks_embeddings"
}
EOF

# Run indexer
python cli.py < config.json > output.json
```

## 🎨 n8n Integration

Install as a custom community node in n8n:

### Via GitHub Packages (Private)

1. Configure npm registry:
```bash
# Create .npmrc in your n8n directory
echo "@heronlancellot:registry=https://npm.pkg.github.com" >> ~/.n8n/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.n8n/.npmrc
```

2. Install in n8n UI:
   - Go to **Settings → Community Nodes**
   - Click **Install**
   - Enter: `@heronlancellot/n8n-nodes-bee2bee-indexer`

### Example Workflow

```
[Schedule] → [Bee2Bee Indexer] → [Pinecone] → [Email Notification]
```

## 📖 Documentation

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [n8n Node Guide](docs/N8N_NODE.md)
- [Publishing Guide](docs/PUBLISH_GITHUB_PACKAGES.md)

## 🛠️ Configuration

### Environment Variables

```bash
# Required
GITHUB_TOKEN=your_github_personal_access_token

# Optional
EMBEDDING_PROVIDER=local  # or "openai"
OPENAI_API_KEY=your_openai_key  # required if provider=openai
EMBEDDING_MODEL=text-embedding-3-small  # for OpenAI
MAX_WORKERS=4
CHUNK_MAX_SIZE=2000
```

### Output Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| `full` | Metadata + Chunks + Embeddings | Complete indexing |
| `chunks_embeddings` | Chunks with embeddings | Vector DB insertion |
| `chunks` | Code chunks only | Custom embedding |
| `metadata` | Statistics only | Repository analysis |

### Chunk Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `function` | One chunk per function/method | Fine-grained search |
| `class` | One chunk per class | OOP codebases |
| `file` | One chunk per file | High-level search |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Bee2Bee Indexer                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   GitHub     │───▶│ Tree-sitter  │───▶│   Chunker    │ │
│  │   Client     │    │   Parser     │    │  (Function)  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Downloads   │    │  AST Nodes   │    │ Code Chunks  │ │
│  │  Repository  │    │  Extracted   │    │  + Metadata  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                   │         │
│                                                   ▼         │
│                                          ┌──────────────┐  │
│                                          │    Dual      │  │
│                                          │  Embeddings  │  │
│                                          └──────────────┘  │
│                                                   │         │
│                                                   ▼         │
│                                          ┌──────────────┐  │
│                                          │ Vector DB    │  │
│                                          │ (Your choice)│  │
│                                          └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/heronlancellot/bee2bee-indexer.git
cd bee2bee-indexer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install in editable mode
pip install -e ".[dev]"

# Run tests
pytest tests/
```

### Building the n8n Node

```bash
cd n8n-node

# Install dependencies
npm install

# Build
npm run build

# Test locally
npm link
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

Benchmarks on `facebook/react` repository:

- **Files processed**: 1,234
- **Chunks generated**: 8,567
- **Processing time**: ~45 seconds (local embeddings)
- **Memory usage**: ~2GB peak

## 🗺️ Roadmap

- [ ] Support for more languages (Swift, Kotlin, Ruby)
- [ ] Incremental indexing with webhook support
- [ ] Built-in vector database integrations
- [ ] Semantic code search UI
- [ ] Multi-repository indexing
- [ ] Code change detection and re-indexing
- [ ] Public npm package release
- [ ] PyPI package release

## 🙏 Acknowledgments

- [tree-sitter](https://tree-sitter.github.io/) for parsing
- [sentence-transformers](https://www.sbert.net/) for embeddings
- [n8n](https://n8n.io/) for workflow automation
- [OpenAI](https://openai.com/) for embedding APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐝 About Bee2Bee

Bee2Bee Indexer is part of the Bee2Bee ecosystem, building tools to help developers work smarter with AI.

- Website: https://bee2bee.ai
- GitHub: https://github.com/heronlancellot
- Documentation: https://docs.bee2bee.ai

---

Made with ❤️ by the Bee2Bee Team
