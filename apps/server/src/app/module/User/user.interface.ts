/* eslint-disable no-unused-vars */
import { USER_ROLE } from './user.constant';

export interface TUser {
  id: string;
  email: string;
  password: string;
  needsPasswordChange: boolean;
  passwordChangedAt?: Date;
  role: 'superAdmin' | 'admin' | 'merchant';
  status: 'active' | 'blocked';
  isDeleted: boolean;
}

export type TUserRole = keyof typeof USER_ROLE;