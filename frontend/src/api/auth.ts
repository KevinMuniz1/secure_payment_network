import apiClient from "./client";

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  email?: string;
  role?: string;
  refreshToken?: string;
  requiresEmailOtp?: boolean;
  requiresTOTP?: boolean;
  preAuthToken?: string;
}

export interface FullAuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  role: string;
}

export async function register(data: RegisterData): Promise<void> {
  await apiClient.post("/users/register", data);
}

export async function login(data: LoginData): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/users/login", data);
  return response.data;
}

export async function completeEmailOtp(
  preAuthToken: string,
  otp: string
): Promise<FullAuthResponse> {
  const response = await apiClient.post<FullAuthResponse>(
    "/auth/complete-email-otp",
    { preAuthToken, otp }
  );
  return response.data;
}

export async function completeTOTP(
  preAuthToken: string,
  totpCode: string
): Promise<FullAuthResponse> {
  const response = await apiClient.post<FullAuthResponse>(
    "/auth/complete-totp",
    { preAuthToken, totpCode }
  );
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/users/logout", refreshToken, {
    headers: { "Content-Type": "text/plain" },
  });
}
