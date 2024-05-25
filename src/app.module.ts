import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { FormsSubmissionsModule } from './forms-submissions/forms-submissions.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    //   serveRoot: process.env.NODE_ENV === 'development' ? '/' : '/',
    // }),
    UsersModule,
    AuthModule,
    FormsModule,
    FormsSubmissionsModule,
  ],
})
export class AppModule {}
