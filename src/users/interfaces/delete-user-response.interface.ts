import { User } from '@prisma/client';

export interface DeleteUserResponse extends Partial<User> {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
