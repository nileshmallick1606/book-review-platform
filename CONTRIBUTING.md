# Contributing to BookReview Platform

Thank you for considering contributing to the BookReview Platform! This document outlines the process and guidelines for contributing to this project.

## Git Workflow

We follow the GitHub Flow branching strategy for this project:

1. **Fork the repository** (if you're an external contributor)
2. **Create a branch** from `main` for your feature or bugfix
   - Use a descriptive name following our naming conventions
3. **Make your changes** in that branch
4. **Submit a pull request** to the `main` branch

## Branch Naming Convention

Follow this pattern for branch names:

- `feature/short-description` - For new features
- `bugfix/short-description` - For bug fixes
- `hotfix/short-description` - For critical fixes that need immediate attention
- `docs/short-description` - For documentation updates
- `refactor/short-description` - For code refactoring with no feature changes

Examples:
- `feature/user-authentication`
- `bugfix/review-submission-error`
- `docs/api-endpoints`

## Commit Messages

Follow these guidelines for commit messages:

- Use the imperative mood ("Add feature" not "Added feature")
- First line should be 50 characters or less
- Reference issue numbers at the end when applicable
- Consider using semantic prefixes:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `style:` for formatting changes
  - `refactor:` for refactoring code
  - `test:` for adding tests
  - `chore:` for maintenance tasks

Example:
```
feat: add book search functionality

Implement search by title and author with pagination.
Closes #123
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation as needed
3. Include tests for new functionality
4. Fill out the pull request template completely
5. Request a code review from a team member
6. Address any feedback from reviewers
7. Once approved, a maintainer will merge your PR

## Code Style

- Follow the ESLint and Prettier configurations
- Write tests for all new functionality
- Maintain or improve code coverage with tests
- Document public APIs and complex logic

## Development Environment

See the README.md files in the frontend and backend directories for detailed setup instructions.

## Communication

- Use GitHub Issues for bug reports and feature requests
- For major changes, please open an issue first to discuss what you would like to change

Thank you for contributing to the BookReview Platform!
