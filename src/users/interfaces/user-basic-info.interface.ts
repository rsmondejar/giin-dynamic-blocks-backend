import { User } from '@prisma/client';
import { AuthToken } from '../../auth/interfaces/auth-token.interface';

export interface UserBasicInfo extends Partial<User> {
  id: string;
  email: string;
  name: string;
  lastName: string;
  token?: AuthToken | null;
  createdAt: Date;
}
