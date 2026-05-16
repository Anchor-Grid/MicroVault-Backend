import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType } from './notification.entity';
import { Vault, VaultStatus } from '../vault/vault.entity';
import { MailService } from './mail.service';

const MILESTONES = [25, 50, 75, 100];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(Vault) private vaultRepo: Repository<Vault>,
    private mail: MailService,
  ) {}

  async notifyDeposit(userId: string, vault: Vault) {
    const progress = this.calcProgress(vault);

    await this.create(userId, {
      type: NotificationType.DEPOSIT_CONFIRMED,
      title: 'Deposit Confirmed',
      message: `Your deposit to "${vault.name}" was confirmed. Progress: ${progress}%`,
      metadata: { vaultId: vault.id, progress },
    });

    const hit = MILESTONES.find((m) => progress >= m && this.justCrossed(vault, m));
    if (hit) {
      await this.create(userId, {
        type: NotificationType.MILESTONE,
        title: `🎉 ${hit}% Milestone Reached!`,
        message: `Your vault "${vault.name}" has reached ${hit}% of its goal!`,
        metadata: { vaultId: vault.id, milestone: hit },
      });
    }
  }

  async getForUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async markRead(id: string, userId: string) {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  /** Daily cron: remind users whose vault deadline is within 7 days */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDeadlineReminders() {
    const soon = new Date(Date.now() + 7 * 86_400_000);
    const vaults = await this.vaultRepo
      .createQueryBuilder('v')
      .where('v.deadline <= :soon', { soon })
      .andWhere('v.deadline > NOW()')
      .andWhere('v.status = :status', { status: VaultStatus.ACTIVE })
      .getMany();

    for (const vault of vaults) {
      const daysLeft = Math.ceil((vault.deadline.getTime() - Date.now()) / 86_400_000);
      await this.create(vault.ownerId, {
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Vault Deadline Approaching',
        message: `Your vault "${vault.name}" deadline is in ${daysLeft} day(s).`,
        metadata: { vaultId: vault.id, daysLeft },
      });
    }
    this.logger.log(`Sent deadline reminders for ${vaults.length} vaults`);
  }

  private async create(userId: string, data: Partial<Notification>) {
    const n = this.repo.create({ ...data, userId });
    await this.repo.save(n);
    // fire-and-forget email
    this.mail.send(userId, n.title, n.message).catch(() => {});
    return n;
  }

  private calcProgress(vault: Vault): number {
    const goal = BigInt(vault.goalAmount);
    if (goal === 0n) return 0;
    return Number((BigInt(vault.currentBalance) * 100n) / goal);
  }

  /** Detect if a milestone was just crossed (previous balance was below it) */
  private justCrossed(vault: Vault, milestone: number): boolean {
    const goal = BigInt(vault.goalAmount);
    if (goal === 0n) return false;
    const current = BigInt(vault.currentBalance);
    const threshold = (goal * BigInt(milestone)) / 100n;
    return current >= threshold;
  }
}
