import { useQuery, useMutation } from "@tanstack/react-query";
import { ptSessionsService, type PTSessionPackage, type PTSummarySession } from "@/services/ptSessions";
import { queryClient } from "@/lib/queryClient";

export function usePTSessionPackages(enabled: boolean) {
  return useQuery<PTSessionPackage[]>({
    queryKey: ["pt-session-packages"],
    queryFn: ptSessionsService.listPackages,
    enabled,
  });
}

export function useMemberPTSessionPackages(enabled: boolean) {
  return useQuery<PTSessionPackage[]>({
    queryKey: ["/api/pt-session-packages"],
    queryFn: ptSessionsService.listPackagesMember,
    enabled,
  });
}

export function usePTSessionAttendance(enabled: boolean) {
  return useQuery<PTSummarySession[]>({
    queryKey: ["pt-session-attendance"],
    queryFn: ptSessionsService.listAttendance,
    enabled,
  });
}

export function useMemberPTSessionAttendance(enabled: boolean) {
  return useQuery<PTSummarySession[]>({
    queryKey: ["/api/pt-session-attendance"],
    queryFn: ptSessionsService.listAttendanceMember,
    enabled,
  });
}

export function usePTSessionActions() {
  const confirm = useMutation({
    mutationFn: (sessionId: string) => ptSessionsService.confirmSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pt-session-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["pt-session-packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pt-session-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pt-session-packages"] });
    },
  });
  return { confirm };
}

export function useMemberPTSessionActions() {
  const schedule = useMutation({
    mutationFn: (payload: { packageId: string; sessionDate: string; notes?: string }) =>
      ptSessionsService.scheduleSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pt-session-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pt-session-packages"] });
    },
  });

  const checkIn = useMutation({
    mutationFn: (sessionId: string) => ptSessionsService.checkIn(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pt-session-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pt-session-packages"] });
    },
  });

  return { schedule, checkIn };
}
