import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionOptionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  key: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  value: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  order?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  hasError?: boolean;
}
