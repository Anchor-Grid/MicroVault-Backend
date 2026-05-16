import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { VaultModule } from '../vault/vault.module';
import { StellarModule } from '../stellar/stellar.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), VaultModule, StellarModule, NotificationsModule],
  providers: [DepositService],
  controllers: [DepositController],
})
export class DepositModule {}
