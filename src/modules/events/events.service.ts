import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { StellarService } from '../stellar/stellar.service';
import { Transaction, TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { VaultService } from '../vault/vault.service';

/** Tracks the last synced ledger to avoid re-processing events */
const SYNC_STATE = { lastLedger: 0 };

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private stellar: StellarService,
    private vaults: VaultService,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  ) {}

  async onModuleInit() {
    try {
      SYNC_STATE.lastLedger = (await this.stellar.getLatestLedger()) - 100;
      this.logger.log(`Event listener initialized from ledger ${SYNC_STATE.lastLedger}`);
    } catch {
      this.logger.warn('Could not initialize event listener — Stellar RPC unreachable');
    }
  }

  /** Poll contract events every 30 seconds */
  @Cron('*/30 * * * * *')
  async syncContractEvents() {
    if (!SYNC_STATE.lastLedger) return;
    try {
      const events = await this.stellar.getContractEvents(SYNC_STATE.lastLedger);
      if (!events.length) return;

      for (const event of events) {
        await this.processEvent(event);
      }

      const latest = Math.max(...events.map((e) => e.ledger));
      SYNC_STATE.lastLedger = latest + 1;
      this.logger.debug(`Synced ${events.length} events up to ledger ${latest}`);
    } catch (err) {
      this.logger.warn(`Event sync failed: ${err.message}`);
    }
  }

  private async processEvent(event: any) {
    const topic = event.topic?.[0]?.value?.toString();
    const txHash = event.txHash;

    // Avoid duplicate processing
    const existing = await this.txRepo.findOne({ where: { txHash } });
    if (existing) return;

    if (topic === 'deposit') {
      const vaultId = event.value?.map?.vault_id;
      const amount = event.value?.map?.amount;
      if (!vaultId || !amount) return;

      await this.txRepo.save(
        this.txRepo.create({
          type: TransactionType.DEPOSIT,
          amount: amount.toString(),
          status: TransactionStatus.CONFIRMED,
          txHash,
          vaultId,
        }),
      );
      await this.vaults.updateBalance(vaultId, BigInt(amount));
    }

    if (topic === 'withdraw') {
      const vaultId = event.value?.map?.vault_id;
      const amount = event.value?.map?.amount;
      if (!vaultId || !amount) return;

      await this.txRepo.save(
        this.txRepo.create({
          type: TransactionType.WITHDRAW,
          amount: amount.toString(),
          status: TransactionStatus.CONFIRMED,
          txHash,
          vaultId,
        }),
      );
      await this.vaults.updateBalance(vaultId, -BigInt(amount));
    }
  }
}
