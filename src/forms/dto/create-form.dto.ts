import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FieldValue, User } from '@prisma/client';

export class CreateFormDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug: string;

  @IsBoolean()
  @IsOptional()
  isPublished: boolean;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsNotEmpty()
  author?: User;

  @IsOptional()
  fieldValues?: FieldValue[];
}
