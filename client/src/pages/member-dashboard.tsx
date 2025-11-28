import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMemberCheckin } from "@/hooks/useCheckins";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRModal from "@/components/qr-modal";
import FeedbackModal from "@/components/feedback-modal";
import BottomNavigation from "@/components/ui/bottom-navigation";
import BrandTopbar from "@/components/brand-topbar";
import BrandWatermark from "@/components/brand-watermark";
import { Users, Crown } from "lucide-react";
// Defer date formatting library to reduce main bundle. It will be treeshaken but still heavy;
// keeping import here is fine, but the overall code split improves initial payload via other lazies.
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { memberDashboardService } from "@/services/memberDashboard";
import type { MemberBootstrapPayload as BootstrapPayload, MemberCheckIn as CheckIn } from "@/services/memberDashboard";
import { checkinsService, type MemberQRData as QRPayload } from "@/services/checkins";

interface RecentCheckInSummary { id: string; dateText: string; timeText: string; status: string }

// getErrorMessage centralized in @/lib/errors

export default function MemberDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [qrPayload, setQrPayload] = useState<QRPayload | null>(null);
  // Fetch static QR code
  const { data: qrData, isLoading: qrLoading } = useQuery({
    queryKey: ["/api/member/qrcode", user?.id],
    queryFn: () => checkinsService.getMemberQR(),
    enabled: !!user && user.active !== false,
    staleTime: Infinity, // Static QR doesn't change often
    refetchOnWindowFocus: false,
  });

  // Debug: render counter to help track unexpected hook-order / HMR issues
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  useEffect(() => {
    console.debug("[MemberDashboard] render", renderCountRef.current, {
      isAuthenticated,
      isLoading,
      user: user?.id,
    });
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Session Expired",
        description: "Please log in again",
        variant: "destructive",
      });
      setTimeout(() => (window.location.href = "/login"), 400);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: bootstrap, isLoading: bootstrapLoading, isError: bootstrapError, error: bootstrapErr, refetch: refetchBootstrap } = useQuery<BootstrapPayload>({
    queryKey: ["/api/member/bootstrap", user?.id],
    enabled: isAuthenticated,
    retry: false,
    queryFn: () => memberDashboardService.getBootstrap(),
  });

  // Show QR Modal
  const showQR = useCallback(() => {
    if (user && user.active === false) {
      toast({
        title: "Akun sedang Cuti",
        description: "Silakan hubungi admin untuk mengaktifkan kembali akun Anda.",
        variant: "destructive",
      });
      return;
    }

    if (qrData) {
      setQrPayload(qrData);
      setShowQRModal(true);
    } else if (qrLoading) {
      toast({
        title: "Loading",
        description: "Sedang memuat QR code...",
      });
    } else {
      toast({
        title: "Error",
        description: "Gagal memuat QR code. Silakan refresh halaman.",
        variant: "destructive",
      });
    }
  }, [qrData, qrLoading, user, toast]);

  const isBusy = isLoading || bootstrapLoading;
  const noUser = !user;

  const membership = bootstrap?.dashboard?.membership;
  const checkIns = bootstrap?.dashboard?.checkIns || [];
  const stats = bootstrap?.dashboard?.stats || {};

  // Memoize derived recent check-ins (top-level to respect Rules of Hooks)
  const recentCheckIns = useMemo(() =>
    (checkIns || []).slice(0, 5).map((c: CheckIn) => ({
      id: c.id,
      dateText: new Date(c.checkInTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      timeText: new Date(c.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: c.status,
    })),
    [checkIns]
  ) as RecentCheckInSummary[];

  // IntersectionObserver-driven lazy mount for non-critical sections
  const [showPromos, setShowPromos] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // check-in history panel
  const [showStatsGrid, setShowStatsGrid] = useState(false); // auxiliary stats grid if added later
  const promosAnchorRef = useRef<HTMLDivElement | null>(null);
  const historyAnchorRef = useRef<HTMLDivElement | null>(null);
  const statsGridAnchorRef = useRef<HTMLDivElement | null>(null);
  // Generic observer attach helper
  useEffect(() => {
    const attach = (ref: React.RefObject<HTMLElement>, setter: (v: boolean) => void, margin = '160px') => {
      if (!ref.current) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setter(true);
            obs.disconnect();
          }
        });
      }, { rootMargin: margin });
      obs.observe(ref.current);
      return obs;
    };
    const o2 = attach(historyAnchorRef, setShowHistory, '120px');
    const o3 = attach(statsGridAnchorRef, setShowStatsGrid, '120px');
    return () => {
      if (o2) o2.disconnect();
      if (o3) o3.disconnect();
    };
  }, []);

  const getDaysUntilExpiry = () => {
    if (!membership?.endDate) return 0;
    const now = new Date();
    const expiry = new Date(membership.endDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();



  return (
    <div className="relative min-h-screen bg-background pb-20 overflow-hidden">
      {/* Centered background watermark */}
      <BrandWatermark opacity={0.2} />

      {/* Fixed top brand bar (full width, text-only) */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <BrandTopbar className="rounded-none px-4 py-3" />
      </div>
      {/* Spacer to offset fixed bar height */}
      <div aria-hidden className="h-14" />

      {/* Header (scrolls with content) */}
      <header className="bg-gradient-to-br from-primary/15 via-neon-purple/10 to-background border-b border-border relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* brand bar moved to fixed top */}

          {/* Loading / Redirect states */}
          {isBusy || noUser ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-3">{noUser ? 'Redirecting to login…' : 'Loading…'}</p>
            </div>
          ) : null}

          {/* Membership Status Banner (with fallback) */}
          {membership ? (
            membership.status === 'expired' ? (
              // Expired Membership Card
              <div className="p-4 rounded-2xl text-white bg-gradient-to-r from-red-600 to-orange-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-90">Membership Expired</p>
                      <p className="text-sm font-bold">{membership.plan?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-90">Expired on</p>
                    <p className="text-xs font-semibold">{membership.endDate ? new Date(membership.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs text-white/90 mb-2">Silahkan datang ke gym terdekat untuk mendaftar membership</p>
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => (window.location.href = '/my-profile')}>
                      Renew Now
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Active Membership Card
              <div className={cn("p-4 rounded-2xl text-white",
                user?.active === false ? "bg-gradient-to-r from-yellow-600 to-amber-600" : "bg-gradient-to-r from-primary to-neon-purple"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-90">
                        {user?.active === false ? "Membership Dijeda (Cuti)" : "Active Membership"}
                      </p>
                      <p className="text-sm font-bold">{membership.plan?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {user?.active === false ? (
                      <p className="text-xs opacity-90">Tidak berjalan selama Cuti</p>
                    ) : (
                      <>
                        <p className="text-xs opacity-90">{daysLeft} days left</p>
                        <p className="text-xs font-semibold">Exp: {membership.endDate ? new Date(membership.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : 'N/A'}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            // No Membership Card
            <div className="p-4 rounded-2xl border border-border bg-card/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-xl">
                    <Crown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No Active Membership</p>
                    <p className="text-xs text-muted-foreground">Silahkan datang ke gym terdekat untuk mendaftar membership</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = '/my-profile')}>
                  View Profile
                </Button>
              </div>
            </div>
          )}
          {!isBusy && !noUser && user?.active === false && (
            <div className="mt-3 p-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-200">
              <p className="text-xs">
                Akun Anda sedang <span className="font-semibold">Cuti</span>. Check-in dan booking sementara dinonaktifkan. Hubungi admin untuk mengaktifkan kembali.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {isBusy || noUser ? null : (
          <>

            {/* Gym Crowd Status (always visible with safe fallback) */}
            {(() => {
              const hasCrowd = typeof stats.currentCrowd === 'number';
              const value: number = hasCrowd ? (stats.currentCrowd as number) : 0;
              return (
                <Card className="p-6 border-border/50 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Gym Crowd</p>
                        <p className="text-xs text-muted-foreground">Current occupancy</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{value}</p>
                      <p className="text-xs text-muted-foreground">people{!hasCrowd ? ' (N/A)' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          value < 10 ? "bg-neon-green" : value < 25 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min((value / 40) * 100, 100)}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {value < 10 ? 'Quiet' : value < 25 ? 'Moderate' : 'Busy'}
                    </Badge>
                  </div>
                </Card>
              );
            })()}
            {/* Promotions removed */}

            {/* Deferred Check-in History (shows after initial content) */}
            <section ref={historyAnchorRef} className="mt-8" role="region" aria-label="Recent Check-ins" style={{ contentVisibility: 'auto', containIntrinsicSize: '160px' }}>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <h2 className="text-sm font-semibold text-foreground">Recent Check-ins</h2>
                <a href="/my-bookings" className="text-xs font-semibold" style={{ color: '#38F593' }}>Details</a>
              </div>
              {/* Skeleton until section enters view OR dashboard still loading */}
              {!showHistory || bootstrapLoading ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  {/* skeleton rows */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : checkIns.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">Belum ada riwayat check-in</p>
              ) : (
                <div className="space-y-2">
                  {recentCheckIns.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border bg-card/70 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <span className="text-[10px] font-bold text-primary">IN</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium">{c.dateText}</p>
                          <p className="text-[10px] text-muted-foreground">{c.timeText}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{c.status === 'completed' ? 'Done' : 'Active'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Placeholder for future deferred stats grid */}
            <section ref={statsGridAnchorRef} className="mt-8" role="region" aria-label="Extra Stats">
              {!showStatsGrid ? (
                <div className="h-20 rounded-xl bg-muted animate-pulse" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border bg-card/70 backdrop-blur-sm">
                    <p className="text-[10px] text-muted-foreground">Monthly Check-ins</p>
                    <p className="text-lg font-bold">{stats.monthlyCheckIns || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-card/70 backdrop-blur-sm">
                    <p className="text-[10px] text-muted-foreground">Upcoming Classes</p>
                    <p className="text-lg font-bold">{stats.upcomingClasses || 0}</p>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modals (lazy, with lightweight fallbacks) */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={qrPayload}
        user={user ?? null}
      />
      <FeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        notificationCount={0}
        onCheckIn={showQR}
        checkInDisabled={qrLoading || (user ? user.active === false : true)}
      />

      {/* Subtle dashboard error ribbon (non-blocking) */}
      {bootstrapError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-xs border">
          Gagal memuat dashboard: {getErrorMessage(bootstrapErr, 'Unknown error')}
        </div>
      )}
    </div>
  );
}
