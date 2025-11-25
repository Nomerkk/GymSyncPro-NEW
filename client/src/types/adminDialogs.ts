/**
 * Shared dialog & mutation interface definitions for Admin domain.
 * Centralizing these reduces repeated `any` usage and aligns payload shapes.
 */

import type { GymClass, PersonalTrainer, MembershipPlan } from "@shared/schema.ts";
export { getErrorMessage } from "@/lib/errors";

/** Generic error-like shape used by mutation onError callbacks */
export interface ErrorLike { message?: string; [key: string]: unknown }

/** Base props shared by all admin dialogs */
export interface AdminDialogBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* =============================
 * Class Dialog Types
 * ============================= */
export interface ClassFormPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  instructorName: string;
  schedule: string; // e.g. "Mon, Wed - 7:00 AM"
  maxCapacity: number;
}
export interface AdminClassDialogProps extends AdminDialogBaseProps {
  gymClass?: GymClass | null;
}

/* =============================
 * Personal Trainer Dialog Types
 * ============================= */
export interface TrainerFormPayload {
  name: string;
  bio?: string;
  specialization: string;
  experience?: number; // years
  certification?: string;
  imageUrl?: string;
  pricePerSession: number; // monetary value
}
export interface AdminPTDialogProps extends AdminDialogBaseProps {
  trainer?: PersonalTrainer | null;
}

/* =============================
 * Membership Plan Dialog Types
 * ============================= */
export interface MembershipPlanFormPayload {
  name: string;
  description?: string | null;
  price: number;
  durationMonths: number;
  features?: string[] | null;
  active: boolean;
}
export interface AdminMembershipPlanDialogProps extends AdminDialogBaseProps {
  plan?: MembershipPlan | null;
}

/* =============================
 * Email Dialog Types
 * ============================= */
export interface MemberRef {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string; // included for potential cross-channel use
}
export interface EmailTemplateBuildResult {
  subject: string;
  message: string;
  ctaText?: string;
  ctaPath?: string;
}
export interface EmailSendPayload {
  memberId: string;
  subject: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}
export interface AdminEmailDialogProps extends AdminDialogBaseProps {
  member: MemberRef | null;
}

/* =============================
 * WhatsApp Dialog Types
 * ============================= */
export interface WhatsappSendPayload {
  memberId: string;
  message: string;
}
export interface AdminWhatsappDialogProps extends AdminDialogBaseProps {
  member: MemberRef | null;
}

/* =============================
 * Utility helpers (non-executable here, reference only)
 * ============================= */
/** Narrow an unknown error into ErrorLike */
// getErrorMessage re-exported from @/lib/errors

/** Ensure numeric field parsing from form string values */
export function parsePositiveInt(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Ensure numeric float parsing */
export function parsePositiveFloat(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
