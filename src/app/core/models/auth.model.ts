export interface User {
  id: number;
  email: string;
  name: string;
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
