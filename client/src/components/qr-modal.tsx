import { useState, useEffect, useRef } from "react";
import { useMemberCheckin } from "@/hooks/useCheckins";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, CheckCircle2, Info, BarChart3, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import idachiLogoPng from "@assets/idachi1.png";
import idachiLogoWebp from "@assets/idachi1.webp";
import { QRCodeCanvas } from "qrcode.react";
import type { MemberQRData } from "@/services/checkins";

interface CheckInStatusData {
  success?: boolean;
  status?: string;
  user?: { firstName?: string; lastName?: string };
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData?: MemberQRData | null;
}

export default function QRModal({ isOpen, onClose, qrData }: QRModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentQRData, setCurrentQRData] = useState<MemberQRData | undefined>(qrData ?? undefined);
  // Render QR via qrcode.react to avoid heavy dataURL generation
  const [checkInUrl, setCheckInUrl] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInStatusData | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  // Ensure we only auto-refresh once per code lifecycle to avoid loops
  const hasAutoRefreshedRef = useRef(false);

  const { generate: generateCheckin } = useMemberCheckin();
  
  // Helper to trigger regeneration
  const regenerate = () => {
    generateCheckin.mutate(undefined, {
      onSuccess: (data: { qrCode: string }) => {
        setCurrentQRData(data);
        toast({ title: "Success", description: "New QR code generated" });
      },
      onError: (error: unknown) => {
        if (isUnauthorizedError(error)) {
          toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
          setTimeout(() => { window.location.href = "/login"; }, 500);
          return;
        }
        toast({ title: "Error", description: "Failed to generate new QR code", variant: "destructive" });
      },
    });
  };

  // Update URL to encode into QR whenever QR data changes
  useEffect(() => {
    if (currentQRData?.qrCode) {
      const url = `${window.location.origin}/checkin/verify/${currentQRData.qrCode}`;
      setCheckInUrl(url);
    }
  }, [currentQRData]);

  // Update currentQRData when qrData prop changes
  useEffect(() => {
    if (qrData && qrData !== currentQRData) {
      setCurrentQRData(qrData);
    }
  }, [qrData, currentQRData]);

  // Countdown timer for QR expiry
  useEffect(() => {
    if (!currentQRData?.expiresAt) return;

    const expiresAt = currentQRData.expiresAt;
    const calculateTimeRemaining = (exp: string | Date) => {
      const now = new Date().getTime();
      const expires = new Date(exp).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      return remaining;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining(expiresAt));

    // Track if refresh is already in progress within this interval
    let refreshInProgress = false;

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Auto-refresh QR shortly before expiry, but only once per lifecycle
      // This avoids repeated refresh loops if server returns near-expired timestamps
      if (
        remaining <= 30 &&
        remaining >= 0 &&
        !refreshInProgress &&
        !generateCheckin.isPending &&
        !hasAutoRefreshedRef.current
      ) {
        refreshInProgress = true;
        hasAutoRefreshedRef.current = true;
        regenerate();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQRData?.expiresAt, generateCheckin.isPending]);

  // When we receive a brand new QR (expiresAt or qrCode changes),
  // reset the auto-refresh flag if there is ample time remaining (> 90s)
  useEffect(() => {
    if (!currentQRData?.expiresAt) return;
    const now = new Date().getTime();
    const expires = new Date(currentQRData.expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expires - now) / 1000));
    if (remaining > 90) {
      hasAutoRefreshedRef.current = false;
    }
  }, [currentQRData?.expiresAt, currentQRData?.qrCode]);

  // Cooldown ticker (server may include cooldownUntil)
  useEffect(() => {
    if (!currentQRData?.cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }
    const until = new Date(currentQRData.cooldownUntil).getTime();
    const update = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((until - now) / 1000));
      setCooldownRemaining(left);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [currentQRData?.cooldownUntil]);

  // Poll QR code status to detect when admin scans it
  useEffect(() => {
    if (!currentQRData?.qrCode || checkInSuccess) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/checkin/status/${currentQRData.qrCode}`);
        const data = await response.json();
        
        if (data.success && data.status === 'used') {
          // QR code has been scanned and check-in is successful
          setCheckInSuccess(true);
          setCheckInData(data);
          
          toast({
            title: "Check-in Berhasil! 🎉",
            description: "Selamat berolahraga!",
          });
        }
      } catch (error) {
        console.error("Error polling QR status:", error);
      }
    };

    // Poll every 2 seconds
    const pollInterval = setInterval(pollStatus, 2000);
    
    // Also poll immediately
    pollStatus();

    return () => clearInterval(pollInterval);
  }, [currentQRData?.qrCode, checkInSuccess, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Display helpers
  // Member display name (fallback to 'Member')
  const memberName = (user?.firstName || user?.lastName)
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : 'Member';
  const membershipPlan = currentQRData?.membership?.plan?.name || 'All Club Membership';
  const membershipEnds = currentQRData?.membership?.endDate ? format(new Date(currentQRData.membership.endDate), 'dd MMM yyyy') : undefined;
  // const memberCardId = user?.id ? `M${user.id.slice(-6).toUpperCase()}` : undefined; // not used

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-qr-code">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Check-in QR Code
          </DialogTitle>
          <DialogDescription className="text-center">
            Tunjukkan QR ini ke admin. QR bersifat permanen dan terkait akun Anda.
          </DialogDescription>
        </DialogHeader>
        
  <div className="flex flex-col items-center space-y-6 p-6">
          {/* Check-in Success UI */}
          {checkInSuccess ? (
            <div className="flex flex-col items-center space-y-6 w-full" data-testid="checkin-success-view">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-green-500 rounded-full p-6">
                  <CheckCircle2 className="w-20 h-20 text-white" data-testid="icon-checkin-success" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-checkin-success">
                  CHECK-IN BERHASIL! 🎉
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Selamat berolahraga!
                </p>
              </div>

              {checkInData?.user && (
                <div className="w-full bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100" data-testid="text-member-name-success">
                    {checkInData.user.firstName} {checkInData.user.lastName}
                  </p>
                </div>
              )}
              
              <Button
                onClick={onClose}
                className="w-full gym-gradient text-white"
                data-testid="button-close-success"
              >
                Tutup
              </Button>
            </div>
          ) : (
            <>
              {/* Membership Card (top) */}
              {/* Animated glow outline + dark card */}
              <div className="relative w-full">
                <div className="absolute -inset-[3px] rounded-3xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 blur-md opacity-50 animate-pulse" aria-hidden />
                <div className="relative w-full rounded-2xl overflow-hidden shadow-xl p-[2px] bg-gradient-to-r from-emerald-500/70 to-cyan-400/70">
                  <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-teal-800 text-white">
                    {/* Watermark logo background (IDACHI) */}
                    <div className="absolute inset-0 pointer-events-none select-none">
                      <picture className="absolute left-2 top-2 w-48 opacity-20" aria-hidden>
                        <source srcSet={idachiLogoWebp} type="image/webp" />
                        <img src={idachiLogoPng} alt="Idachi watermark" className="w-48" loading="lazy" decoding="async" width="192" height="192" />
                      </picture>
                    </div>
                    <div className="p-4 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="text-xs/5 opacity-90">All Club Membership</div>
                        <div className="bg-white/10 rounded-md px-2 py-1 flex items-center gap-2 shadow-sm">
                          <picture className="h-4 w-auto drop-shadow">
                            <source srcSet={idachiLogoWebp} type="image/webp" />
                            <img src={idachiLogoPng} alt="Idachi logo" className="h-4 w-auto" loading="lazy" decoding="async" width="64" height="16" />
                          </picture>
                        </div>
                      </div>

                      {/* Info sections: top-right name, then aligned row Paket vs Berlaku */}
                      <div className="mt-6 space-y-2 text-[10px]">
                        <div className="flex justify-end text-right">
                          <div className="max-w-[60%]">
                            <div className="opacity-90">Nama Member</div>
                            <div className="font-semibold truncate">{memberName || '-'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-start">
                          <div className="min-w-0">
                            <div className="opacity-90">Paket Membership</div>
                            <div className="font-semibold truncate">{membershipPlan || '-'}</div>
                          </div>
                          <div className="text-right min-w-0">
                            <div className="opacity-90">Berlaku Sampai</div>
                            <div className="font-semibold">{membershipEnds || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Block */}
              <div className="w-full bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-5">
                <div className="mx-auto max-w-[280px] rounded-xl bg-white dark:bg-gray-950 p-3 shadow-sm">
                  <div className="rounded-md bg-white p-2 flex items-center justify-center" style={{minHeight: 256}}>
                    {checkInUrl ? (
                      <QRCodeCanvas value={checkInUrl} size={256} includeMargin={true} fgColor="#000000" bgColor="#FFFFFF" />
                    ) : (
                      <div className="w-[256px] h-[256px] flex items-center justify-center bg-gray-100 rounded-md">
                        <QrCode size={64} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Tunjukkan & scan kode QR ini di Club manapun untuk menggunakan fasilitas.
                </p>
              </div>

              {/* Cooldown notice */}
              {cooldownRemaining > 0 && (
                <div className="w-full flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-amber-800 dark:text-amber-200">
                  <Info className="w-4 h-4" />
                  <p className="text-xs">Anda baru saja check-in. Tunggu {formatTime(cooldownRemaining)} sebelum check-in lagi.</p>
                </div>
              )}

              {/* Bottom CTA tile */}
              <button
                type="button"
                onClick={() => { onClose(); window.location.href = '/my-profile'; }}
                className="w-full flex items-center justify-between rounded-2xl bg-white dark:bg-gray-900 border p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><BarChart3 className="w-4 h-4" /></div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Penasaran Dengan Aktivitasmu?</div>
                    <div className="text-xs text-muted-foreground">Lihat aktivitas kamu di 30 hari terakhir</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </>
          )}

          {/* Countdown Timer - Only show when not checked in */}
          {!checkInSuccess && timeRemaining > 0 && (
            <div className={`w-full p-3 rounded-lg border-2 ${
              timeRemaining <= 60 ? 'bg-red-50 dark:bg-red-950/20 border-red-500' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
            }`} data-testid="countdown-timer">
              <div className="flex items-center justify-center gap-2">
                <span className={`font-bold ${
                  timeRemaining <= 60 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`} data-testid="text-time-remaining">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {timeRemaining <= 60 ? 'QR akan expired!' : 'berlaku'}
                </span>
              </div>
            </div>
          )}
          
          {!checkInSuccess && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Scan QR ini untuk check-in. QR ini permanen dan terkait akun Anda.
              </p>
              
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => regenerate()}
                  disabled={generateCheckin.isPending}
                  className="flex-1 gym-gradient text-white"
                  data-testid="button-refresh-qr"
                >
                  <RefreshCw 
                    size={16} 
                    className={`mr-2 ${generateCheckin.isPending ? 'animate-spin' : ''}`} 
                  />
                  {generateCheckin.isPending ? "Loading..." : "Tampilkan QR"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-close-qr-modal"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
