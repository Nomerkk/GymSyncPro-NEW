import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { RecentCheckinsList } from "@/components/admin/recent-checkins-list";
import AdminCheckInModal from "@/components/admin-checkin-modal";
import { inactivityService } from "@/services/inactivity";
import { getErrorMessage } from "@/lib/errors";
import {
  Users,
  CalendarCheck,
  TriangleAlert,
  DollarSign,
  QrCode,
  Bell,
  Building2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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

interface ExpiringMember {
  id: string;
  endDate: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
    profileImageUrl?: string;
  };
  plan: {
    name: string;
  };
}

interface AdminDashboardResponse {
  stats?: AdminDashboardStats;
  expiringMembers?: ExpiringMember[];
}

interface CheckInRecord {
  id: string;
  checkInTime: string;
  status?: string;
  branch?: string; // Branch where check-in occurred
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
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login-admin";
      }, 1500);
    }
  }, [isLoading, isAuthenticated, isAdmin, user?.role, toast]);

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
    queryKey: ["/api/admin/dashboard", branchFilter],
    queryFn: async () => {
      const url = new URL("/api/admin/dashboard", window.location.origin);
      if (isSuperAdmin && branchFilter !== "all") {
        url.searchParams.append("branch", branchFilter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    enabled: isAuthenticated && isAdmin,
  });

  const { data: recentCheckIns, refetch } = useQuery<CheckInRecord[]>({
    queryKey: ["/api/admin/checkins", branchFilter],
    queryFn: async () => {
      const url = new URL("/api/admin/checkins", window.location.origin);
      if (isSuperAdmin && branchFilter !== "all") {
        url.searchParams.append("branch", branchFilter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch checkins");
      return res.json();
    },
    enabled: isAuthenticated && isAdmin,
    refetchOnMount: 'always',
    // Removed aggressive 1-second polling to prevent ERR_INSUFFICIENT_RESOURCES
    // Use manual refetch or websockets for real-time updates instead
  });

  // Log when recent check-ins data changes
  useEffect(() => {
    if (recentCheckIns) {
      console.log("[AdminOverview] Recent check-ins updated:", recentCheckIns.length, "items");
    }
  }, [recentCheckIns]);

  // Do not block rendering while queries load; rely on cached data.

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  const stats = dashboardData?.stats;
  const expiringMembers = dashboardData?.expiringMembers || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Welcome back, Admin"
        actions={
          <div className="flex gap-2 items-center">
            {isSuperAdmin && (
              <div className="w-[200px]">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    <SelectItem value="Cikarang">Cikarang</SelectItem>
                    <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={() => setShowCheckInModal(true)} className="gap-2">
              <QrCode className="h-4 w-4" />
              Scan Check-in
            </Button>
            <Button variant="outline" onClick={() => sendReminderMutation.mutate()} disabled={sendReminderMutation.isPending} className="gap-2">
              <Bell className="h-4 w-4" />
              {sendReminderMutation.isPending ? "Sending..." : "Send Inactivity Reminder"}
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Total Members"
          value={stats?.totalMembers || 0}
          icon={<Users className="h-6 w-6 text-blue-600" />}
        />
        <DashboardStatCard
          label="Active Today"
          value={stats?.activeToday || 0}
          icon={<CalendarCheck className="h-6 w-6 text-green-600" />}
        />
        <DashboardStatCard
          label="Expiring Soon"
          value={stats?.expiringSoon || 0}
          icon={<TriangleAlert className="h-6 w-6 text-orange-600" />}
        />
        <DashboardStatCard
          label="Monthly Revenue"
          value={`Rp ${(stats?.revenue?.thisMonth || 0).toLocaleString('id-ID')}`}
          icon={<DollarSign className="h-6 w-6 text-purple-600" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Check-ins */}
        <RecentCheckinsList items={recentCheckIns || []} />

        {/* Expiring Members List */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight">Expiring Soon</h3>
            <p className="text-sm text-muted-foreground">Memberships expiring in less than 15 days</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {expiringMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No memberships expiring soon.</p>
              ) : (
                expiringMembers.map((member) => {
                  const daysLeft = Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {member.user.firstName?.[0] || member.user.username?.[0] || "M"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{member.plan.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${daysLeft <= 3 ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {daysLeft} days left
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Exp: {new Date(member.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <AdminCheckInModal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={() => {
          console.log("[AdminOverview] Check-in success, refetching list...");
          refetch();
        }}
      />
    </div>
  );
}
