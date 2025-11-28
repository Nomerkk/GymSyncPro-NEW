import React, { useState } from "react";
import type { MemberWithMembership } from "@/utils/member";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemberActions } from "@/hooks/useMembers";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface MemberRowActionsProps {
  member: MemberWithMembership;
  onDetail?: (member: MemberWithMembership) => void;
}

export function MemberRowActions({ member, onDetail }: MemberRowActionsProps) {
  const { isSuperAdmin } = useAuth();
  const { remove } = useMemberActions();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const { toast } = useToast();

  const handleDelete = () => {
    remove.mutate(member.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Member deleted successfully",
        });
        setShowDeleteAlert(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete member",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDetail?.(member)}
        data-testid={`button-detail-${member.id}`}
      >
        <Eye size={16} className="mr-1" /> Detail
      </Button>

      {isSuperAdmin && (
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              data-testid={`button-delete-${member.id}`}
            >
              <Trash2 size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the member
                <strong> {member.firstName} {member.lastName}</strong> and all associated data
                (memberships, check-ins, payments, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={remove.isPending}
              >
                {remove.isPending ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default MemberRowActions;
