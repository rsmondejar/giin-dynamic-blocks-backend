import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionDto } from './question.dto';

export class CreateFormRequestDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string | null;

  @IsNotEmpty()
  @ApiProperty()
  questions: QuestionDto[];

  @IsString()
  @IsOptional()
  authorId?: string | null;
}
