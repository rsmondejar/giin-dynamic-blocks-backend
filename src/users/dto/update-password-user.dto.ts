import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordUserDto {
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty()
  new_password: string;

  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty()
  old_password: string;
}
