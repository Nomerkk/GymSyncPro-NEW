import { useQuery, useMutation } from "@tanstack/react-query";
import { membershipPlansService } from "@/services/membershipPlans";
import type { MembershipPlan } from "@shared/schema.ts";
import { queryClient } from "@/lib/queryClient";

export function useMembershipPlans(enabled: boolean) {
  return useQuery<MembershipPlan[]>({
    queryKey: ["membership-plans"],
    queryFn: membershipPlansService.listAdmin,
    enabled,
    retry: false,
  });
}

export function useMembershipPlanActions() {
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["membership-plans"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/membership-plans"] });
    queryClient.invalidateQueries({ queryKey: ["/api/membership-plans"] });
  };

  const create = useMutation({
    mutationFn: membershipPlansService.create,
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof membershipPlansService.update>[1] }) =>
      membershipPlansService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: membershipPlansService.delete,
    onSuccess: invalidateAll,
  });
  return { create, update, remove };
}
