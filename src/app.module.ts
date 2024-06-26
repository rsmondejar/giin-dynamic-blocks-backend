import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { FormsSubmissionsModule } from './forms-submissions/forms-submissions.module';
import { MailerModule } from './mailer/mailer.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    UsersModule,
    AuthModule,
    FormsModule,
    FormsSubmissionsModule,
    MailerModule,
  ],
})
export class AppModule {}
