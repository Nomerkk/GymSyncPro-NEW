import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import idachi1 from "@assets/idachi1.png";
import type { User } from "@shared/schema";

interface QRPayload {
    qrCode: string;
    membership?: {
        endDate?: string | Date;
        plan?: { name?: string } | null;
    } | null;
}

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrData: QRPayload | null;
    user: User | null;
}

export default function QRModal({ isOpen, onClose, qrData, user }: QRModalProps) {
    if (!qrData) return null;

    const planName = qrData.membership?.plan?.name || "Membership";
    const endDate = qrData.membership?.endDate
        ? new Date(qrData.membership.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : "-";

    const memberName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || "Member"
        : "Member";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-[#0a101f] border-none text-white p-0 overflow-hidden gap-0 [&>button]:hidden">
                <div className="p-6 space-y-6">
                    {/* Membership Card - Simple Layout */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 border border-amber-500/20 aspect-[1.6/1]">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl"></div>

                        {/* Idachi Logo Watermark - Top Right */}
                        <div className="absolute -top-1 -right-1 w-40 h-40 opacity-50">
                            <img src={idachi1} alt="" className="w-full h-full object-contain" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 mb-8">
                            <h3 className="text-base font-bold text-white">All Club Membership</h3>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 space-y-6">
                            {/* Member Name */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nama Member</p>
                                <p className="text-xl font-bold text-white">{memberName}</p>
                            </div>

                            {/* Info Row */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Paket Membership</p>
                                    <p className="text-base font-bold text-white">{planName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Berlaku Sampai</p>
                                    <p className="text-base font-bold text-white">{endDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                    </div>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center space-y-4 bg-slate-900 rounded-2xl p-6 border border-slate-800">
                        <div className="p-4 bg-white rounded-2xl shadow-2xl">
                            <QRCodeSVG
                                value={qrData.qrCode}
                                size={200}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-sm text-gray-400 text-center max-w-[280px]">
                            Tunjukkan & scan kode QR ini di Club manapun untuk menggunakan fasilitas.
                        </p>
                    </div>

                    {/* Close Button */}
                    <div className="text-center">
                        <Button
                            onClick={onClose}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 h-12 rounded-xl font-semibold transition-all"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
