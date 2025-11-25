import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { RecentCheckinsList } from "@/components/admin/recent-checkins-list";
import AdminLayout from "@/components/ui/admin-layout";
import AdminCheckInModal from "@/components/admin-checkin-modal";
import { inactivityService } from "@/services/inactivity";
import { getErrorMessage } from "@/lib/errors";
import {
  Users,
  CalendarCheck,
  TriangleAlert,
  DollarSign,
  QrCode,
  Bell
} from "lucide-react";
 

interface AdminDashboardStats {
  totalMembers?: number;
  activeToday?: number;
  expiringSoon?: number;
  revenue?: {
    thisMonth?: number;
    lastMonth?: number;
    total?: number;
  };
}

interface AdminDashboardResponse {
  stats?: AdminDashboardStats;
}

interface CheckInRecord {
  id: string;
  checkInTime: string;
  status?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  membership?: {
    plan?: {
      name?: string;
    };
  };
}

export default function AdminOverview() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const sendReminderMutation = useMutation({
    mutationFn: async () => inactivityService.sendReminders(),
    onSuccess: (data) => {
      toast({
        title: "Reminder Berhasil Dikirim! ✅",
        description: data?.message || "Reminder telah dikirim ke member tidak aktif",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Gagal Mengirim Reminder",
        description: getErrorMessage(error, "Terjadi kesalahan saat mengirim reminder"),
        variant: "destructive",
      });
    },
  });

  const { data: dashboardData } = useQuery<AdminDashboardResponse>({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: recentCheckIns } = useQuery<CheckInRecord[]>({
    queryKey: ["/api/admin/checkins"],
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 10000,
  });

  // Do not block rendering while queries load; rely on cached data.

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = dashboardData?.stats || {};

  return (
    <AdminLayout user={user} notificationCount={stats.expiringSoon || 0}>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle={"Welcome back! Here's your gym overview"}
          actions={
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => sendReminderMutation.mutate()}
                disabled={sendReminderMutation.isPending}
                variant="outline"
                data-testid="button-send-reminder"
              >
                {sendReminderMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2" size={16} />
                    Send Reminder
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowCheckInModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-validate-checkin"
              >
                <QrCode className="mr-2" size={16} />
                Scan QR Code
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <DashboardStatCard
            icon={<div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>}
            label="Total Members"
            value={<span data-testid="text-total-members">{stats.totalMembers || 0}</span>}
          />
          <DashboardStatCard
            icon={<div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CalendarCheck className="w-6 h-6 text-green-600 dark:text-green-400" /></div>}
            label="Active Today"
            value={<span data-testid="text-active-today">{stats.activeToday || 0}</span>}
          />
          <DashboardStatCard
            icon={<div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><TriangleAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" /></div>}
            label="Expiring Soon"
            value={<span data-testid="text-expiring-soon">{stats.expiringSoon || 0}</span>}
          />
          <DashboardStatCard
            icon={<div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>}
            label="Monthly Revenue"
            value={<span data-testid="text-monthly-revenue">${stats.revenue?.thisMonth || 0}</span>}
          />
        </div>

        {/* Recent Activity */}
        <RecentCheckinsList
          items={recentCheckIns}
          onViewAll={() => {
            window.location.href = '/admin/checkins';
          }}
        />
      </div>
      <AdminCheckInModal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} />
    </AdminLayout>
  );
}
