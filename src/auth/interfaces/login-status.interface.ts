import { AuthToken } from './auth-token.interface';
import { UserBasicInfo } from '../../users/interfaces/user-basic-info.interface';

export interface LoginStatus {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    user: UserBasicInfo | null;
    backendTokens: {
      accessToken: AuthToken;
      refreshToken: AuthToken;
    };
  };
}
