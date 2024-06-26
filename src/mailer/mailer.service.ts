import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto } from './interfaces/mail.interface';
import Mail, { Address } from 'nodemailer/lib/mailer';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}

  public mailTransport() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      tls: {
        // must provide server name, otherwise TLS certificate check will fail
        servername: this.configService.get<string>('MAIL_SERVER_NAME'),
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(dto: SendEmailDto) {
    const { from, recipients, subject, html } = dto;

    const transporter = this.mailTransport();

    const options: Mail.Options = {
      from: from ?? {
        name: this.configService.get<string>('MAIL_FROM_NAME'),
        address: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      },
      to: recipients,
      subject,
      html,
    };
    try {
      const info: SentMessageInfo = await transporter.sendMail(options);
      return info;
    } catch (error) {
      throw new Error(`Error sending email: ${error}`);
    }
  }

  async test() {
    const transporter = this.mailTransport();

    const options: Mail.Options = {
      from: {
        name: this.configService.get<string>('MAIL_FROM_NAME'),
        address: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      },
      to: [
        {
          name: this.configService.get<string>('MAIL_FROM_NAME'),
          address: this.configService.get<string>('MAIL_FROM_ADDRESS'),
        },
      ],
      subject: 'Test email',
      html: '<p>Test <strong>email</strong>',
    };
    try {
      const info: SentMessageInfo = await transporter.sendMail(options);
      return info;
    } catch (error) {
      throw new Error(`Error sending email: ${error}`);
    }
  }

  async testToAddress(to: Address) {
    const transporter = this.mailTransport();

    const options: Mail.Options = {
      from: {
        name: this.configService.get<string>('MAIL_FROM_NAME'),
        address: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      },
      to: [to],
      subject: 'Test email',
      html: `<p>Test <strong>${to.name}</strong> email <strong>${to.address}</strong>`,
    };
    try {
      const info: SentMessageInfo = await transporter.sendMail(options);
      return info;
    } catch (error) {
      throw new Error(`Error sending email: ${error}`);
    }
  }
}
