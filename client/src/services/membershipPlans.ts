import { httpFetch } from "@/services/api";
import type { MembershipPlan } from "@shared/schema.ts";

export const membershipPlansService = {
  async listAdmin(): Promise<MembershipPlan[]> {
    const res = await httpFetch<MembershipPlan[]>("/api/admin/membership-plans", { method: "GET" });
    return res.json || [];
  },
  async create(data: {
    name: string;
    description?: string | null;
    price: number;
    durationMonths: number;
    features?: string[] | null;
    active: boolean;
  }): Promise<void> {
    await httpFetch(`/api/admin/membership-plans`, { method: "POST", body: data });
  },
  async update(id: string, data: {
    name: string;
    description?: string | null;
    price: number;
    durationMonths: number;
    features?: string[] | null;
    active: boolean;
  }): Promise<void> {
    await httpFetch(`/api/admin/membership-plans/${id}`, { method: "PUT", body: data });
  },
  async delete(id: string): Promise<void> {
    await httpFetch(`/api/admin/membership-plans/${id}`, { method: "DELETE" });
  },
};
