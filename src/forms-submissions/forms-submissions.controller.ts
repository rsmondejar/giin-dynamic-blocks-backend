import { Controller, Post, Body } from '@nestjs/common';
import { FormsSubmissionsService } from './forms-submissions.service';
import { CreateFormsSubmissionDto } from './dto/create-forms-submission.dto';

@Controller('forms-submissions')
export class FormsSubmissionsController {
  constructor(
    private readonly formsSubmissionsService: FormsSubmissionsService,
  ) {}

  @Post()
  async create(@Body() createFormsSubmissionDto: CreateFormsSubmissionDto) {
    return await this.formsSubmissionsService.create(createFormsSubmissionDto);
  }
}
