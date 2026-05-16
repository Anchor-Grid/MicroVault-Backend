import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { VaultService } from '../vault/vault.service';
import { StellarService } from '../stellar/stellar.service';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class WithdrawService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    private vaults: VaultService,
    private stellar: StellarService,
  ) {}

  async withdraw(userId: string, dto: WithdrawDto) {
    const vault = await this.vaults.findById(dto.vaultId);
    if (vault.ownerId !== userId) throw new BadRequestException('Only the vault owner can withdraw');
    if (BigInt(vault.currentBalance) < BigInt(dto.amount)) {
      throw new BadRequestException('Insufficient vault balance');
    }

    const tx = this.txRepo.create({
      type: TransactionType.WITHDRAW,
      amount: dto.amount,
      status: TransactionStatus.PENDING,
      vaultId: dto.vaultId,
      userId,
    });
    await this.txRepo.save(tx);

    try {
      const { txHash } = await this.stellar.withdrawFromVault(
        dto.signerSecret,
        vault.contractVaultId || vault.id,
        BigInt(dto.amount),
      );

      tx.txHash = txHash;
      tx.status = TransactionStatus.CONFIRMED;
      await this.txRepo.save(tx);

      const updated = await this.vaults.updateBalance(dto.vaultId, -BigInt(dto.amount));
      return { txHash, vault: updated };
    } catch (err) {
      tx.status = TransactionStatus.FAILED;
      await this.txRepo.save(tx);
      throw new BadRequestException(`Withdrawal failed: ${err.message}`);
    }
  }
}
