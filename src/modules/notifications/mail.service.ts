import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService, private users: UsersService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT', 587),
      auth: { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') },
    });
  }

  async send(userId: string, subject: string, text: string) {
    const user = await this.users.findById(userId);
    if (!user?.email) return;
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM', 'MicroVault <no-reply@microvault.finance>'),
        to: user.email,
        subject,
        text,
      });
    } catch (err) {
      this.logger.warn(`Email failed for ${user.email}: ${err.message}`);
    }
  }
}
