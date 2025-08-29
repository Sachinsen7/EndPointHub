export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  company?: string;
  bio?: string;
  website?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
