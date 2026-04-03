export type Role =
  | 'ADMIN'
  | 'DAF'
  | 'CHEF_COMPTABLE'
  | 'COMPTABLE'
  | 'ASSISTANT'
  | 'AUDITEUR';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}
