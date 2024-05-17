import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionAnswerDto {
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  questionId: string;

  @IsString()
  @ApiProperty()
  value: string;

  @IsString()
  @ApiProperty()
  values: string[];
}
