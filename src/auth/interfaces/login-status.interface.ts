import { AuthToken } from './auth-token.interface';

export interface LoginStatus {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    token: AuthToken;
  };
}
