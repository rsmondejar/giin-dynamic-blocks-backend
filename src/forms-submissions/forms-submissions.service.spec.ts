import { Test, TestingModule } from '@nestjs/testing';
import { FormsSubmissionsService } from './forms-submissions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FormsSubmissionsService', () => {
  let service: FormsSubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsSubmissionsService, PrismaService],
    }).compile();

    service = module.get<FormsSubmissionsService>(FormsSubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
