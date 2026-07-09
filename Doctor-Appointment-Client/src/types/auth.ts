export type UserRole = 'Patient' | 'Doctor' | 'Receptionist' | 'Admin' | 'SuperAdmin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  isVerified?: boolean;
  profilePicture?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
