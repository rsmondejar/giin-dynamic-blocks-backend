import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNewPassword {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}
