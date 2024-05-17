import { Test, TestingModule } from '@nestjs/testing';
import { FormsSubmissionsService } from './forms-submissions.service';

describe('FormsSubmissionsService', () => {
  let service: FormsSubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsSubmissionsService],
    }).compile();

    service = module.get<FormsSubmissionsService>(FormsSubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
