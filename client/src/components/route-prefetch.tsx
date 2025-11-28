import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { membersService } from "@/services/members";
import { classesService } from "@/services/classes";
import { trainersService } from "@/services/trainers";

import { classBookingsService } from "@/services/classBookings";
import { ptBookingsService } from "@/services/ptBookings";
import { ptSessionsService } from "@/services/ptSessions";
import { useAuth } from "@/hooks/useAuth";

/**
 * Prefetches key admin data queries to eliminate loading spinners during sidebar navigation.
 * Note: Route chunk preloading is no longer needed as we use static imports.
 */
export default function RoutePrefetch(props: { role?: string | null }) {
  const auth = useAuth();
  const role = props.role ?? auth.user?.role ?? null;

  useEffect(() => {
    if (role !== "admin") return;

    // Prefetch queries so pages render data immediately (stale-while-revalidate via infinite staleTime)
    // Dashboard (uses default queryFn with URL key)
    void queryClient.prefetchQuery({ queryKey: ["/api/admin/dashboard"] });
    // Admin lists via their service queryFns
    void queryClient.prefetchQuery({ queryKey: ["members"], queryFn: () => membersService.list() });
    void queryClient.prefetchQuery({ queryKey: ["classes"], queryFn: () => classesService.listAdmin() });
    void queryClient.prefetchQuery({ queryKey: ["trainers"], queryFn: () => trainersService.listAdmin() });

    void queryClient.prefetchQuery({ queryKey: ["class-bookings"], queryFn: () => classBookingsService.listAdmin() });
    void queryClient.prefetchQuery({ queryKey: ["pt-bookings"], queryFn: () => ptBookingsService.listAdmin() });
    void queryClient.prefetchQuery({ queryKey: ["pt-session-packages"], queryFn: () => ptSessionsService.listPackages() });
    void queryClient.prefetchQuery({ queryKey: ["pt-session-attendance"], queryFn: () => ptSessionsService.listAttendance() });
    // Recent check-ins (uses URL key)
    void queryClient.prefetchQuery({ queryKey: ["/api/admin/checkins"] });
  }, [role]);

  return null;
}
