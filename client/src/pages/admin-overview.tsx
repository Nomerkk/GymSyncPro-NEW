import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
  Clock,
  UserPlus,
  Bell,
  ArrowUpRight,
  Sparkles,
  Activity
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
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
      <div className="space-y-8">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Dashboard
              </h1>
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-muted-foreground text-lg">Welcome back! Here's what's happening today</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => sendReminderMutation.mutate()}
              disabled={sendReminderMutation.isPending}
              variant="outline"
              className="group"
              data-testid="button-send-reminder"
            >
              {sendReminderMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Bell className="mr-2 group-hover:animate-bounce" size={16} />
                  Send Reminder
                </>
              )}
            </Button>
            <Button 
              onClick={() => setShowCheckInModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              data-testid="button-validate-checkin"
            >
              <QrCode className="mr-2" size={16} />
              Scan QR Code
            </Button>
          </div>
        </div>

        {/* Modern Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Members Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Members</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-foreground" data-testid="text-total-members">
                      {stats.totalMembers || 0}
                    </p>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium ml-1">+12%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="text-white" size={26} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Today Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Today</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-foreground" data-testid="text-active-today">
                      {stats.activeToday || 0}
                    </p>
                    <Activity className="w-5 h-5 text-green-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CalendarCheck className="text-white" size={26} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Expiring Soon</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-foreground" data-testid="text-expiring-soon">
                      {stats.expiringSoon || 0}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{"< 20 days"}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TriangleAlert className="text-white" size={26} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Monthly Revenue</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-foreground" data-testid="text-monthly-revenue">
                      ${stats.revenue?.thisMonth || 0}
                    </p>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium ml-1">+8%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">vs last month</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="text-white" size={26} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Check-ins - Takes 2 columns */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">Latest member check-ins</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  data-testid="button-view-all-checkins"
                  onClick={() => window.location.href = '/admin/checkins'}
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!recentCheckIns || recentCheckIns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No recent check-ins</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.slice(0, 5).map((checkin, index) => (
                    <div 
                      key={checkin.id} 
                      className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-transparent hover:from-muted/60 hover:to-muted/20 transition-all cursor-pointer border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                            <AvatarImage src={checkin.user?.profileImageUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {`${checkin.user?.firstName?.[0] || ''}${checkin.user?.lastName?.[0] || ''}`}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                            <CalendarCheck className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {checkin.user?.firstName} {checkin.user?.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {checkin.membership?.plan?.name || 'No Plan'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {format(new Date(checkin.checkInTime), 'HH:mm')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(checkin.checkInTime), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-14 group hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all"
                onClick={() => window.location.href = '/admin/members'}
                data-testid="button-manage-members"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5 text-blue-600 group-hover:text-white" />
                </div>
                <span className="flex-1 text-left font-medium">Manage Members</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-14 group hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 hover:text-white hover:border-transparent transition-all"
                onClick={() => window.location.href = '/admin/classes'}
                data-testid="button-manage-classes"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <CalendarCheck className="w-5 h-5 text-green-600 group-hover:text-white" />
                </div>
                <span className="flex-1 text-left font-medium">Manage Classes</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-14 group hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600 hover:text-white hover:border-transparent transition-all"
                onClick={() => setShowCheckInModal(true)}
                data-testid="button-quick-checkin"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <QrCode className="w-5 h-5 text-purple-600 group-hover:text-white" />
                </div>
                <span className="flex-1 text-left font-medium">Scan QR Code</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Check-in Modal */}
      <AdminCheckInModal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
      />
    </AdminLayout>
  );
}
