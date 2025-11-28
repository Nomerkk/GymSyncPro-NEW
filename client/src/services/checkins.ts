import { httpFetch } from "@/services/api";

export interface MemberPlan { name?: string }
export interface MemberMembership { endDate?: string | Date; plan?: MemberPlan | null }
export interface MemberQRData {
  qrCode: string;
  expiresAt?: string | Date;
  cooldownUntil?: string | Date;
  membership?: MemberMembership | null;
}

// Admin preview response (used in admin pages)
export interface PreviewCheckInData {
  user?: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string };
  membership?: { plan?: { name?: string }; startDate?: string; endDate: string; autoRenewal?: boolean } | null;
  lastCheckIn?: { checkInTime: string } | null;
  message?: string;
}

// Admin validation/approve response (used in admin modal & popup)
export interface CheckinValidationResult {
  success: boolean;
  checkInTime?: string;
  message?: string;
  user?: { firstName?: string; lastName?: string; email?: string; profileImageUrl?: string };
  membership?: { endDate: string; plan: { name?: string } } | null;
  checkIn?: { id: string; branch?: string; status?: string; checkInTime: string };
  activeBranch?: string;
}

export interface CheckinApprovePayload {
  qrCode: string;
  selfieImage?: string;
  lockerNumber?: string;
  gender?: "male" | "female";
}

export const checkinsService = {
  async preview(qrCode: string, opts?: { signal?: AbortSignal }): Promise<PreviewCheckInData> {
    const res = await httpFetch<PreviewCheckInData>("/api/admin/checkin/preview", { method: "POST", body: { qrCode }, signal: opts?.signal });
    return res.json as PreviewCheckInData;
  },
  async approve(payload: CheckinApprovePayload, opts?: { signal?: AbortSignal }): Promise<CheckinValidationResult> {
    const res = await httpFetch<CheckinValidationResult>("/api/admin/checkin/approve", { method: "POST", body: payload, signal: opts?.signal });
    return res.json as CheckinValidationResult;
  },
  async validate(qrCode: string, opts?: { signal?: AbortSignal }): Promise<CheckinValidationResult> {
    const res = await httpFetch<CheckinValidationResult>("/api/admin/checkin/validate", { method: "POST", body: { qrCode }, signal: opts?.signal });
    return res.json as CheckinValidationResult;
  },
  async getMemberQR(opts?: { signal?: AbortSignal }): Promise<MemberQRData> {
    const res = await httpFetch<MemberQRData>(`/api/member/qrcode?t=${Date.now()}`, { method: "GET", signal: opts?.signal });
    return res.json as MemberQRData;
  },
};
