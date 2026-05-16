import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Horizon,
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Contract,
  SorobanRpc,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
} from '@stellar/stellar-sdk';

@Injectable()
export class StellarService implements OnModuleInit {
  private readonly logger = new Logger(StellarService.name);
  private horizon: Horizon.Server;
  private rpc: SorobanRpc.Server;
  private network: string;
  private contractId: string;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const isTestnet = this.config.get('STELLAR_NETWORK', 'testnet') === 'testnet';
    this.network = isTestnet ? Networks.TESTNET : Networks.PUBLIC;
    this.horizon = new Horizon.Server(
      this.config.get('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org'),
    );
    this.rpc = new SorobanRpc.Server(
      this.config.get('STELLAR_RPC_URL', 'https://soroban-testnet.stellar.org'),
    );
    this.contractId = this.config.get('STELLAR_CONTRACT_ID', '');
    this.logger.log(`Stellar service initialized on ${isTestnet ? 'TESTNET' : 'MAINNET'}`);
  }

  /** Build and submit a Soroban contract call */
  async invokeContract(
    callerSecret: string,
    method: string,
    args: xdr.ScVal[],
  ): Promise<{ txHash: string; result: any }> {
    const keypair = Keypair.fromSecret(callerSecret);
    const account = await this.rpc.getAccount(keypair.publicKey());
    const contract = new Contract(this.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const prepared = await this.rpc.prepareTransaction(tx);
    prepared.sign(keypair);

    const response = await this.rpc.sendTransaction(prepared);
    if (response.status === 'ERROR') {
      throw new Error(`Soroban tx failed: ${JSON.stringify(response.errorResult)}`);
    }

    const confirmed = await this.pollTransaction(response.hash);
    const result = confirmed.returnValue ? scValToNative(confirmed.returnValue) : null;
    return { txHash: response.hash, result };
  }

  /** Deposit into a vault on-chain */
  async depositToVault(callerSecret: string, vaultId: string, amountStroops: bigint) {
    return this.invokeContract(callerSecret, 'deposit', [
      nativeToScVal(vaultId, { type: 'string' }),
      nativeToScVal(amountStroops, { type: 'i128' }),
    ]);
  }

  /** Withdraw from a vault on-chain */
  async withdrawFromVault(callerSecret: string, vaultId: string, amountStroops: bigint) {
    return this.invokeContract(callerSecret, 'withdraw', [
      nativeToScVal(vaultId, { type: 'string' }),
      nativeToScVal(amountStroops, { type: 'i128' }),
    ]);
  }

  /** Fetch recent contract events for sync */
  async getContractEvents(startLedger: number) {
    const response = await this.rpc.getEvents({
      startLedger,
      filters: [{ type: 'contract', contractIds: [this.contractId] }],
    });
    return response.events;
  }

  /** Get the latest ledger number */
  async getLatestLedger(): Promise<number> {
    const { sequence } = await this.rpc.getLatestLedger();
    return sequence;
  }

  /** Get XLM balance for a public key */
  async getBalance(publicKey: string): Promise<string> {
    const account = await this.horizon.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === 'native');
    return native ? native.balance : '0';
  }

  private async pollTransaction(hash: string, attempts = 20): Promise<SorobanRpc.Api.GetSuccessfulTransactionResponse> {
    for (let i = 0; i < attempts; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const result = await this.rpc.getTransaction(hash);
      if (result.status === 'SUCCESS') return result as SorobanRpc.Api.GetSuccessfulTransactionResponse;
      if (result.status === 'FAILED') throw new Error(`Transaction failed: ${hash}`);
    }
    throw new Error(`Transaction not confirmed after ${attempts} attempts: ${hash}`);
  }
}
