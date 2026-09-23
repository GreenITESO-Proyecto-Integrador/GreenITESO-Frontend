export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
  created: boolean;
}
