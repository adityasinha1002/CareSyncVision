# Contributing to CareSyncVision

Thank you for your interest in contributing to CareSyncVision! We welcome contributions from the community.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read our CODE OF CONDUCT.md and follow it in all your interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/CareSyncVision.git
   cd CareSyncVision
   ```
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15 (or use Docker)

### Quick Start
```bash
# 1. Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Update with your local values
# 3. Start the system
docker-compose -f docker-compose.new.yml up --build

# 4. Access at https://localhost
```

## Making Changes

### Code Standards

**Python (Backend)**
- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings for all functions
- Keep functions focused and small
- Max line length: 100 characters

```python
def calculate_risk_score(patient_id: str) -> float:
    """
    Calculate health risk score for a patient.
    
    Args:
        patient_id: UUID of the patient
        
    Returns:
        Risk score between 0 and 100
        
    Raises:
        PatientNotFoundError: If patient doesn't exist
    """
    pass
```

**JavaScript/React (Frontend)**
- Use functional components with hooks
- ESLint configuration provided
- Write meaningful component prop descriptions
- Use meaningful variable names
- Keep components under 300 lines

### Testing

**Python Tests**
```bash
cd backend
pip install pytest pytest-cov
pytest
# or with coverage
pytest --cov=app tests/
```

**Frontend Tests**
```bash
cd frontend
npm test
npm run lint
```

## Commit Guidelines

Use clear, descriptive commit messages:

```
feat: Add medication adherence tracking
fix: Correct risk score calculation for elderly patients
docs: Update API documentation
style: Format code with black
refactor: Simplify health record processing
test: Add unit tests for auth service
```

Format: `<type>: <subject>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Submitting Changes

### Pull Request Process

1. **Update documentation** for any new features
2. **Add tests** for all new code
3. **Ensure tests pass:**
   ```bash
   npm run lint  # Frontend
   pytest        # Backend
   ```
4. **Update CHANGELOG.md**
5. **Submit PR** with clear description of changes
6. **Respond to code review** feedback promptly

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
Describe how to test the changes

## Screenshots (if applicable)
Before and after comparisons

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Follows code style
```

## Reporting Issues

Found a bug? Have a feature request? Please open an issue:

1. **Check existing issues** first to avoid duplicates
2. **Be descriptive:**
   - Clear title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - System info (OS, Python version, etc.)
3. **Include logs/screenshots** if applicable

### Bug Report Template
```markdown
**Describe the bug:**
Clear description...

**Steps to reproduce:**
1. ...
2. ...

**Expected behavior:**
...

**Actual behavior:**
...

**Environment:**
- OS: 
- Python: 
- Docker: 
- Browser: 

**Logs:**
```
...
```
```

## Security Issues

**Do NOT open public issues for security vulnerabilities.**

Please email: **security@caresyncvision.dev**

See [SECURITY.md](SECURITY.md) for details.

## Development Workflow

### Backend Development
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m flask run --reload

# Format code
black .
flake8

# Run tests
pytest
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Format code
npm run format
npm run lint

# Production build
npm run build
```

## Project Structure

```
CareSyncVision/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   ├── database/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   ├── public/
│   └── package.json
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

## Labels & Priorities

Issues use these labels:
- `bug` - Something is broken
- `enhancement` - New feature request
- `documentation` - Docs improvement
- `good first issue` - Beginner friendly
- `help wanted` - Need community input
- `priority/high` - Major impact
- `priority/low` - Nice to have

## Release Process

Changelog format (Semantic Versioning):
```
## [1.0.0] - 2026-04-05

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Deprecated
- Soon to be removed features

### Removed
- Removed features

### Security
- Security fixes
```

## Licensing

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

- **Documentation**: See [README.md](README.md)
- **API Reference**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Email**: team@caresyncvision.dev

---

**Thank you for contributing to CareSyncVision! Together we're building better healthcare technology.** 💙
