import "dotenv/config";

export type NodeEnv = "development" | "production" | "test";

const normalizeNodeEnv = (value?: string): NodeEnv => {
  const normalized = (value ?? "development").toLowerCase();
  if (normalized === "production" || normalized === "test") {
    return normalized;
  }
  return "development";
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: normalizeNodeEnv(process.env.NODE_ENV),
  get isProduction() {
    return this.nodeEnv === "production";
  },
  get isDevelopment() {
    return this.nodeEnv === "development";
  },
  port: toNumber(process.env.PORT, 5000),
  adminSecret: process.env.ADMIN_SECRET_KEY ?? "admin123",
  appUrl: process.env.APP_URL ?? "http://localhost:5000",
  databaseUrl: process.env.DATABASE_URL,
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    adminApiKey: process.env.RESEND_API_KEY_ADMIN,
    verificationApiKey: process.env.RESEND_API_KEY_VERIFICATION,
    defaultFrom: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    adminFrom:
      process.env.RESEND_FROM_EMAIL_ADMIN ??
      process.env.RESEND_FROM_EMAIL ??
      "onboarding@resend.dev",
    verificationFrom:
      process.env.RESEND_FROM_EMAIL_VERIFICATION ??
      process.env.RESEND_FROM_EMAIL ??
      "onboarding@resend.dev",
    adminReplyTo: process.env.RESEND_REPLY_TO_ADMIN,
  },
  push: {
    vapidPublic: process.env.VAPID_PUBLIC_KEY,
    vapidPrivate: process.env.VAPID_PRIVATE_KEY,
    mailto: process.env.VAPID_MAILTO ?? "mailto:admin@yourgym.com",
  },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET,
    trustProxy: process.env.TRUST_PROXY,
    cookieSecure: process.env.COOKIE_SECURE,
    cookieSameSite: (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none" | undefined) ?? "lax",
    debugFlag: process.env.AUTH_DEBUG,
  },
};

export type AppEnv = typeof env;
