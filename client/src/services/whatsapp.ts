import { httpFetch } from "@/services/api";

export const whatsappService = {
  async send(payload: { memberId: string; message: string }) {
    await httpFetch("/api/admin/whatsapp/send", { method: "POST", body: payload });
  },
};
