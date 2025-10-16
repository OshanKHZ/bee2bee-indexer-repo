# Contributing to Bee2Bee Indexer

Thank you for your interest in contributing to Bee2Bee Indexer! 🐝

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Explain the use case
- Describe the proposed solution
- Consider alternatives you've thought about

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Write/update tests
5. Update documentation
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
7. Push and create a Pull Request

#### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(parser): add support for Swift language
fix(embedder): resolve OpenAI API timeout issue
docs(readme): update installation instructions
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bee2bee-indexer.git
cd bee2bee-indexer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest tests/
```

## Code Style

- Follow PEP 8 for Python code
- Use type hints
- Write docstrings for public functions
- Keep functions focused and small
- Add comments for complex logic

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for high code coverage

```bash
# Run tests
pytest tests/

# Run with coverage
pytest --cov=src tests/
```

## Documentation

- Update README.md if adding user-facing features
- Update docstrings and type hints
- Add examples for new functionality

## Questions?

Feel free to open an issue for any questions or discussions!

---

Thank you for contributing! 🙏
