import { httpFetch } from "@/services/api";

export interface PTSummarySession {
  id: string;
  userId: string;
  trainerId: string;
  sessionDate: string;
  sessionNumber: number;
  status: string; // completed | scheduled | cancelled
  checkInTime?: string;
  adminConfirmed?: boolean;
  user?: { firstName: string; lastName: string; email: string };
  trainer?: { name: string; specialization: string; branch?: string };
  notes?: string;
}

export interface PTSessionPackage {
  id: string;
  userId: string;
  trainerId: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  status: string; // active | completed | expired
  purchaseDate?: string;
  user?: { firstName: string; lastName: string; email: string };
  trainer?: { name: string; specialization: string; branch?: string };
}

export const ptSessionsService = {
  async listPackages(): Promise<PTSessionPackage[]> {
    const res = await httpFetch<PTSessionPackage[]>("/api/admin/pt-session-packages", { method: "GET" });
    return res.json || [];
  },
  async listAttendance(): Promise<PTSummarySession[]> {
    const res = await httpFetch<PTSummarySession[]>("/api/admin/pt-session-attendance", { method: "GET" });
    return res.json || [];
  },
  async confirmSession(sessionId: string): Promise<void> {
    await httpFetch(`/api/admin/pt-session-attendance/${sessionId}/confirm`, { method: "PUT", body: {} });
  },
  async listPackagesMember(): Promise<PTSessionPackage[]> {
    const res = await httpFetch<PTSessionPackage[]>("/api/pt-session-packages", { method: "GET" });
    return res.json || [];
  },
  async listAttendanceMember(): Promise<PTSummarySession[]> {
    const res = await httpFetch<PTSummarySession[]>("/api/pt-session-attendance", { method: "GET" });
    return res.json || [];
  },
  async scheduleSession(data: { packageId: string; sessionDate: string; notes?: string }): Promise<void> {
    await httpFetch(`/api/pt-session-attendance`, { method: "POST", body: data });
  },
  async checkIn(sessionId: string): Promise<void> {
    await httpFetch(`/api/pt-session-attendance/${sessionId}/check-in`, { method: "PUT", body: {} });
  },
};
