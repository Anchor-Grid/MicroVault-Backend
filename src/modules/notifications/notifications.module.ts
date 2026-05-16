import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { Vault } from '../vault/vault.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Vault]), UsersModule],
  providers: [NotificationsService, MailService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
