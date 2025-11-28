import { useQuery } from "@tanstack/react-query";
import { httpFetch } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface CheckIn {
    id: string;
    checkInTime: string;
    checkOutTime?: string;
    status: string;
    lockerNumber?: string;
    branch?: string;
}

export default function HistoryCheckins() {
    const [, navigate] = useLocation();

    const { data: checkIns, isLoading } = useQuery<CheckIn[]>({
        queryKey: ["/api/checkins"],
        queryFn: async () => {
            const res = await httpFetch<CheckIn[]>("/api/checkins");
            return res.json || [];
        },
    });

    return (
        <div className="min-h-screen bg-background pb-20 font-sans">
            {/* Header */}
            <header className="bg-gradient-to-br from-primary/15 via-neon-purple/10 to-background border-b border-border sticky top-0 z-10 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/my-profile")} className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Riwayat Aktifitas</h1>
                </div>
            </header>

            <main className="px-4 py-6 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : (!checkIns || checkIns.length === 0) ? (
                    <Card className="p-6 text-center text-muted-foreground border-dashed">
                        <p>Belum ada riwayat check-in.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {checkIns.map((checkIn) => (
                            <Card key={checkIn.id} className="border-border bg-card overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-base mb-1">Check-in Gym</div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{format(new Date(checkIn.checkInTime), "dd MMM yyyy")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>
                                                    {format(new Date(checkIn.checkInTime), "HH:mm")}
                                                    {checkIn.checkOutTime && ` - ${format(new Date(checkIn.checkOutTime), "HH:mm")}`}
                                                </span>
                                            </div>
                                            {checkIn.branch && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span>{checkIn.branch}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`px-2.5 py-1 rounded text-[10px] font-medium ${checkIn.status === 'active'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                            }`}>
                                            {checkIn.status === 'active' ? 'Active' : 'Completed'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
