import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionAnswerDto {
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  questionId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  type: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty()
  value: string;

  @ApiProperty()
  values: QuestionAnswerOption[];
}
