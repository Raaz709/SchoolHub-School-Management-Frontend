import { apiPost } from "../lib/api";

export type LoginRequest = {
  Username: string;
  Password: string;
};

export type RegisterRequest = {
  Username: string;
  Email: string;
  Password: string;
  Role: "Student" | "Teacher" | "Parent";
  RollNumber?: string;
  EmployeeCode?: string;
  Occupation?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: string;
  userId: number;
};

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", payload);
}

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/register", payload);
}