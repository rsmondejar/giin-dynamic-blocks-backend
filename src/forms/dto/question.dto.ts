import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  order?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  hasError?: boolean;

  @IsOptional()
  options?: QuestionOptionDto[];
}
