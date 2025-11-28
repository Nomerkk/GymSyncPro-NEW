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
    const res = await httpFetch('/api/admin/members', { method: 'POST', body: data });
    return res.json;
  },
  async update(memberId: string, data: AdminMemberUpdateInput) {
    const body: Partial<AdminMemberUpdateInput> = { ...data };
    if (!body.password) delete body.password;
    const res = await httpFetch(`/api/admin/members/${memberId}`, { method: 'PUT', body: body });
    return res.json;
  },
  async assignMembership(memberId: string, data: AssignMembershipInput) {
    const res = await httpFetch(`/api/admin/members/${memberId}/membership`, { method: 'POST', body: data });
    return res.json;
  },
  async suspend(memberId: string) {
    const res = await httpFetch(`/api/admin/members/${memberId}/suspend`, { method: 'PUT' });
    return res.json;
  },
  async activate(memberId: string) {
    const res = await httpFetch(`/api/admin/members/${memberId}/activate`, { method: 'PUT' });
    return res.json;
  },
  async remove(memberId: string) {
    await httpFetch(`/api/admin/members/${memberId}`, { method: 'DELETE' });
  }
};
