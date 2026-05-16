import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/users/users.module';
import { VaultModule } from './modules/vault/vault.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { WithdrawModule } from './modules/withdraw/withdraw.module';
import { StellarModule } from './modules/stellar/stellar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 30),
        },
      ],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    VaultModule,
    DepositModule,
    WithdrawModule,
    StellarModule,
    NotificationsModule,
    EventsModule,
  ],
})
export class AppModule {}
