import { httpFetch } from "@/services/api";

export interface PTBooking {
  id: string;
  userId: string;
  trainerId: string;
  bookingDate: string;
  duration: number;
  sessionCount: number;
  status: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  trainer: {
    id: string;
    name: string;
    specialization: string;
    branch?: string;
  };
}

export const ptBookingsService = {
  async listAdmin(): Promise<PTBooking[]> {
    const res = await httpFetch<PTBooking[]>("/api/admin/pt-bookings", { method: "GET" });
    return res.json || [];
  },
  async listMine(): Promise<PTBooking[]> {
    const res = await httpFetch<PTBooking[]>("/api/pt-bookings", { method: "GET" });
    return res.json || [];
  },
  async updateStatus(id: string, status: string): Promise<void> {
    await httpFetch(`/api/admin/pt-bookings/${id}`, { method: "PUT", body: { status } });
  },
  async create(payload: { trainerId: string; bookingDate: string; sessionCount: number; notes?: string }): Promise<void> {
    await httpFetch(`/api/pt-bookings`, { method: "POST", body: payload });
  },
  async cancel(bookingId: string): Promise<void> {
    await httpFetch(`/api/pt-bookings/${bookingId}/cancel`, { method: "PUT", body: {} });
  },
};
