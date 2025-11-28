import { useMutation } from "@tanstack/react-query";
import { membersAdminService, type AdminMemberCreateInput, type AdminMemberUpdateInput, type AssignMembershipInput } from "@/services/membersAdmin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

// Removing unused ErrorLike interface to fix lint error
// interface ErrorLike { message?: string }

const invalidate = () => {
  queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
  queryClient.invalidateQueries({ queryKey: ["members"] }); // For useMembers hook
  queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["/api/member/bootstrap"] }); // For member dashboard
};



export function useAdminMembersActions() {
  const { toast } = useToast();

  const createMember = useMutation({
    mutationFn: (data: AdminMemberCreateInput) => membersAdminService.create(data),
    onSuccess: () => {
      invalidate();
      toast({ title: "Berhasil", description: "Member baru ditambahkan" });
    },
    onError: (e) => toast({ title: "Error", description: getErrorMessage(e, "Gagal menambah member"), variant: "destructive" })
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: AdminMemberUpdateInput }) => membersAdminService.update(memberId, data),
    onSuccess: () => {
      invalidate();
      toast({ title: "Berhasil", description: "Data member diperbarui" });
    },
    onError: (e) => toast({ title: "Error", description: getErrorMessage(e, "Gagal memperbarui member"), variant: "destructive" })
  });

  const assignMembership = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: AssignMembershipInput }) => membersAdminService.assignMembership(memberId, data),
    onSuccess: () => {
      invalidate();
      toast({ title: "Berhasil", description: "Membership diberikan" });
    },
    onError: (e) => toast({ title: "Error", description: getErrorMessage(e, "Gagal memberikan membership"), variant: "destructive" })
  });

  const suspendMember = useMutation({
    mutationFn: (memberId: string) => membersAdminService.suspend(memberId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Member disuspend" });
    },
    onError: (e) => toast({ title: "Error", description: getErrorMessage(e, "Gagal suspend member"), variant: "destructive" })
  });

  const activateMember = useMutation({
    mutationFn: (memberId: string) => membersAdminService.activate(memberId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Member diaktifkan" });
    },
    onError: (e) => toast({ title: "Error", description: getErrorMessage(e, "Gagal aktivasi member"), variant: "destructive" })
  });

  const deleteMember = useMutation({
    mutationFn: (memberId: string) => membersAdminService.remove(memberId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Member dihapus" });
    },
    onError: (e) => toast({ title: "Error", description: getErrorMessage(e, "Gagal menghapus member"), variant: "destructive" })
  });

  return { createMember, updateMember, assignMembership, suspendMember, activateMember, deleteMember };
}
