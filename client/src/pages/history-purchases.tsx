import { Card } from "@/components/ui/card";
import { ArrowLeft, Receipt } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function HistoryPurchases() {
    const [, navigate] = useLocation();

    return (
        <div className="min-h-screen bg-background pb-20 font-sans">
            {/* Header */}
            <header className="bg-gradient-to-br from-primary/15 via-neon-purple/10 to-background border-b border-border sticky top-0 z-10 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/my-profile")} className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Riwayat Pembelian</h1>
                </div>
            </header>

            <main className="px-4 py-6">
                <Card className="p-8 flex flex-col items-center justify-center text-center border-dashed">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Belum ada riwayat pembelian</h3>
                    <p className="text-sm text-muted-foreground">
                        Riwayat pembelian membership atau paket PT Anda akan muncul di sini.
                    </p>
                </Card>
            </main>
        </div>
    );
}
