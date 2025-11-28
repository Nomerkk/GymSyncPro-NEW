import { Switch, Route, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/ui/admin-layout";
import AdminOverview from "@/pages/admin-overview";
import AdminMembers from "@/pages/admin-members";
import AdminClasses from "@/pages/admin-classes";

import AdminTrainers from "@/pages/admin-trainers";
import AdminPlans from "@/pages/admin-plans";
import AdminCheckIns from "@/pages/admin-checkins";
import AdminFeedback from "@/pages/admin-feedback";
import AdminPTBookings from "@/pages/admin-pt-bookings";
import AdminPTSessions from "@/pages/admin-pt-sessions";
import AdminClassBookings from "@/pages/admin-class-bookings";
import AdminAuditLogs from "@/pages/admin-audit-logs";
import AdminManagementPage from "@/pages/admin-management";

interface AdminDashboardData {
    stats?: {
        expiringSoon?: number;
    };
}

export default function AdminRoutes() {
    const { user, isAuthenticated, isSuperAdmin, isLoading } = useAuth();

    // Fetch global admin stats for the layout (notification count)
    const { data: dashboardData } = useQuery<AdminDashboardData>({
        queryKey: ["/api/admin/dashboard"],
        enabled: isAuthenticated && (user?.role === 'admin' || isSuperAdmin),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const notificationCount = dashboardData?.stats?.expiringSoon || 0;

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading admin routes...</div>;
    }

    if (!isAuthenticated || (user?.role !== 'admin' && !isSuperAdmin)) {
        console.log("[AdminRoutes] Access denied:", { isAuthenticated, role: user?.role, isSuperAdmin });
        return <Redirect to="/login-admin" />;
    }

    return (
        <AdminLayout user={user || undefined} notificationCount={notificationCount}>
            <Switch>
                <Route path="/admin">
                    <Redirect to="/admin/overview" />
                </Route>
                <Route path="/admin/overview" component={AdminOverview} />
                <Route path="/admin/members" component={AdminMembers} />
                <Route path="/admin/classes" component={AdminClasses} />
                <Route path="/admin/trainers" component={AdminTrainers} />
                <Route path="/admin/plans" component={AdminPlans} />
                <Route path="/admin/checkins" component={AdminCheckIns} />
                <Route path="/admin/feedback" component={AdminFeedback} />
                <Route path="/admin/pt-bookings" component={AdminPTBookings} />
                <Route path="/admin/pt-sessions" component={AdminPTSessions} />
                <Route path="/admin/class-bookings" component={AdminClassBookings} />

                {/* Super Admin Routes */}
                <Route path="/admin/audit-logs" component={AdminAuditLogs} />
                <Route path="/admin/management" component={AdminManagementPage} />
                <Route>
                    <Redirect to="/admin/overview" />
                </Route>
            </Switch>
        </AdminLayout>
    );
}
