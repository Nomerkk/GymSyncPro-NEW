import { useState, useEffect, useRef } from "react";
import { checkinsService } from "@/services/checkins";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CheckInNotificationPopup from "@/components/checkin-notification-popup";
import { QrCode, Calendar, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Html5Qrcode } from "html5-qrcode";
import { getErrorMessage } from "@/lib/errors";
import type { CheckinValidationResult } from "@/services/checkins";
import { queryClient } from "@/lib/queryClient";

interface AdminCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Use shared CheckinValidationResult type from services; remove local duplicates

export default function AdminCheckInModal({ open, onClose, onSuccess }: AdminCheckInModalProps): JSX.Element {
  const { toast } = useToast();
  // qrCode local state removed – we pass decoded value directly to mutation
  const [memberData, setMemberData] = useState<CheckinValidationResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<CheckinValidationResult | null>(null);
  const [lockerNumber, setLockerNumber] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedData, setConfirmedData] = useState<CheckinValidationResult | null>(null);
  const [scannedQrCode, setScannedQrCode] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef<boolean>(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const lastScanAtRef = useRef<number>(0);
  const lastCodeRef = useRef<string | null>(null);
  const scannerDivId = "qr-reader";

  // Using direct service with AbortSignal for validation


  const startScanner = async () => {
    try {
      setIsScanning(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerDivId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (processingRef.current) {
            return;
          }

          // Simple debounce: ignore scans within 300ms
          const now = Date.now();
          if (now - lastScanAtRef.current < 300) return;
          lastScanAtRef.current = now;

          processingRef.current = true;
          // we no longer store raw decoded text; process immediately

          let qrCodeValue = decodedText;
          if (decodedText.includes('/checkin/verify/')) {
            const parts = decodedText.split('/checkin/verify/');
            qrCodeValue = parts[1] || decodedText;
          } else if (decodedText.includes('/')) {
            const parts = decodedText.split('/');
            qrCodeValue = parts[parts.length - 1] || decodedText;
          }
          // De-duplicate same code back-to-back
          if (lastCodeRef.current === qrCodeValue) {
            processingRef.current = false;
            return;
          }
          lastCodeRef.current = qrCodeValue;

          stopScanner();
          // Abort any in-flight validation
          if (requestControllerRef.current) {
            requestControllerRef.current.abort();
          }
          const controller = new AbortController();
          requestControllerRef.current = controller;

          const isAbort = (e: unknown) => (
            e instanceof DOMException && e.name === 'AbortError'
          ) || (
              typeof e === 'object' && e !== null && 'name' in e && (e as { name?: string }).name === 'AbortError'
            );

          // Show loading state
          setIsScanning(false); // Pause scanning visually
          toast({
            title: "Memproses...",
            description: "Sedang memvalidasi QR Code",
          });

          checkinsService.validate(qrCodeValue, { signal: controller.signal })
            .then((data) => {
              console.log("[AdminCheckInModal] Validation response:", data);

              // If validation failed (e.g., already checked in, cooldown, etc.)
              if (!data.success) {
                console.log("[AdminCheckInModal] Validation failed:", data.message);

                // Clear any previous member data to prevent showing stale info
                setMemberData(null);
                setScannedQrCode("");

                // Show immediate toast alert
                toast({
                  title: "Gagal Validasi",
                  description: data.message || "Validasi gagal",
                  variant: "destructive",
                });

                // Also show notification popup for visual feedback
                setNotificationData(data);
                setShowNotification(true);

                // Stop scanner and don't proceed to confirmation
                stopScanner();
                return;
              }

              // Validation successful - proceed to show member info for confirmation
              console.log("[AdminCheckInModal] Validation success, waiting for confirmation");
              setMemberData(data);
              setScannedQrCode(qrCodeValue); // Save QR code for later approval
              stopScanner();
            })
            .catch((error) => {
              if (isAbort(error)) {
                return; // ignore aborts
              }
              toast({ title: "Validasi Gagal", description: getErrorMessage(error, "QR code tidak valid atau sudah expired"), variant: "destructive" });
              setMemberData(null);
            })
            .finally(() => {
              processingRef.current = false;
            });
        },
        () => { }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = await scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
      setIsScanning(false);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    setMemberData(null);
    setLockerNumber("");
    setConfirmedData(null);
    setScannedQrCode("");
    processingRef.current = false;
    lastCodeRef.current = null;
    lastScanAtRef.current = 0;
    if (requestControllerRef.current) {
      requestControllerRef.current.abort();
    }
    onClose();
  };


  useEffect(() => {
    if (open && !isScanning && !memberData) {
      processingRef.current = false;

      const timer = setTimeout(() => {
        startScanner();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          stopScanner();
        }
      };
    }

    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [open, memberData]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const getMembershipStatus = (endDate: string | Date) => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "Expired", variant: "destructive" as const };
    if (daysUntilExpiry <= 7) return { status: "Expiring Soon", variant: "destructive" as const };
    if (daysUntilExpiry <= 30) return { status: "Active", variant: "default" as const };
    return { status: "Active", variant: "default" as const };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-admin-checkin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Validasi Check-in Member
            </DialogTitle>
            <DialogDescription>
              Scan QR code member untuk validasi check-in
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!memberData && (
              <div className="space-y-2">
                <div className="text-sm text-center text-muted-foreground mb-2">
                  Arahkan kamera ke QR code member
                </div>
                <div
                  id={scannerDivId}
                  className="w-full border-2 border-dashed border-primary rounded-lg overflow-hidden"
                  data-testid="div-qr-scanner"
                />
                {isScanning && (
                  <p className="text-xs text-center text-muted-foreground">
                    Scanner aktif - mencari QR code...
                  </p>
                )}
              </div>
            )}

            {memberData && (
              <div className="space-y-4">
                {confirmedData ? (
                  <div className="flex flex-col items-center justify-center py-6 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500">
                    <div className="bg-green-500 rounded-full p-4 mb-4">
                      <CheckCircle2 className="w-12 h-12 text-white" data-testid="icon-success-checkmark" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-success-message">
                      CHECK-IN BERHASIL
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2" data-testid="text-checkin-time">
                      {confirmedData.checkInTime ? format(new Date(confirmedData.checkInTime), "HH:mm, dd MMMM yyyy") : ""}
                    </p>
                  </div>
                ) : memberData.success ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-500">
                      <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        Validasi Berhasil
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Silakan isi nomor loker dan konfirmasi check-in
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locker">Nomor Loker (Opsional)</Label>
                      <Input
                        id="locker"
                        placeholder="Contoh: A-12"
                        value={lockerNumber}
                        onChange={(e) => setLockerNumber(e.target.value)}
                        disabled={isConfirming}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-500">
                    <div className="bg-red-500 rounded-full p-4 mb-4">
                      <XCircle className="w-12 h-12 text-white" data-testid="icon-fail-cross" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-fail-message">
                      CHECK-IN GAGAL
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2" data-testid="text-fail-reason">
                      {memberData.message || "Belum Terdaftar Membership"}
                    </p>
                  </div>
                )}

                <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16" data-testid="img-member-avatar">
                      <AvatarImage src={memberData.user?.profileImageUrl ?? undefined} />
                      <AvatarFallback>
                        {`${memberData.user?.firstName?.[0] || ''}${memberData.user?.lastName?.[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid="text-member-name">
                        {memberData.user?.firstName} {memberData.user?.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-member-email">
                        {memberData.user?.email}
                      </p>
                    </div>
                  </div>

                  {memberData.membership ? (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Membership</span>
                        </div>
                        <Badge
                          variant={getMembershipStatus(memberData.membership.endDate).variant}
                          data-testid="badge-membership-status"
                        >
                          {memberData.membership.plan.name}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Berlaku Hingga</span>
                        </div>
                        <span className="text-sm" data-testid="text-membership-enddate">
                          {format(new Date(memberData.membership.endDate), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center border-t border-border">
                      <Badge variant="destructive">Tidak ada membership aktif</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {(() => {
              console.log("[AdminCheckInModal] Button render check:", {
                hasMemberData: !!memberData,
                memberDataSuccess: memberData?.success,
                hasConfirmedData: !!confirmedData,
                shouldShowConfirmButton: memberData?.success && !confirmedData
              });
              return null;
            })()}
            {memberData?.success && !confirmedData ? (
              <>
                <Button variant="outline" onClick={handleClose} disabled={isConfirming}>
                  Batal
                </Button>
                <Button
                  onClick={async () => {
                    console.log("[AdminCheckInModal] Konfirmasi button clicked!");
                    if (!scannedQrCode) {
                      console.log("[AdminCheckInModal] No QR code, aborting");
                      return;
                    }
                    setIsConfirming(true);
                    try {
                      console.log("[AdminCheckInModal] Calling approve API...");
                      const result = await checkinsService.approve({
                        qrCode: scannedQrCode,
                        lockerNumber: lockerNumber || undefined
                      });

                      console.log("[AdminCheckInModal] Check-in approved:", result);

                      setConfirmedData(result);
                      setNotificationData(result);
                      setShowNotification(true);

                      // Optimistic update: Manually update cache immediately
                      if (result.checkIn) {
                        console.log("[AdminCheckInModal] Performing optimistic cache update...");
                        queryClient.setQueryData(["/api/admin/checkins"], (oldData: any[] | undefined) => {
                          const newRecord = {
                            id: result.checkIn!.id,
                            checkInTime: result.checkIn!.checkInTime,
                            status: result.checkIn!.status,
                            branch: result.checkIn!.branch,
                            user: result.user,
                            membership: result.membership
                          };
                          return oldData ? [newRecord, ...oldData] : [newRecord];
                        });
                      }

                      // Invalidate to ensure consistency (will refetch in background)
                      console.log("[AdminCheckInModal] Invalidating queries...");
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/checkins"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });

                      console.log("[AdminCheckInModal] Queries invalidated, calling onSuccess");
                      if (onSuccess) onSuccess();

                    } catch (error) {
                      console.error("[AdminCheckInModal] Error:", error);
                      toast({ title: "Error", description: getErrorMessage(error, "Gagal konfirmasi check-in"), variant: "destructive" });
                    } finally {
                      setIsConfirming(false);
                    }
                  }}
                  disabled={isConfirming}
                  className="gym-gradient"
                >
                  {isConfirming ? "Memproses..." : "Konfirmasi Check-in"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleClose} data-testid="button-close">
                Tutup
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Popup */}
      <CheckInNotificationPopup
        show={showNotification}
        data={notificationData ?? { success: false, message: "", user: null, membership: null }}
        onClose={() => {
          setShowNotification(false);
          setNotificationData(null);
        }}
      />
    </>
  );
}
