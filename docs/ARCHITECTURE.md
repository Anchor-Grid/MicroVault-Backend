# MicroVault — Architecture

> Back to [README](../README.md) · [Stellar Integration](./STELLAR_INTEGRATION.md) · [Contributing](./CONTRIBUTING.md)

---

## Overview

MicroVault is a **NestJS monolith** with a clear module boundary between business logic and blockchain interaction. The architecture is designed to be:

- **Blockchain-first** — every deposit and withdrawal is an on-chain transaction; the database is a read-optimised mirror of contract state.
- **Event-driven** — a background poller syncs Soroban contract events to the database every 30 seconds, keeping state consistent even if the API was offline during a transaction.
- **Modular** — each domain (vault, deposit, withdraw, notifications) is a self-contained NestJS module with its own controller, service, and entity.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Mobile / Web)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
┌────────────────────────────▼────────────────────────────────────┐
│                        NestJS API Server                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Auth   │  │  Users   │  │  Vault   │  │ Notifications │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ Deposit  │  │ Withdraw │  │     Events (30s cron poll)   │  │
│  └────┬─────┘  └────┬─────┘  └──────────────┬───────────────┘  │
│       │             │                        │                  │
│  ┌────▼─────────────▼────────────────────────▼───────────────┐  │
│  │                   StellarService                          │  │
│  │   (Horizon SDK + Soroban RPC + contract invocation)       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼──────┐  ┌────────▼───────┐  ┌──────▼──────────┐
│   PostgreSQL   │  │  Stellar RPC   │  │  Horizon Server │
│   (TypeORM)    │  │  (Soroban)     │  │  (Balances)     │
└────────────────┘  └────────────────┘  └─────────────────┘
```

---

## Module Breakdown

### `AuthModule`
Handles registration and login. Issues signed JWTs. Uses `bcrypt` for password hashing. The `JwtStrategy` validates tokens on every protected request.

### `UsersModule`
Manages user profiles. Exposes `GET /user/me`, `GET /user/vaults`, and `PATCH /user/me/stellar-key`. The Stellar public key is stored here and used to verify ownership during withdrawals.

### `VaultModule`
Core savings logic. A vault has:
- `goalAmount` — target in XLM stroops
- `currentBalance` — live balance, updated on every confirmed transaction
- `deadline` — optional ISO date
- `status` — `active | completed | paused | cancelled`

The `getGoalProgress` method returns `{ progress, remaining, timeLeft }` computed from live DB values.

### `DepositModule`
1. Validates the vault is active.
2. Creates a `PENDING` transaction record.
3. Calls `StellarService.depositToVault()` — builds, signs, and submits the Soroban call.
4. On success: marks transaction `CONFIRMED`, updates vault balance, triggers notifications.
5. On failure: marks transaction `FAILED`, surfaces the error.

### `WithdrawModule`
Same flow as deposit, with two extra guards:
- Caller must be the vault owner.
- Requested amount must not exceed `currentBalance`.

### `StellarModule`
Thin wrapper around `@stellar/stellar-sdk`. Responsibilities:
- Build and submit Soroban contract calls (`invokeContract`)
- Poll for transaction confirmation (`pollTransaction`)
- Fetch contract events for the event listener
- Query XLM balances via Horizon

See [STELLAR_INTEGRATION.md](./STELLAR_INTEGRATION.md) for the full contract interface.

### `NotificationsModule`
Two delivery channels:
1. **In-app** — stored in the `notifications` table, fetched via `GET /notifications`.
2. **Email** — sent via Nodemailer (fire-and-forget, failures are logged but not surfaced).

Milestone detection runs after every deposit. A daily cron job (`@Cron(EVERY_DAY_AT_9AM)`) scans for vaults with deadlines within 7 days and sends reminders.

### `EventsModule`
A `@Cron('*/30 * * * * *')` job polls `StellarService.getContractEvents()` from the last synced ledger. For each `deposit` or `withdraw` event:
1. Checks for duplicate `txHash` to ensure idempotency.
2. Creates a `CONFIRMED` transaction record.
3. Updates the vault balance.

This ensures the database stays consistent even if a transaction was submitted outside the API (e.g., directly from a wallet).

---

## Data Model

```
users
  id (uuid PK)
  email (unique)
  password (bcrypt hash)
  displayName
  stellarPublicKey
  isActive
  createdAt / updatedAt

vaults
  id (uuid PK)
  name
  description
  goalAmount (bigint, stroops)
  currentBalance (bigint, stroops)
  deadline (timestamp)
  status (enum: active|completed|paused|cancelled)
  contractVaultId
  ownerId (FK → users)
  createdAt / updatedAt

transactions
  id (uuid PK)
  type (enum: deposit|withdraw)
  amount (bigint, stroops)
  status (enum: pending|confirmed|failed)
  txHash
  txXdr
  vaultId (FK → vaults)
  userId (FK → users)
  createdAt

notifications
  id (uuid PK)
  type (enum: goal_progress|milestone|deadline_reminder|deposit_confirmed|withdraw_confirmed)
  title
  message
  isRead
  metadata (jsonb)
  userId (FK → users)
  createdAt
```

---

## Amount Representation

All monetary amounts are stored and transmitted as **XLM stroops** (integers). 1 XLM = 10,000,000 stroops. This avoids floating-point precision issues entirely.

```
1 XLM  = "10000000"
0.5 XLM = "5000000"
```

---

## Security

| Layer | Mechanism |
|---|---|
| Authentication | JWT Bearer tokens (HS256) |
| Password storage | bcrypt (cost factor 10) |
| Input validation | `class-validator` + `ValidationPipe` (whitelist mode) |
| Rate limiting | `@nestjs/throttler` (configurable TTL + limit) |
| Error handling | `GlobalExceptionFilter` — never leaks stack traces to clients |
| Ownership checks | Vault owner ID compared to JWT subject on every withdrawal |

---

## Deployment Considerations

- Set `DB_SYNC=false` in production and always use migrations.
- Store `JWT_SECRET` and `STELLAR_ADMIN_SECRET` in a secrets manager (AWS Secrets Manager, Vault, etc.).
- The `signerSecret` in deposit/withdraw requests should only be used in trusted server-to-server flows. For user-facing apps, implement client-side signing and submit the signed XDR instead.
- The event listener is a single-process cron job. For high-availability deployments, use a distributed lock (Redis `SET NX`) to prevent duplicate processing across replicas.

---

> See also: [STELLAR_INTEGRATION.md](./STELLAR_INTEGRATION.md) · [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md)
