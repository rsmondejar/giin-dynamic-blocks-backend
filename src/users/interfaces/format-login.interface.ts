import { User } from '@prisma/client';

export interface FormatLogin extends Partial<User> {
  email: string;
}
