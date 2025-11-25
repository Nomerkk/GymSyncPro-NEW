import React from "react";
import type { MemberWithMembership } from "@/utils/member";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export interface MemberRowActionsProps {
  member: MemberWithMembership;
  onDetail?: (member: MemberWithMembership) => void;
  // Reserved for future actions (edit/suspend/activate/delete/whatsapp/email)
}

export function MemberRowActions({ member, onDetail }: MemberRowActionsProps) {
  return (
    <div className="text-right">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDetail?.(member)}
        data-testid={`button-detail-${member.id}`}
      >
        <Eye size={16} className="mr-1" /> Detail
      </Button>
    </div>
  );
}

export default MemberRowActions;
