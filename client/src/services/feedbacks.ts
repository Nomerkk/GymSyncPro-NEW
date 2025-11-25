import { httpFetch } from "@/services/api";

export const feedbacksService = {
  async create(payload: { subject: string; message: string; rating?: number }) {
    await httpFetch("/api/feedbacks", { method: "POST", body: payload });
  },
};
