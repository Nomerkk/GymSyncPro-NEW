import { httpFetch } from "@/services/api";
import type { MemberWithMembership } from "@/utils/member";

/**
 * Members service encapsulates all API calls related to member management.
 * Keeps API paths and network details in one place for easier maintenance.
 */
export const membersService = {
  async list(page?: number, limit?: number, search?: string, branch?: string): Promise<{ data: MemberWithMembership[], total: number }> {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (branch) params.append("branch", branch);

    const res = await httpFetch<{ data: MemberWithMembership[], total: number } | MemberWithMembership[]>(`/api/admin/members?${params.toString()}`, { method: "GET" });

    // Handle backward compatibility if backend returns array
    if (Array.isArray(res.json)) {
      return { data: res.json, total: res.json.length };
    }
    return res.json || { data: [], total: 0 };
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
