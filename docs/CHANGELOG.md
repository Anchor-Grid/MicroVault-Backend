# Changelog

> Back to [README](../README.md)

All notable changes to MicroVault are documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

### Added
- Initial project scaffold with NestJS 10
- JWT authentication (register, login)
- Vault CRUD with goal tracking (`progress`, `remaining`, `timeLeft`)
- Deposit flow with Soroban contract invocation
- Withdrawal flow with owner-only enforcement
- Stellar/Soroban integration module (`StellarService`)
- Contract event listener (30-second cron poll)
- Notifications system: in-app + email (Nodemailer)
- Milestone alerts at 25%, 50%, 75%, 100%
- Daily deadline reminder cron job (7-day window)
- Global exception filter
- Rate limiting via `@nestjs/throttler`
- Swagger UI at `/api/v1/docs`
- TypeORM migrations setup
- Full documentation: README, ARCHITECTURE, STELLAR_INTEGRATION, CONTRIBUTING

---

## How to Read This File

Each release section contains:

- **Added** — new features
- **Changed** — changes to existing functionality
- **Deprecated** — features that will be removed in a future release
- **Removed** — features removed in this release
- **Fixed** — bug fixes
- **Security** — security patches

---

[Unreleased]: https://github.com/your-org/microvault-backend/compare/HEAD
