import { httpFetch } from "@/services/api";

export interface Promotion { id: string; title: string; description?: string; imageUrl?: string }

export interface MemberPlan { name?: string }
export interface MemberMembership { id: string; plan?: MemberPlan; endDate?: string; status?: string }
export interface MemberCheckIn { id: string; checkInTime: string; status: string }
export interface MemberDashboardStats { currentCrowd?: number; monthlyCheckIns?: number; upcomingClasses?: number }
export interface MemberDashboard {
  membership?: MemberMembership;
  checkIns?: MemberCheckIn[];
  stats?: MemberDashboardStats;
}

export interface MemberBootstrapPayload {
  dashboard?: MemberDashboard;
  promotions?: Promotion[];
}

export const memberDashboardService = {
  async getBootstrap(): Promise<MemberBootstrapPayload> {
    const res = await httpFetch<MemberBootstrapPayload>("/api/member/bootstrap", { method: "GET" });
    return (res.json || {}) as MemberBootstrapPayload;
  },
};
