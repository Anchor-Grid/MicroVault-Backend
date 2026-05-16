# MicroVault — Stellar & Soroban Integration

> Back to [README](../README.md) · [Architecture](./ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

---

## Overview

MicroVault uses the **Stellar blockchain** for all financial operations. Savings are locked in a **Soroban smart contract** — not held by the backend. The backend is a coordinator: it builds transactions, submits them, and syncs the resulting state to PostgreSQL.

---

## Stellar Concepts Used

| Concept | Role in MicroVault |
|---|---|
| **Stellar Keypair** | Each user links a Stellar public key (`G...`) to their account |
| **XLM Stroops** | All amounts are in stroops (1 XLM = 10,000,000 stroops) |
| **Soroban RPC** | Used to invoke contract functions and fetch events |
| **Horizon** | Used to query account balances |
| **Transaction Builder** | Constructs Soroban `InvokeHostFunction` operations |

---

## Setting Up a Testnet Account

1. Go to [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Generate a keypair — save the **Secret Key** (`S...`) and **Public Key** (`G...`)
3. Click "Fund with Friendbot" to get 10,000 testnet XLM
4. Set `STELLAR_ADMIN_SECRET` in your `.env` to the secret key

---

## Deploying the Soroban Contract

MicroVault expects a Soroban contract with the following interface:

```rust
// Expected contract interface (Rust/Soroban)
pub fn deposit(env: Env, vault_id: String, amount: i128);
pub fn withdraw(env: Env, vault_id: String, amount: i128);
pub fn get_balance(env: Env, vault_id: String) -> i128;
```

### Deploy steps (Stellar CLI)

```bash
# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Build your contract
stellar contract build

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/microvault.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet

# The output is your CONTRACT_ID — set it as STELLAR_CONTRACT_ID in .env
```

---

## How `StellarService` Works

### `invokeContract(callerSecret, method, args)`

The core method. It:

1. Loads the caller's account sequence number from Soroban RPC
2. Builds a `TransactionBuilder` with a `Contract.call(method, ...args)` operation
3. Calls `rpc.prepareTransaction()` — this simulates the transaction and attaches the correct resource fees
4. Signs the transaction with the caller's keypair
5. Submits via `rpc.sendTransaction()`
6. Polls `rpc.getTransaction(hash)` every 1.5s until `SUCCESS` or `FAILED`

```typescript
// Example: deposit 50 XLM into vault "abc-123"
await stellarService.invokeContract(
  'SXXXXX...',
  'deposit',
  [
    nativeToScVal('abc-123', { type: 'string' }),
    nativeToScVal(500_000_000n, { type: 'i128' }),
  ]
);
```

### `depositToVault(callerSecret, vaultId, amountStroops)`

Convenience wrapper around `invokeContract` for the `deposit` method.

### `withdrawFromVault(callerSecret, vaultId, amountStroops)`

Convenience wrapper for the `withdraw` method.

### `getContractEvents(startLedger)`

Fetches all events emitted by the contract since `startLedger`. Used by the event listener to sync state.

---

## Transaction Signing Flow

```
Client                    Backend                   Stellar Network
  │                          │                            │
  │  POST /vault/deposit      │                            │
  │  { vaultId, amount,       │                            │
  │    signerSecret }         │                            │
  │─────────────────────────►│                            │
  │                          │  prepareTransaction()      │
  │                          │──────────────────────────►│
  │                          │◄──────────────────────────│
  │                          │  (simulated + fees)        │
  │                          │                            │
  │                          │  sign(keypair)             │
  │                          │  sendTransaction()         │
  │                          │──────────────────────────►│
  │                          │◄──────────────────────────│
  │                          │  { hash, status: PENDING } │
  │                          │                            │
  │                          │  poll getTransaction(hash) │
  │                          │──────────────────────────►│
  │                          │◄──────────────────────────│
  │                          │  { status: SUCCESS }       │
  │                          │                            │
  │  { txHash, vault }       │                            │
  │◄─────────────────────────│                            │
```

> **Security note:** Passing `signerSecret` to the backend is appropriate for server-to-server integrations. For user-facing mobile/web apps, implement **client-side signing**: the client signs the XDR locally and submits the signed transaction to the backend (or directly to Stellar RPC). The backend should then accept a `signedXdr` field instead of `signerSecret`.

---

## Event Listener

The `EventsService` polls for contract events every 30 seconds:

```typescript
@Cron('*/30 * * * * *')
async syncContractEvents() {
  const events = await this.stellar.getContractEvents(SYNC_STATE.lastLedger);
  for (const event of events) {
    await this.processEvent(event); // idempotent — checks txHash
  }
}
```

Expected event structure emitted by the Soroban contract:

```rust
// Deposit event
env.events().publish(
  (symbol!("deposit"),),
  map! { &env, symbol!("vault_id") => vault_id, symbol!("amount") => amount }
);

// Withdraw event
env.events().publish(
  (symbol!("withdraw"),),
  map! { &env, symbol!("vault_id") => vault_id, symbol!("amount") => amount }
);
```

---

## Network Configuration

| Variable | Testnet | Mainnet |
|---|---|---|
| `STELLAR_NETWORK` | `testnet` | `mainnet` |
| `STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | `https://soroban-rpc.mainnet.stellar.gateway.fm` |

---

## Useful Resources

- [Stellar Developer Docs](https://developers.stellar.org)
- [Soroban Smart Contracts](https://soroban.stellar.org)
- [Stellar Laboratory](https://laboratory.stellar.org)
- [Stellar SDK for JavaScript](https://github.com/stellar/js-stellar-sdk)
- [Soroban RPC API Reference](https://developers.stellar.org/docs/data/rpc)

---

> See also: [ARCHITECTURE.md](./ARCHITECTURE.md) · [CONTRIBUTING.md](./CONTRIBUTING.md)
