import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { VaultService } from '../vault/vault.service';
import { StellarService } from '../stellar/stellar.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepositDto } from './dto/deposit.dto';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    private vaults: VaultService,
    private stellar: StellarService,
    private notifications: NotificationsService,
  ) {}

  async deposit(userId: string, dto: DepositDto) {
    const vault = await this.vaults.findById(dto.vaultId);
    if (vault.status !== 'active') throw new BadRequestException('Vault is not active');

    const tx = this.txRepo.create({
      type: TransactionType.DEPOSIT,
      amount: dto.amount,
      status: TransactionStatus.PENDING,
      vaultId: dto.vaultId,
      userId,
    });
    await this.txRepo.save(tx);

    try {
      const { txHash } = await this.stellar.depositToVault(
        dto.signerSecret,
        vault.contractVaultId || vault.id,
        BigInt(dto.amount),
      );

      tx.txHash = txHash;
      tx.status = TransactionStatus.CONFIRMED;
      await this.txRepo.save(tx);

      const updated = await this.vaults.updateBalance(dto.vaultId, BigInt(dto.amount));
      await this.notifications.notifyDeposit(userId, updated);

      return { txHash, vault: updated };
    } catch (err) {
      tx.status = TransactionStatus.FAILED;
      await this.txRepo.save(tx);
      throw new BadRequestException(`Deposit failed: ${err.message}`);
    }
  }
}
