import api from './axios'
import axios from 'axios'

export interface LoginResponse {
  token: string
  refreshToken: string
  email: string
  role: string
  requiresEmailOtp: boolean
  requiresTotp: boolean
  preAuthToken: string
}

export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/users/login', { email, password })

export const register = (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => api.post('/users/register', { firstName, lastName, email, password })

export const logout = () => {
  const refreshToken = localStorage.getItem('refreshToken')
  return api.post('/users/logout', JSON.stringify(refreshToken), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const completeTotp = (preAuthToken: string, code: string) =>
  api.post<LoginResponse>('/auth/complete-totp', { preAuthToken, code })

export const completeEmailOtp = (preAuthToken: string, code: string) =>
  api.post<LoginResponse>('/auth/complete-email-otp', { preAuthToken, code })

export const sendEmailOtp = () => api.post('/auth/send-email-otp')

export const setupTotp = () =>
  api.post<{ qrCodeUrl: string; secret: string }>('/auth/setup-2fa')

export const verifyTotp = (code: string) =>
  api.post('/auth/verify-2fa', { code })

export const setupEmailOtp = () => api.post('/auth/setup-email-otp')

export const verifyEmailOtp = (code: string) =>
  api.post('/auth/verify-email-otp', { code })

export const disableTotp = () => api.post('/auth/disable-totp')

export const disableEmailOtp = () => api.post('/auth/disable-email-otp')

export const refreshTokens = (refreshToken: string) =>
  axios.post<LoginResponse>('/users/refresh', JSON.stringify(refreshToken), {
    headers: { 'Content-Type': 'application/json' },
  })
