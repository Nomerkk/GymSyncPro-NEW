import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/ui/admin-layout";
import AdminCheckInModal from "@/components/admin-checkin-modal";
import { QrCode, Clock, Activity, CalendarCheck, Sparkles } from "lucide-react";
import { format } from "date-fns";

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

export default function AdminCheckIns() {
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

  const { data: dashboardData } = useQuery<any>({
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading check-ins...</p>
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
                Check-ins
              </h1>
              <Activity className="w-6 h-6 text-green-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg">Monitor member check-in activity in real-time</p>
          </div>
          <Button 
            onClick={() => setShowCheckInModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
            data-testid="button-validate-checkin"
          >
            <QrCode className="mr-2" size={16} />
            Scan QR Code
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Today's Check-ins</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {recentCheckIns?.filter(c => {
                      const today = new Date();
                      const checkInDate = new Date(c.checkInTime);
                      return checkInDate.toDateString() === today.toDateString();
                    }).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                  <CalendarCheck className="text-white" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Check-ins</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {recentCheckIns?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <Activity className="text-white" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Members</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {stats.activeToday || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <Sparkles className="text-white" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-ins List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">All Check-ins</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Complete check-in history</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!recentCheckIns || recentCheckIns.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">No check-ins yet</p>
                <p className="text-sm text-muted-foreground">Member check-ins will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkin) => (
                  <div 
                    key={checkin.id} 
                    className="group flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-muted/30 to-transparent hover:from-muted/60 hover:to-muted/20 transition-all border border-transparent hover:border-border cursor-pointer"
                    data-testid={`checkin-${checkin.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                          <AvatarImage src={checkin.user?.profileImageUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-lg">
                            {`${checkin.user?.firstName?.[0] || ''}${checkin.user?.lastName?.[0] || ''}` || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <CalendarCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {checkin.user?.firstName} {checkin.user?.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-xs font-medium">
                            {checkin.membership?.plan?.name || 'No Plan'}
                          </Badge>
                          {checkin.status && (
                            <Badge className="text-xs font-medium bg-green-500">
                              {checkin.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Clock size={16} className="text-muted-foreground" />
                          <p className="font-semibold text-foreground text-lg">
                            {format(new Date(checkin.checkInTime), 'HH:mm')}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(checkin.checkInTime), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Modal */}
      <AdminCheckInModal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
      />
    </AdminLayout>
  );
}
