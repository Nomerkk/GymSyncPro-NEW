import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/ui/admin-layout";
import AdminCheckInModal from "@/components/admin-checkin-modal";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  CalendarCheck,
  TriangleAlert,
  DollarSign,
  QrCode,
  Bell
} from "lucide-react";
import { format } from "date-fns";

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
  users?: any[];
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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/send-inactivity-reminders", {
        daysInactive: 7
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Berhasil Dikirim! ✅",
        description: `${data.count} reminder telah dikirim ke member yang tidak aktif ${data.daysInactive} hari`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Mengirim Reminder",
        description: error.message || "Terjadi kesalahan saat mengirim reminder",
        variant: "destructive",
      });
    },
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<AdminDashboardResponse>({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  const { data: recentCheckIns } = useQuery<CheckInRecord[]>({
    queryKey: ["/api/admin/checkins"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
    refetchInterval: 10000,
  });

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = dashboardData?.stats || {};

  return (
    <AdminLayout user={user} notificationCount={stats.expiringSoon || 0}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's your gym overview</p>
          </div>
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Members</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-total-members">
                  {stats.totalMembers || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Today</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-active-today">
                  {stats.activeToday || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TriangleAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-expiring-soon">
                  {stats.expiringSoon || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-monthly-revenue">
                  ${stats.revenue?.thisMonth || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-200 dark:border-slate-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Check-ins</h3>
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="button-view-all-checkins"
                onClick={() => window.location.href = '/admin/checkins'}
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {!recentCheckIns || recentCheckIns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">No recent check-ins</p>
                </div>
              ) : (
                recentCheckIns.slice(0, 5).map((checkin) => (
                  <div 
                    key={checkin.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={checkin.user?.profileImageUrl} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {`${checkin.user?.firstName?.[0] || ''}${checkin.user?.lastName?.[0] || ''}`}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {checkin.user?.firstName} {checkin.user?.lastName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {checkin.membership?.plan?.name || 'No Plan'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {format(new Date(checkin.checkInTime), 'HH:mm')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(checkin.checkInTime), 'dd MMM')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      <AdminCheckInModal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
      />
    </AdminLayout>
  );
}
