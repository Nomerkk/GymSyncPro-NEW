import { httpFetch } from "@/services/api";
import type { GymClass } from "@shared/schema.ts";

export type GymClassPublic = Pick<
  GymClass,
  | "id"
  | "name"
  | "description"
  | "imageUrl"
  | "instructorName"
  | "schedule"
  | "maxCapacity"
  | "currentEnrollment"
>;

export const classesService = {
  async list(): Promise<GymClassPublic[]> {
    const res = await httpFetch<GymClassPublic[]>("/api/classes", { method: "GET" });
    return res.json || [];
  },
  async listAdmin(): Promise<GymClass[]> {
    const res = await httpFetch<GymClass[]>("/api/admin/classes", { method: "GET" });
    return res.json || [];
  },
  async create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    instructorName: string;
    schedule: string;
    maxCapacity: number;
  }): Promise<void> {
    const payload = { ...data, currentEnrollment: 0, active: true };
    await httpFetch(`/api/admin/classes`, { method: "POST", body: payload });
  },
  async update(id: string, data: {
    name: string;
    description?: string;
    imageUrl?: string;
    instructorName: string;
    schedule: string;
    maxCapacity: number;
  }): Promise<void> {
    await httpFetch(`/api/admin/classes/${id}`, { method: "PUT", body: data });
  },
  async delete(id: string): Promise<void> {
    await httpFetch(`/api/admin/classes/${id}`, { method: "DELETE" });
  },
};
