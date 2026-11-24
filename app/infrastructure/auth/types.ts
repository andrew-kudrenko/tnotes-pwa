export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthService {
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (credentials: RegisterCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
}
