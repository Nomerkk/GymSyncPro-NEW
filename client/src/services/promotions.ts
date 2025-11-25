import { httpFetch } from "@/services/api";

export interface Promotion {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  cta?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export const promotionsService = {
  async listAdmin(): Promise<Promotion[]> {
    const res = await httpFetch<Promotion[]>("/api/admin/promotions", { method: "GET" });
    return res.json || [];
  },
  async create(payload: Partial<Promotion>): Promise<void> {
    await httpFetch("/api/admin/promotions", { method: "POST", body: payload });
  },
  async update(id: string, payload: Partial<Promotion>): Promise<void> {
    await httpFetch(`/api/admin/promotions/${id}`, { method: "PUT", body: payload });
  },
  async remove(id: string): Promise<void> {
    await httpFetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
  },
  async uploadImage(dataUrl: string): Promise<{ url: string }> {
    const res = await httpFetch<{ url: string }>("/api/admin/upload-image", { method: "POST", body: { dataUrl } });
    return res.json || { url: "" };
  }
};
