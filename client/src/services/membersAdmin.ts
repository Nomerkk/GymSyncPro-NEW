import { httpFetch } from '@/services/api';

export interface AdminMemberCreateInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AdminMemberUpdateInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  password?: string; // optional, only sent if present
}

export interface AssignMembershipInput {
  planId: string;
  durationMonths?: number;
}

export const membersAdminService = {
  async create(data: AdminMemberCreateInput) {
    return httpFetch('/api/admin/members', { method: 'POST', body: data });
  },
  async update(memberId: string, data: AdminMemberUpdateInput) {
    const body: Partial<AdminMemberUpdateInput> = { ...data };
    if (!body.password) delete body.password;
    return httpFetch(`/api/admin/members/${memberId}`, { method: 'PUT', body: body });
  },
  async assignMembership(memberId: string, data: AssignMembershipInput) {
    return httpFetch(`/api/admin/members/${memberId}/membership`, { method: 'POST', body: data });
  },
  async suspend(memberId: string) {
    return httpFetch(`/api/admin/members/${memberId}/suspend`, { method: 'PUT' });
  },
  async activate(memberId: string) {
    return httpFetch(`/api/admin/members/${memberId}/activate`, { method: 'PUT' });
  },
  async remove(memberId: string) {
    return httpFetch(`/api/admin/members/${memberId}`, { method: 'DELETE' });
  }
};
