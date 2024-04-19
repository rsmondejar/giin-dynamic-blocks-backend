import { UserBasicInfo } from '../../users/interfaces/user-basic-info.interface';

export interface MeStatus {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: UserBasicInfo;
}
