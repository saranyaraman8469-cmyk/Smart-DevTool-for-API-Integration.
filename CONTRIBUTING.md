# Contributing to Smart DevTool for API Integration using AI

Thank you for your interest in contributing to our project! We welcome code contributions, bug reports, documentation updates, and feature suggestions.

Please take a moment to review this document to ensure a smooth collaboration process.

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and professional environment.

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing issues to ensure the bug hasn't already been reported.
- Open a new issue with a clear title and description.
- Include steps to reproduce, expected vs. actual behavior, and any relevant logs or screenshots.

### 2. Suggesting Enhancements
- Check if the feature is already requested or discussed.
- Open an issue describing the proposed enhancement:
  - What is the use case?
  - What value does it add?
  - Any ideas for implementation?

### 3. Submitting Code Changes
1. Fork the repository and create your branch from `main`.
2. Follow our branch naming convention:
   - `feature/your-feature-name`
   - `bugfix/issue-description`
   - `docs/update-docs`
3. If you've added code that should be tested, add tests.
4. Ensure the test suite passes locally.
5. Format your code using `black` for Python and `prettier` for TypeScript.
6. Commit your changes. We recommend following standard conventional commits:
   - `feat: add AI chat with documentation endpoint`
   - `fix: resolve auth token expiration parsing bug`
   - `docs: update setup instructions in README`
7. Push to your fork and submit a Pull Request (PR) to the `main` branch.

## Development Guidelines

### Backend (FastAPI)
- Use PEP 8 styling conventions.
- Include proper type hints for all function signatures.
- Write unit tests under the `backend/tests/` folder.
- Ensure all environment variables are declared in `.env.example`.

### Frontend (Next.js & Tailwind CSS)
- Write modern TypeScript components using standard React patterns.
- Ensure responsiveness across mobile, tablet, and desktop layouts.
- Avoid using inline styles; leverage Tailwind classes and Tailwind configurations.
- Run `npm run build` locally to verify there are no compilation or typescript errors.

## Code Review Process

All submissions, including submissions by project members, require review. We look for:
- Code quality, readability, and clean architecture (SOLID principles).
- Coverage of edge cases.
- Performance and security implications.
- Clear unit and integration testing.
