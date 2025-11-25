import { httpFetch } from "@/services/api";

export const emailService = {
  async send(payload: { memberId: string; subject: string; message: string; ctaText?: string; ctaUrl?: string }) {
    await httpFetch("/api/admin/email/send", { method: "POST", body: payload });
  },
};
