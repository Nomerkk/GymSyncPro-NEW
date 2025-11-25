import { httpFetch } from "@/services/api";
import type { Notification } from "@shared/schema.ts";

export const notificationsService = {
  async list(): Promise<Notification[]> {
    const res = await httpFetch<Notification[]>("/api/notifications", { method: "GET" });
    return res.json || [];
  },
  async markRead(id: string): Promise<void> {
    await httpFetch(`/api/notifications/${id}/read`, { method: "PUT", body: {} });
  },
  async markAllRead(): Promise<void> {
    await httpFetch("/api/notifications/read-all", { method: "PUT", body: {} });
  },
  async remove(id: string): Promise<void> {
    await httpFetch(`/api/notifications/${id}`, { method: "DELETE" });
  }
};
