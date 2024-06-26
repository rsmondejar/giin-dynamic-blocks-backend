import { Body, Controller, Get, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { Address } from 'nodemailer/lib/mailer';

@Controller('mail')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Get('test')
  test() {
    return this.mailerService.test();
  }

  @Post('test')
  testToAddress(@Body() body: Address) {
    return this.mailerService.testToAddress({
      address: body.address,
      name: body.name,
    });
  }
}
