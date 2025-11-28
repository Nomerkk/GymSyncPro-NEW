import { useQuery, useMutation } from "@tanstack/react-query";
import { membersService } from "@/services/members";
import type { MemberWithMembership } from "@/utils/member";
import { queryClient } from "@/lib/queryClient";

/** Hook for listing members. Handles caching and error propagation. */
export function useMembers(enabled: boolean, page?: number, limit?: number, search?: string, branch?: string) {
  return useQuery<{ data: MemberWithMembership[], total: number }>({
    queryKey: ["members", page, limit, search, branch],
    queryFn: () => membersService.list(page, limit, search, branch),
    enabled,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
}

/** Mutation helpers using membersService with automatic cache invalidation. */
export function useMemberActions() {
  const suspend = useMutation({
    mutationFn: membersService.suspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
  });
  const activate = useMutation({
    mutationFn: membersService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
  });
  const remove = useMutation({
    mutationFn: membersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
  });
  return { suspend, activate, remove };
}
