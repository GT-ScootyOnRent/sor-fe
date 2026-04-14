export interface UserDto {
  id: number;
  userNumber: string;
  cityId?: number;
  name?: string;
  email?: string;
}

export interface AdminDto {
  id: number;
  username: string;
  email: string;
  cityId?: number;
  cityIds: number[];
  role: 1 | 2; // 1=Admin, 2=SuperAdmin
  number: string;
}
