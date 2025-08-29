export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  role: "user" | "admin" | "moderator";
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  _count?: {
    apiKeys: number;
    subscriptions: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
  details?: string[];
}
