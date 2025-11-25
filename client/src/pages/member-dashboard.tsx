import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMemberCheckin } from "@/hooks/useCheckins";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Lazy load heavy modals to shorten initial JS and LCP
const QRModal = lazy(() => import("@/components/qr-modal"));
const FeedbackModal = lazy(() => import("@/components/feedback-modal"));
import BottomNavigation from "@/components/ui/bottom-navigation";
import BrandTopbar from "@/components/brand-topbar";
import BrandWatermark from "@/components/brand-watermark";
import { Users, Crown } from "lucide-react";
// Defer date formatting library to reduce main bundle. It will be treeshaken but still heavy;
// keeping import here is fine, but the overall code split improves initial payload via other lazies.
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import type { Promotion } from "@/services/promotions";
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
  // Prefetched QR (background) to reduce perceived latency when user taps check-in
  const [prefetchedQR, setPrefetchedQR] = useState<QRPayload | null>(null);
  const prefetchingRef = useRef(false);

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
    queryKey: ["/api/member/bootstrap"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: () => memberDashboardService.getBootstrap(),
  });

  // Manual QR generation (avoid useMutation to keep hook ordering stable)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { generate: generateCheckin } = useMemberCheckin();
  const generateQR = useCallback(async () => {
    if (user && user.active === false) {
      toast({
        title: "Akun sedang Cuti",
        description: "Silakan hubungi admin untuk mengaktifkan kembali akun Anda.",
        variant: "destructive",
      });
      return;
    }
    if (isGeneratingQR) return;
    // If we have a prefetched QR still valid, use it immediately
    if (prefetchedQR?.expiresAt) {
      const expires = new Date(prefetchedQR.expiresAt).getTime();
      if (Date.now() < expires) {
        setQrPayload(prefetchedQR);
        setShowQRModal(true);
        return;
      }
    }
    setIsGeneratingQR(true);
    try {
      const result = await new Promise<QRPayload>((resolve, reject) => {
        generateCheckin.mutate(undefined, {
          onSuccess: (data) => resolve(data as QRPayload),
          onError: (err) => reject(err),
        });
      });
      setQrPayload(result);
      setShowQRModal(true);
      // Optionally you could store the qr payload in state if needed
      // setQrPayload(body);
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err, "Failed to generate QR code"), variant: "destructive" });
    } finally {
      setIsGeneratingQR(false);
    }
  }, [isGeneratingQR, toast, prefetchedQR, user, generateCheckin]);

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
    const o1 = attach(promosAnchorRef, setShowPromos, '140px');
    const o2 = attach(historyAnchorRef, setShowHistory, '120px');
    const o3 = attach(statsGridAnchorRef, setShowStatsGrid, '120px');
    return () => {
      if (o1) o1.disconnect();
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

  // Background prefetch of QR code using requestIdleCallback + AbortController
  useEffect(() => {
    if (!isAuthenticated || user?.active === false) return;
    if (isBusy) return; // wait until dashboard settled
    if (prefetchingRef.current) return;

    const controller = new AbortController();
    type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
    type IdleWin = Window & { requestIdleCallback?: (cb: (d: IdleDeadline) => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const schedule = (cb: () => void) => {
      const w = window as IdleWin;
      if (typeof w.requestIdleCallback === 'function') {
        const id = w.requestIdleCallback(() => cb(), { timeout: 5000 });
        return () => typeof w.cancelIdleCallback === 'function' && w.cancelIdleCallback(id);
      } else {
        const t = setTimeout(cb, 4000);
        return () => clearTimeout(t);
      }
    };

    const cancel = schedule(async () => {
      if (prefetchedQR?.expiresAt) {
        const expires = new Date(prefetchedQR.expiresAt).getTime();
        if (Date.now() < expires - 60_000) {
          return;
        }
      }
      prefetchingRef.current = true;
      try {
        const data = await checkinsService.generateMember({ signal: controller.signal });
        setPrefetchedQR(data);
      } catch {
        // ignore
      } finally {
        prefetchingRef.current = false;
      }
    });

    return () => {
      controller.abort();
      if (cancel) cancel();
    };
  }, [isAuthenticated, user?.active, isBusy, prefetchedQR]);

  // Mobile Promotions mini-carousel (lightweight, client-side)
  // Now sourced from bootstrap payload; still render-gated by viewport to defer work.
  const mobilePromos: Promotion[] = Array.isArray(bootstrap?.promotions) ? (bootstrap!.promotions as Promotion[]) : [];
  const [promoIndex, setPromoIndex] = useState(0);
  const promoTimer = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    // auto-advance only when we have slides
    stopPromoAuto();
    if (mobilePromos.length > 0) {
      promoTimer.current = window.setTimeout(() => {
        setPromoIndex((i) => (i + 1) % mobilePromos.length);
      }, 4500);
    }
    return stopPromoAuto;
  }, [promoIndex, mobilePromos.length]);

  const stopPromoAuto = () => {
    if (promoTimer.current) {
      window.clearTimeout(promoTimer.current);
      promoTimer.current = null;
    }
  };
  const goPromo = (i: number) => {
    if (mobilePromos.length === 0) return;
    stopPromoAuto();
    setPromoIndex((i + mobilePromos.length) % mobilePromos.length);
  };
  const promoPrev = () => goPromo(promoIndex - 1);
  const promoNext = () => goPromo(promoIndex + 1);

  const onPromoTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    stopPromoAuto();
  };
  const onPromoTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onPromoTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (touchStartX.current == null) return;
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) {
      if (dx > 0) promoPrev(); else promoNext();
    }
  };

 

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
                      <p className="text-xs font-semibold">Exp: {membership.endDate ? format(new Date(membership.endDate), "MMM dd") : 'N/A'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-border bg-card/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-xl">
                    <Crown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No Active Membership</p>
                    <p className="text-xs text-muted-foreground">Ask admin to activate your plan</p>
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
            <Card className="p-6 border-border/50 bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
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
  {/* Promotions (fills empty space) - visible on all screens */}
  <section ref={promosAnchorRef} className="mt-4" role="region" aria-label="Promotions" style={{ contentVisibility: 'auto', containIntrinsicSize: '300px' }}>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h2 className="text-sm font-semibold text-foreground">Promotions & Offers</h2>
            <a href="/promotions" className="text-xs font-semibold" style={{ color: "#38F593" }}>See all</a>
          </div>
          {!showPromos ? (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {/* shimmer skeleton */}
              <div className="h-[220px] rounded-2xl bg-muted animate-pulse" />
            </div>
          ) : bootstrapLoading ? (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              <div className="h-[220px] rounded-2xl bg-muted animate-pulse" />
            </div>
          ) : bootstrapError ? (
            <div className="flex items-center justify-between p-3 rounded-xl border bg-card/70">
              <p className="text-xs text-muted-foreground">Tidak bisa memuat promos: {getErrorMessage(bootstrapErr, 'Unknown error')}</p>
              <Button size="sm" variant="outline" onClick={() => refetchBootstrap()}>Coba lagi</Button>
            </div>
          ) : mobilePromos.length === 0 ? (
            <div className="text-xs text-muted-foreground py-3">Belum ada promo aktif</div>
          ) : (
            <div
              className="relative w-full overflow-visible"
              onTouchStart={onPromoTouchStart}
              onTouchMove={onPromoTouchMove}
              onTouchEnd={onPromoTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${promoIndex * 100}%)` }}
              >
                {mobilePromos.map((p) => (
                  <div key={p.id} className="shrink-0 grow-0 basis-full">
                    <a
                      href={p.ctaHref || "#"}
                      className="block mx-auto w-[88%] md:w-[72%] h-[58vw] min-h-[200px] max-h-[320px] relative select-none"
                      draggable={false}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.15)] p-2">
                        <div className="relative w-full h-full rounded-xl overflow-hidden">
                          <img
                            src={p.imageUrl ?? undefined}
                            alt={p.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            width="1200"
                            height="675"
                            sizes="(min-width: 768px) 72vw, 88vw"
                          />
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                {mobilePromos.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => goPromo(i)}
                    className="w-2.5 h-2.5 rounded-full transition-all"
                    style={{ backgroundColor: i === promoIndex ? "#38F593" : "rgba(255,255,255,0.45)", boxShadow: i === promoIndex ? "0 0 10px #38F593" : undefined }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

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
      <Suspense fallback={null}>
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrData={qrPayload}
        />
      </Suspense>
      <Suspense fallback={null}>
        <FeedbackModal
          open={showFeedbackModal}
          onOpenChange={setShowFeedbackModal}
        />
      </Suspense>

      {/* Bottom Navigation */}
      <BottomNavigation
        notificationCount={0}
        onCheckIn={generateQR}
        checkInDisabled={isGeneratingQR || (user ? user.active === false : true)}
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
