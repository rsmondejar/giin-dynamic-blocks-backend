import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FormUserRoles, User } from '@prisma/client';
import { QuestionDto } from './question.dto';

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

  @IsNotEmpty()
  questions: QuestionDto[];

  @IsNotEmpty()
  formsRoles?: FormUserRoles[];
}
