import { QuestionAnswerDto } from './question-answer.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormsSubmissionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  formId: string;

  @IsNotEmpty()
  @ApiProperty()
  answers: QuestionAnswerDto[];
}
