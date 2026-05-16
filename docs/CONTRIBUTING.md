# Contributing to MicroVault

> Back to [README](../README.md) · [Architecture](./ARCHITECTURE.md)

Thank you for your interest in contributing to MicroVault! This document covers everything you need to get started — from setting up your local environment to getting your pull request merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

MicroVault follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold a welcoming and respectful environment for everyone.

---

## Ways to Contribute

- **Bug fixes** — open an issue first, then submit a PR
- **New features** — discuss in an issue before building
- **Documentation** — typos, clarity, missing examples
- **Tests** — increase coverage, add edge cases
- **Soroban contract** — improvements to the on-chain savings contract

---

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/microvault-backend.git
cd microvault-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Fill in DB credentials and Stellar testnet config
```

### 4. Start PostgreSQL

```bash
# Using Docker (recommended)
docker run -d \
  --name microvault-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=microvault \
  -p 5432:5432 \
  postgres:16-alpine
```

### 5. Run migrations

```bash
npm run migration:run
```

### 6. Start the dev server

```bash
npm run start:dev
```

The API is at `http://localhost:3000/api/v1` and Swagger at `http://localhost:3000/api/v1/docs`.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `develop` | Integration branch for features |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation only |
| `chore/<name>` | Tooling, deps, config |

**Always branch from `develop`, not `main`.**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/my-feature
```

---

## Commit Convention

MicroVault uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates |
| `perf` | Performance improvement |

### Examples

```
feat(vault): add goal progress endpoint
fix(deposit): handle Soroban RPC timeout gracefully
docs(stellar): add client-side signing guide
chore(deps): upgrade @stellar/stellar-sdk to 12.1.0
```

---

## Pull Request Process

1. **Open an issue first** for anything beyond a trivial fix.
2. **Keep PRs focused** — one feature or fix per PR.
3. **Write tests** for new behaviour.
4. **Update docs** if you change an API contract or add a module.
5. **Fill in the PR template** — summary, what was tested, any known limitations.
6. **Pass CI** — all tests and lint checks must be green.
7. **Request a review** from a maintainer.

PRs that change the Stellar integration or database schema require two approvals.

---

## Code Style

- TypeScript strict mode is enabled — no `any` unless absolutely necessary.
- Use `async/await` over raw Promises.
- Keep services thin — business logic in services, not controllers.
- No magic numbers — use named constants or config values.
- Run the linter before pushing:

```bash
npm run lint
```

---

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### What to test

- **Services** — mock the repository and external services (Stellar, mail).
- **Controllers** — use `@nestjs/testing` `TestingModule` with mocked services.
- **Edge cases** — insufficient balance, expired deadline, duplicate txHash.

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/your-org/microvault-backend/issues/new?template=bug_report.md) with:

- A clear title
- Steps to reproduce
- Expected vs actual behaviour
- Environment (Node version, OS, Stellar network)
- Relevant logs or error messages

---

## Suggesting Features

Open a [GitHub Issue](https://github.com/your-org/microvault-backend/issues/new?template=feature_request.md) with:

- The problem you're solving
- Your proposed solution
- Alternatives you considered
- Any relevant Stellar/Soroban constraints

---

## Questions?

Open a [Discussion](https://github.com/your-org/microvault-backend/discussions) or reach out in the project's community channel.

---

> See also: [ARCHITECTURE.md](./ARCHITECTURE.md) · [STELLAR_INTEGRATION.md](./STELLAR_INTEGRATION.md) · [CHANGELOG.md](./CHANGELOG.md)
