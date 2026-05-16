import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vault, VaultStatus } from './vault.entity';
import { CreateVaultDto } from './dto/create-vault.dto';

@Injectable()
export class VaultService {
  constructor(@InjectRepository(Vault) private repo: Repository<Vault>) {}

  async create(ownerId: string, dto: CreateVaultDto): Promise<Vault> {
    const vault = this.repo.create({
      ...dto,
      ownerId,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    });
    return this.repo.save(vault);
  }

  async findById(id: string): Promise<Vault> {
    const vault = await this.repo.findOne({ where: { id }, relations: ['owner'] });
    if (!vault) throw new NotFoundException('Vault not found');
    return vault;
  }

  async findByOwner(ownerId: string): Promise<Vault[]> {
    return this.repo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  async getGoalProgress(id: string) {
    const vault = await this.findById(id);
    const current = BigInt(vault.currentBalance);
    const goal = BigInt(vault.goalAmount);
    const progress = goal > 0n ? Number((current * 100n) / goal) : 0;
    const remaining = goal > current ? (goal - current).toString() : '0';
    const timeLeft = vault.deadline
      ? Math.max(0, Math.ceil((vault.deadline.getTime() - Date.now()) / 86_400_000))
      : null;

    return { progress, remaining, timeLeft, currentBalance: vault.currentBalance, goalAmount: vault.goalAmount };
  }

  async updateBalance(id: string, delta: bigint): Promise<Vault> {
    const vault = await this.findById(id);
    const newBalance = BigInt(vault.currentBalance) + delta;
    if (newBalance < 0n) throw new ForbiddenException('Insufficient vault balance');
    vault.currentBalance = newBalance.toString();
    if (newBalance >= BigInt(vault.goalAmount)) vault.status = VaultStatus.COMPLETED;
    return this.repo.save(vault);
  }

  async setContractVaultId(id: string, contractVaultId: string) {
    await this.repo.update(id, { contractVaultId });
  }
}
