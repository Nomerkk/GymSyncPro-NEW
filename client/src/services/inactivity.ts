import { httpFetch } from "@/services/api";

export const inactivityService = {
  async sendReminders(): Promise<{ message?: string }> {
    const res = await httpFetch<{ message?: string }>("/api/admin/send-inactivity-reminders", { method: "POST", body: {} });
    return res.json || {};
  },
};
