import { httpFetch } from "@/services/api";
import type { PersonalTrainer } from "@shared/schema.ts";

export type TrainerPublic = Pick<
  PersonalTrainer,
  | "id"
  | "name"
  | "specialization"
  | "pricePerSession"
  | "imageUrl"
  | "bio"
  | "experience"
  | "certification"
>;

export const trainersService = {
  async list(): Promise<TrainerPublic[]> {
    const res = await httpFetch<TrainerPublic[]>("/api/trainers", { method: "GET" });
    return res.json || [];
  },
  async listAdmin(): Promise<PersonalTrainer[]> {
    const res = await httpFetch<PersonalTrainer[]>("/api/admin/trainers", { method: "GET" });
    return res.json || [];
  },
  async create(data: {
    name: string;
    bio?: string;
    specialization: string;
    experience?: number;
    certification?: string;
    imageUrl?: string;
    pricePerSession: number;
  }): Promise<void> {
    await httpFetch(`/api/admin/trainers`, { method: "POST", body: data });
  },
  async update(id: string, data: {
    name: string;
    bio?: string;
    specialization: string;
    experience?: number;
    certification?: string;
    imageUrl?: string;
    pricePerSession: number;
  }): Promise<void> {
    await httpFetch(`/api/admin/trainers/${id}`, { method: "PUT", body: data });
  },
  async delete(id: string): Promise<void> {
    await httpFetch(`/api/admin/trainers/${id}`, { method: "DELETE" });
  },
};
