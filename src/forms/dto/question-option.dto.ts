import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  hasError?: boolean;
}
