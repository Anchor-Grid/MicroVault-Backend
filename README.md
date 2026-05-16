
<div align="center">

# 🏦 MicroVault

**Group savings (Ajo/Esusu) on-chain — powered by Stellar & Soroban**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue)](https://stellar.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/CONTRIBUTING.md)

</div>

---

## What is MicroVault?

MicroVault is an open-source backend for a **Web3 fintech savings platform** inspired by traditional African group savings systems — *Ajo* and *Esusu*. Users create savings vaults with a goal amount and deadline, deposit funds that are locked on the Stellar blockchain via a Soroban smart contract, and track their progress toward the goal.

Every deposit and withdrawal is a real on-chain transaction. The backend syncs contract events in real time, sends milestone notifications, and enforces goal-based withdrawal rules.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **Vault Management** | Create, view, and track savings vaults with goals and deadlines |
| **Deposits** | Sign and submit on-chain deposit transactions via Soroban |
| **Withdrawals** | Owner-only withdrawals with balance enforcement |
| **Goal Tracking** | Real-time progress %, remaining amount, and days left |
| **Milestone Alerts** | Automatic notifications at 25%, 50%, 75%, and 100% |
| **Deadline Reminders** | Daily cron job alerts when a vault deadline is within 7 days |
| **Event Listener** | Polls Soroban contract events every 30s and syncs to the database |
| **JWT Auth** | Secure email/password authentication with JWT tokens |
| **Swagger UI** | Auto-generated interactive API docs at `/api/v1/docs` |
| **Rate Limiting** | Configurable per-IP throttling on all endpoints |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A Stellar testnet account ([create one](https://laboratory.stellar.org/#account-creator?network=test))
- A deployed Soroban savings contract (see [Stellar Integration docs](./docs/STELLAR_INTEGRATION.md))

### 1. Clone and install

```bash
git clone https://github.com/your-org/microvault-backend.git
cd microvault-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials, JWT secret, and Stellar config
```

See [Environment Variables](#environment-variables) for a full reference.

### 3. Set up the database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE microvault;"

# Run migrations
npm run migration:run
```

### 4. Start the server

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build && npm start
```

The API will be available at `http://localhost:3000/api/v1`.  
Swagger UI: `http://localhost:3000/api/v1/docs`

---

## API Reference

All endpoints are prefixed with `/api/v1`. Protected routes require a `Bearer` JWT token.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive a JWT |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/user/me` | ✅ | Get current user profile |
| `GET` | `/user/vaults` | ✅ | List all vaults owned by the user |
| `PATCH` | `/user/me/stellar-key` | ✅ | Link a Stellar public key |

### Vaults

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/vault/create` | ✅ | Create a new savings vault |
| `GET` | `/vault/:id` | ✅ | Get vault details |
| `GET` | `/vault/:id/progress` | ✅ | Get goal progress, remaining, and time left |

### Deposits & Withdrawals

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/vault/deposit` | ✅ | Deposit into a vault (submits on-chain) |
| `POST` | `/vault/withdraw` | ✅ | Withdraw from a vault (owner only) |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | ✅ | Get all notifications |
| `PATCH` | `/notifications/:id/read` | ✅ | Mark a notification as read |

> **Full interactive docs** are available at `/api/v1/docs` when the server is running.

---

## Project Structure

```
src/
├── main.ts                        # App entry point, Swagger setup
├── app.module.ts                  # Root module
├── config/
│   └── database.config.ts         # TypeORM factory config
├── database/
│   ├── data-source.ts             # TypeORM CLI data source
│   └── migrations/                # Database migrations
├── common/
│   ├── filters/
│   │   └── global-exception.filter.ts
│   └── guards/
│       └── throttler.guard.ts
└── modules/
    ├── auth/                      # JWT auth (register, login)
    ├── users/                     # User profiles, Stellar key linking
    ├── vault/                     # Vault CRUD + goal tracking
    ├── deposit/                   # Deposit flow (on-chain + DB)
    ├── withdraw/                  # Withdrawal flow (on-chain + DB)
    ├── transactions/              # Shared Transaction entity
    ├── stellar/                   # Stellar SDK + Soroban RPC wrapper
    ├── notifications/             # In-app + email notifications, cron jobs
    └── events/                    # Contract event listener (30s poll)
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for a full system design breakdown.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `microvault` | Database name |
| `JWT_SECRET` | — | **Required.** Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |
| `STELLAR_NETWORK` | `testnet` | `testnet` or `mainnet` |
| `STELLAR_HORIZON_URL` | testnet URL | Horizon server URL |
| `STELLAR_RPC_URL` | testnet URL | Soroban RPC URL |
| `STELLAR_CONTRACT_ID` | — | Deployed Soroban contract address |
| `STELLAR_ADMIN_SECRET` | — | Admin keypair secret (for admin ops) |
| `SMTP_HOST` | — | SMTP server for email notifications |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `THROTTLE_TTL` | `60` | Rate limit window in seconds |
| `THROTTLE_LIMIT` | `30` | Max requests per window |

Copy `.env.example` to `.env` and fill in the required values.

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, data flow, module breakdown |
| [STELLAR_INTEGRATION.md](./docs/STELLAR_INTEGRATION.md) | Soroban contract interface, signing flow |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | How to contribute, branch strategy, PR process |
| [CHANGELOG.md](./docs/CHANGELOG.md) | Version history and release notes |

---

## Contributing

MicroVault is open source and welcomes contributions. Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) before opening a pull request.

---

## License

[MIT](./LICENSE) © MicroVault Contributors
