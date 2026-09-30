import { apiGet, apiPut } from "../lib/api";

export type UserProfile = {
  Id: number;
  Username: string;
  Email: string;
  ProfilePictureUrl: string | null;
  IsActive: boolean;
  CreatedAt: string;
};

export function fetchProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiGet<UserProfile>("/api/profile", signal);
}

export function updateProfile(payload: {
  Username: string;
  Email: string;
}): Promise<{ Message: string }> {
  return apiPut<{ Message: string }>("/api/profile", payload);
}
