#!/bin/bash
# Initialize bee2bee-indexer repository and push to GitHub

echo "🐝 Initializing Bee2Bee Indexer Repository"
echo "==========================================="
echo ""

# Initialize git
echo "📝 Initializing git repository..."
git init

# Add all files
echo "📦 Adding files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "chore: initial commit - bee2bee indexer

- Core Python indexer library
- n8n custom community node
- CLI wrapper for standalone usage
- Documentation and setup guides
- GitHub Actions for CI/CD"

echo ""
echo "✅ Local repository initialized!"
echo ""
echo "Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   https://github.com/new"
echo "   Name: bee2bee-indexer"
echo "   Description: Code indexing and embedding generation for RAG systems"
echo "   Private or Public: Your choice"
echo ""
echo "2. Add remote and push:"
echo "   git remote add origin https://github.com/heronlancellot/bee2bee-indexer.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Create a release tag for npm publishing:"
echo "   git tag v0.1.0"
echo "   git push origin v0.1.0"
echo ""
echo "4. GitHub Actions will automatically publish the n8n node!"
echo ""
