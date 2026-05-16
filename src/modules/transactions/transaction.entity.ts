import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Vault } from '../vault/vault.entity';
import { User } from '../users/user.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  /** Amount in XLM stroops */
  @Column({ type: 'bigint' })
  amount: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  /** Stellar transaction hash */
  @Column({ nullable: true })
  txHash: string;

  /** XDR of the signed transaction */
  @Column({ type: 'text', nullable: true })
  txXdr: string;

  @ManyToOne(() => Vault, (vault) => vault.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vaultId' })
  vault: Vault;

  @Column()
  vaultId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
