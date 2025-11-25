import { httpFetch } from "@/services/api";
import type { MemberWithMembership } from "@/utils/member";

/**
 * Members service encapsulates all API calls related to member management.
 * Keeps API paths and network details in one place for easier maintenance.
 */
export const membersService = {
  async list(): Promise<MemberWithMembership[]> {
    const res = await httpFetch<MemberWithMembership[]>("/api/admin/members", { method: "GET" });
    return res.json || [];
  },
  async suspend(memberId: string): Promise<void> {
    await httpFetch(`/api/admin/members/${memberId}/suspend`, { method: "PUT" });
  },
  async activate(memberId: string): Promise<void> {
    await httpFetch(`/api/admin/members/${memberId}/activate`, { method: "PUT" });
  },
  async delete(memberId: string): Promise<void> {
    await httpFetch(`/api/admin/members/${memberId}`, { method: "DELETE" });
  },
};
