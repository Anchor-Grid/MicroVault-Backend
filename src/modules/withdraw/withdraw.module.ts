import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { WithdrawService } from './withdraw.service';
import { WithdrawController } from './withdraw.controller';
import { VaultModule } from '../vault/vault.module';
import { StellarModule } from '../stellar/stellar.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), VaultModule, StellarModule],
  providers: [WithdrawService],
  controllers: [WithdrawController],
})
export class WithdrawModule {}
