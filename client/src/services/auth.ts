import { httpFetch } from "@/services/api";

export interface LoginPayload { username?: string; email?: string; password: string; }
export interface RegisterPayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  confirmPassword?: string;
  adminSecretKey?: string;
  selfieImage?: string;
  homeBranch?: string;
}
export interface ResetPayload { email?: string; password?: string; token?: string; }
export interface VerificationPayload { email: string; code: string; }

export const authService = {
  async login(payload: LoginPayload) {
    await httpFetch("/api/login", { method: "POST", body: payload });
  },
  async loginAdmin(payload: LoginPayload) {
    await httpFetch("/api/login", { method: "POST", body: payload });
  },
  async logout() {
    await httpFetch("/api/logout", { method: "POST", body: {} });
  },
  async registerVerified(payload: RegisterPayload) {
    await httpFetch("/api/register-verified", { method: "POST", body: payload });
  },
  async registerAdmin(payload: RegisterPayload) {
    await httpFetch("/api/register-admin", { method: "POST", body: payload });
  },
  async sendVerificationCode(email: string) {
    await httpFetch("/api/send-verification-code", { method: "POST", body: { email } });
  },
  async resendVerificationCode(email: string) {
    await httpFetch("/api/resend-verification-code", { method: "POST", body: { email } });
  },
  async checkVerificationCode(email: string, code: string) {
    await httpFetch("/api/check-verification-code", { method: "POST", body: { email, code } });
  },
  async verifyEmail(payload: VerificationPayload) {
    await httpFetch("/api/verify-email", { method: "POST", body: payload });
  },
  async forgotPassword(email: string) {
    await httpFetch("/api/forgot-password", { method: "POST", body: { email } });
  },
  async resetPassword(payload: ResetPayload) {
    await httpFetch("/api/reset-password", { method: "POST", body: payload });
  },
};
