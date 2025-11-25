import React from "react";
import { Badge } from "@/components/ui/badge";
import type { MemberWithMembership } from "@/utils/member";
import { computeMembershipStatus, mapStatusToVariant } from "@/utils/member";

/**
 * Presentational wrapper mapping a member's computed membership status to a badge variant.
 * Keeps status logic out of page JSX for readability and reuse.
 */
export function StatusBadge({ member, className }: { member: MemberWithMembership; className?: string }) {
  const status = computeMembershipStatus(member);
  const variant = mapStatusToVariant(status);
  return (
    <Badge variant={variant} className={className} aria-label={`Membership status: ${status}`}>
      {status}
    </Badge>
  );
}

/** Lightweight variant for raw status strings (already computed). */
export function RawStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={mapStatusToVariant(status)} className={className} aria-label={`Status: ${status}`}>
      {status}
    </Badge>
  );
}
