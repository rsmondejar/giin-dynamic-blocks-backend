import { User } from '@prisma/client';

export interface UserBasicInfo extends Partial<User> {
  id: string;
  email: string;
  name: string;
  lastName: string;
  createdAt: Date;
}
