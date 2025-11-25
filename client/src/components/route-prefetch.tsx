import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { membersService } from "@/services/members";
import { classesService } from "@/services/classes";
import { trainersService } from "@/services/trainers";
import { promotionsService } from "@/services/promotions";
import { classBookingsService } from "@/services/classBookings";
import { ptBookingsService } from "@/services/ptBookings";
import { ptSessionsService } from "@/services/ptSessions";
import { useAuth } from "@/hooks/useAuth";

/**
 * Preloads lazy route chunks and prefetches key admin data queries
 * to eliminate loading spinners during sidebar navigation.
 */
export default function RoutePrefetch(props: { role?: string | null }) {
  const auth = useAuth();
  const role = props.role ?? auth.user?.role ?? null;

  useEffect(() => {
    if (role !== "admin") return;

    // 1) Warm up route chunks (React.lazy) so Suspense fallback doesn't flash
    // Note: these dynamic imports are non-blocking and run in the background
    const preloadRoutes = [
      () => import("@/pages/admin-overview"),
      () => import("@/pages/admin-members"),
      () => import("@/pages/admin-classes"),
      () => import("@/pages/admin-trainers"),
      () => import("@/pages/admin-plans"),
      () => import("@/pages/admin-checkins"),
      () => import("@/pages/admin-feedback"),
      () => import("@/pages/admin-pt-bookings"),
      () => import("@/pages/admin-pt-sessions"),
      () => import("@/pages/admin-promotions"),
      () => import("@/pages/admin-class-bookings"),
    ];

    // Start preloading on the next tick to avoid blocking current render
    setTimeout(() => {
      try {
        // Fire-and-forget
        preloadRoutes.forEach((fn) => void fn());
      } catch {}

      // 2) Prefetch queries so pages render data immediately (stale-while-revalidate via infinite staleTime)
      // Dashboard (uses default queryFn with URL key)
      void queryClient.prefetchQuery({ queryKey: ["/api/admin/dashboard"] });
      // Admin lists via their service queryFns
      void queryClient.prefetchQuery({ queryKey: ["members"], queryFn: membersService.list });
      void queryClient.prefetchQuery({ queryKey: ["classes"], queryFn: classesService.listAdmin });
      void queryClient.prefetchQuery({ queryKey: ["trainers"], queryFn: trainersService.listAdmin });
      void queryClient.prefetchQuery({ queryKey: ["promotions"], queryFn: promotionsService.listAdmin });
      void queryClient.prefetchQuery({ queryKey: ["class-bookings"], queryFn: classBookingsService.listAdmin });
      void queryClient.prefetchQuery({ queryKey: ["pt-bookings"], queryFn: ptBookingsService.listAdmin });
      void queryClient.prefetchQuery({ queryKey: ["pt-session-packages"], queryFn: ptSessionsService.listPackages });
      void queryClient.prefetchQuery({ queryKey: ["pt-session-attendance"], queryFn: ptSessionsService.listAttendance });
      // Recent check-ins (uses URL key)
      void queryClient.prefetchQuery({ queryKey: ["/api/admin/checkins"] });
    }, 0);
  }, [role]);

  return null;
}
