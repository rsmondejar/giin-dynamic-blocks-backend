import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionOptionDto } from './question-option.dto';

export class QuestionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  placeholder: string | null;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  isRequired: boolean;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  type: string;

  @IsOptional()
  options?: QuestionOptionDto[];
}
