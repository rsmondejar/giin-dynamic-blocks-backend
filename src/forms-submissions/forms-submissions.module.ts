import { Module } from '@nestjs/common';
import { FormsSubmissionsService } from './forms-submissions.service';
import { FormsSubmissionsController } from './forms-submissions.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FormsSubmissionsController],
  providers: [FormsSubmissionsService, PrismaService],
})
export class FormsSubmissionsModule {}
