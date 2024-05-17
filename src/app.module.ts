import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { FormsSubmissionsModule } from './forms-submissions/forms-submissions.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [UsersModule, AuthModule, FormsModule, FormsSubmissionsModule],
})
export class AppModule {}
