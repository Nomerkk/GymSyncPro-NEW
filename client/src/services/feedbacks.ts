import { httpFetch } from "@/services/api";

export const feedbacksService = {
  async create(payload: { subject: string; message: string; rating?: number }) {
    const res = await httpFetch("/api/feedbacks", { method: "POST", body: payload });
    return res;
  },

  async getAll() {
    return await httpFetch("/api/feedbacks");
  },

  async getById(id: string) {
    return await httpFetch(`/api/feedbacks/${id}`);
  },

  async createReply(feedbackId: string, message: string) {
    return await httpFetch(`/api/feedbacks/${feedbackId}/replies`, {
      method: "POST",
      body: { message },
    });
  },

  async getReplies(feedbackId: string) {
    return await httpFetch(`/api/feedbacks/${feedbackId}/replies`);
  },
};
