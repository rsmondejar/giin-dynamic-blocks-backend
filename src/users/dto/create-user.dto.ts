import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  lastName: string | null;

  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty()
  password: string;

  // @IsBoolean()
  // @IsOptional()
  // isAdmin: boolean;

  // @IsBoolean()
  // @IsOptional()
  // isActive: boolean;

  // @IsOptional()
  // roleId: string;

  // createdAt: Date;
  // updatedAt: Date;
  // deletedAt: Date;
}
