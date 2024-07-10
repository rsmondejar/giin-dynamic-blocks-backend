import { Test, TestingModule } from '@nestjs/testing';
import { FormsSubmissionsController } from './forms-submissions.controller';
import { FormsSubmissionsService } from './forms-submissions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FormsSubmissionsController', () => {
  let controller: FormsSubmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsSubmissionsController],
      providers: [FormsSubmissionsService, PrismaService],
    }).compile();

    controller = module.get<FormsSubmissionsController>(
      FormsSubmissionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
