import { IsNotEmpty, IsString } from 'class-validator';

export class RemovePermissionDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}
