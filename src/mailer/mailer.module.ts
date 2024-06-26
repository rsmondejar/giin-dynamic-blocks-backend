import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ConfigModule } from '@nestjs/config';
import { MailerController } from './mailer.controller';

@Module({
  controllers: [MailerController],
  providers: [MailerService],
  imports: [ConfigModule.forRoot()],
})
export class MailerModule {}
