# Migration Guide: From Monorepo to Separate Repository

This guide explains how to migrate from using `bee2bee-indexer` inside `repomind-ui` to the standalone repository.

## What Changed

### Before (Monorepo)
```
repomind-ui/
└── bee2bee-indexer/
    ├── src/
    ├── n8n-node/
    └── cli.py
```

### After (Separate Repos)
```
bee2bee-indexer/          # New standalone repo
├── src/
├── n8n-node/
└── cli.py

repomind-ui/              # Updated to use package
├── frontend/
├── agents/
└── package.json          # References @heronlancellot/n8n-nodes-bee2bee-indexer
```

## Migration Steps

### 1. Remove Old bee2bee-indexer from repomind-ui

```bash
cd repomind-ui

# Backup if needed
cp -r bee2bee-indexer bee2bee-indexer.backup

# Remove old directory
rm -rf bee2bee-indexer
```

### 2. Use bee2bee-indexer as Package

#### For n8n workflows:

Install the n8n community node:

```bash
# In n8n directory
cd n8n
echo "@heronlancellot:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc

# Then in n8n UI: Settings → Community Nodes → Install
# Package: @heronlancellot/n8n-nodes-bee2bee-indexer
```

#### For Python scripts (if needed):

```bash
# Install from GitHub
pip install git+https://github.com/heronlancellot/bee2bee-indexer.git

# Or add to requirements.txt
echo "bee2bee-indexer @ git+https://github.com/heronlancellot/bee2bee-indexer.git" >> requirements.txt
```

### 3. Update Environment Variables

Move `bee2bee-indexer/.env` to your main project:

```bash
# Copy environment variables to repomind-ui/.env or n8n/.env
cat bee2bee-indexer.backup/.env >> .env
```

### 4. Test Integration

1. Test n8n node is available
2. Create a simple workflow
3. Run the indexer
4. Verify output

## For Developers

### Continuing Development on bee2bee-indexer

```bash
# Clone the new repo
git clone https://github.com/heronlancellot/bee2bee-indexer.git
cd bee2bee-indexer

# Install in development mode
pip install -e .

# Make changes, test, commit
git add .
git commit -m "feat: your feature"
git push

# Publish new version (for n8n node)
cd n8n-node
npm version patch  # or minor/major
npm run build
npm publish
```

### Updating repomind-ui to Use New Version

```bash
cd repomind-ui/n8n

# Update to latest version
npm update @heronlancellot/n8n-nodes-bee2bee-indexer

# Or install specific version
npm install @heronlancellot/n8n-nodes-bee2bee-indexer@0.2.0
```

## Benefits of This Change

✅ **Reusability**: Can be used in other projects
✅ **Versioning**: Proper semantic versioning
✅ **Independence**: Develop and deploy independently
✅ **Community**: Others can contribute
✅ **Maintenance**: Easier to manage

## Troubleshooting

### "Package not found"

Make sure you configured `.npmrc` with GitHub token.

### "Python import error"

Reinstall the package:
```bash
pip uninstall bee2bee-indexer
pip install git+https://github.com/heronlancellot/bee2bee-indexer.git
```

### "Node not showing in n8n"

1. Verify package is installed: `npm list @heronlancellot/n8n-nodes-bee2bee-indexer`
2. Restart n8n: `docker-compose restart n8n`
3. Check logs: `docker-compose logs n8n`

## Questions?

Open an issue in the bee2bee-indexer repository!
