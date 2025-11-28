import { httpFetch } from "@/services/api";

export interface ClassBooking {
  id: string;
  userId: string;
  classId: string;
  bookingDate: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  gymClass: {
    id: string;
    name: string;
    description?: string;
    instructor: string;
    schedule: string;
    capacity: number;
    currentEnrollment: number;
    branch?: string;
  };
}

export const classBookingsService = {
  async listAdmin(branch?: string): Promise<ClassBooking[]> {
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    const res = await httpFetch<ClassBooking[]>(`/api/admin/class-bookings?${params.toString()}`, { method: "GET" });
    return res.json || [];
  },
  async listMine(): Promise<ClassBooking[]> {
    const res = await httpFetch<ClassBooking[]>("/api/class-bookings", { method: "GET" });
    return res.json || [];
  },
  async updateStatus(id: string, status: string): Promise<void> {
    await httpFetch(`/api/admin/class-bookings/${id}`, {
      method: "PUT",
      body: { status },
    });
  },
  async cancel(id: string): Promise<void> {
    await httpFetch(`/api/admin/class-bookings/${id}`, { method: "DELETE" });
  },
  async book(classId: string, bookingDate: string): Promise<void> {
    await httpFetch(`/api/classes/${classId}/book`, { method: "POST", body: { bookingDate } });
  },
  async cancelMember(bookingId: string): Promise<void> {
    await httpFetch(`/api/class-bookings/${bookingId}/cancel`, { method: "PUT", body: {} });
  },
};
