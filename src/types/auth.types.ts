import type { UserDto, AdminDto } from '../types/user.types';
export interface LoginRequest {
  type: 'user' | 'admin' | 'superadmin';
  identifier: string;
  password?: string;
  otpCode?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userType?: string;
  message?: string;
  userData?: UserDto | AdminDto;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  cityId?: number;
  token?: string;
  userType: 'user' | 'admin' | 'superadmin';
}
