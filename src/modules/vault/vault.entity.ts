import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Transaction } from '../transactions/transaction.entity';

export enum VaultStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

@Entity('vaults')
export class Vault {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  /** Target savings amount in XLM stroops (1 XLM = 10_000_000 stroops) */
  @Column({ type: 'bigint' })
  goalAmount: string;

  /** Current balance in stroops */
  @Column({ type: 'bigint', default: '0' })
  currentBalance: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'enum', enum: VaultStatus, default: VaultStatus.ACTIVE })
  status: VaultStatus;

  /** On-chain contract vault ID */
  @Column({ nullable: true })
  contractVaultId: string;

  @ManyToOne(() => User, (user) => user.vaults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Transaction, (tx) => tx.vault)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
