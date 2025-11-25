import { httpFetch } from "@/services/api";

export const pushService = {
  async getPublicKey(): Promise<string> {
    const res = await httpFetch<{ publicKey: string }>("/api/push/public-key", { method: "GET" });
    return res.json?.publicKey || "";
  },
  async subscribe(payload: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    await httpFetch("/api/push/subscribe", { method: "POST", body: payload });
  },
  async unsubscribe(payload: { endpoint: string }): Promise<void> {
    await httpFetch("/api/push/unsubscribe", { method: "DELETE", body: payload });
  },
};
