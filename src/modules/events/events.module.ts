import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { EventsService } from './events.service';
import { StellarModule } from '../stellar/stellar.module';
import { VaultModule } from '../vault/vault.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), StellarModule, VaultModule],
  providers: [EventsService],
})
export class EventsModule {}
