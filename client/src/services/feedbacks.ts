import { httpFetch } from "@/services/api";

export interface Feedback {
  id: string;
  subject: string;
  message: string;
  status: string;
  isResolved: boolean;
  createdAt: string;
  lastReplyAt: string;
  userId: string;
  branch?: string;
  isAnonymous?: boolean;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
    homeBranch?: string;
  };
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    name?: string; // For backward compatibility or if name is used
  };
}

export const feedbacksService = {
  async create(payload: { subject: string; message: string; branch: string; isAnonymous?: boolean }): Promise<Feedback> {
    const res = await httpFetch<Feedback>("/api/feedbacks", { method: "POST", body: payload });
    return res.json!;
  },

  async getAll(): Promise<Feedback[]> {
    const res = await httpFetch<Feedback[]>("/api/feedbacks");
    if (!Array.isArray(res.json)) return [];
    return res.json;
  },

  async getAllAdmin(branch?: string): Promise<Feedback[]> {
    const url = branch && branch !== "all"
      ? `/api/admin/feedbacks?branch=${encodeURIComponent(branch)}`
      : "/api/admin/feedbacks";
    const res = await httpFetch<Feedback[]>(url);
    if (!Array.isArray(res.json)) return [];
    return res.json;
  },

  async getById(id: string): Promise<Feedback> {
    const res = await httpFetch<Feedback>(`/api/feedbacks/${id}`);
    return res.json!;
  },

  async createReply(feedbackId: string, message: string): Promise<FeedbackReply> {
    const res = await httpFetch<FeedbackReply>(`/api/feedbacks/${feedbackId}/replies`, {
      method: "POST",
      body: { message },
    });
    return res.json!;
  },

  async getReplies(feedbackId: string): Promise<FeedbackReply[]> {
    const res = await httpFetch<FeedbackReply[]>(`/api/feedbacks/${feedbackId}/replies`);
    return res.json || [];
  },
};
