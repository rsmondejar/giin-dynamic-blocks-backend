import { IsNotEmpty, IsString } from 'class-validator';

export class AddPermissionDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;
}
