import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Search, Filter } from "lucide-react";
import { BranchBadge } from "@/components/ui/branch-badge";

interface AuditLog {
    id: string;
    action: string;
    entityId?: string;
    entityType?: string;
    details?: any;
    ipAddress?: string;
    branch?: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

export default function AdminAuditLogs() {
    const { isSuperAdmin } = useAuth();
    const [search, setSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState<string>("all");

    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ["/api/admin/audit-logs", branchFilter, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (branchFilter && branchFilter !== "all") params.append("branch", branchFilter);
            if (search) params.append("search", search);
            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch logs");
            return res.json();
        },
        enabled: isSuperAdmin,
    });

    if (!isSuperAdmin) {
        return (
            <div className="p-6">
                <Card className="p-6">
                    <p className="text-center text-muted-foreground">
                        Akses ditolak. Halaman ini hanya untuk Super Admin.
                    </p>
                </Card>
            </div>
        );
    }

    const formatAuditDetails = (log: AuditLog) => {
        const { action, details, entityType } = log;
        if (!details) return "-";

        try {
            switch (action) {
                case "ADMIN_CREATE_MEMBER":
                    return `Mendaftarkan member baru: ${details.firstName} ${details.lastName} (${details.email})`;
                case "ADMIN_UPDATE_MEMBER":
                    return `Mengupdate data member. Field yang diubah: ${details.updatedFields?.join(", ") || "-"}`;
                case "ADMIN_DELETE_MEMBER":
                    return `Menghapus member dengan ID: ${details.memberId}`;
                case "ADMIN_SUSPEND_MEMBER":
                    return `Menonaktifkan (suspend) member`;
                case "ADMIN_ACTIVATE_MEMBER":
                    return `Mengaktifkan kembali member`;

                case "MEMBERSHIP_ASSIGN":
                    return `Memberikan membership ${details.planName} (${details.durationMonths} bulan) kepada ${details.memberName}`;

                case "ADMIN_CREATE_PLAN":
                    return `Membuat paket membership baru: ${details.planName} (Rp ${parseInt(details.price).toLocaleString('id-ID')})`;
                case "ADMIN_UPDATE_PLAN":
                    return `Mengupdate paket membership. Field yang diubah: ${details.updatedFields?.join(", ") || "-"}`;
                case "ADMIN_DELETE_PLAN":
                    return `Menghapus paket membership`;

                case "ADMIN_CREATE_CLASS":
                    return `Membuat kelas baru: ${details.className} oleh ${details.instructor} di ${details.branch}`;
                case "ADMIN_UPDATE_CLASS":
                    return `Mengupdate data kelas. Field yang diubah: ${details.updatedFields?.join(", ") || "-"}`;
                case "ADMIN_DELETE_CLASS":
                    return `Menghapus kelas`;

                case "ADMIN_UPDATE_BOOKING":
                    return `Mengubah status booking kelas menjadi: ${details.status}`;
                case "ADMIN_CANCEL_BOOKING":
                    return `Membatalkan booking kelas`;

                case "ADMIN_CREATE_TRAINER":
                    return `Mendaftarkan Personal Trainer baru: ${details.name} (${details.specialization})`;
                case "ADMIN_UPDATE_TRAINER":
                    return `Mengupdate data PT. Field yang diubah: ${details.updatedFields?.join(", ") || "-"}`;
                case "ADMIN_DELETE_TRAINER":
                    return `Menghapus data Personal Trainer`;

                case "ADMIN_UPDATE_PT_BOOKING":
                    return `Mengubah status sesi PT menjadi: ${details.status}`;

                case "ADMIN_UPDATE_FEEDBACK":
                    return `Mengubah status feedback menjadi: ${details.status}`;

                default:
                    // Fallback for unknown actions, try to make it readable
                    if (Object.keys(details).length > 0) {
                        return Object.entries(details)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ");
                    }
                    return "-";
            }
        } catch (e) {
            return JSON.stringify(details);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Audit Logs</h1>
                    <p className="text-muted-foreground">Riwayat aktivitas admin di seluruh cabang</p>
                </div>
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari berdasarkan aksi, nama admin, atau detail..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="w-full md:w-[200px]">
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger>
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                                <SelectItem value="Cikarang">Cikarang</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">Loading audit logs...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-4">Waktu</th>
                                    <th className="text-left p-4">Cabang</th>
                                    <th className="text-left p-4">Admin</th>
                                    <th className="text-left p-4">Aksi</th>
                                    <th className="text-left p-4">Detail Aktivitas</th>
                                    <th className="text-left p-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                                            Tidak ada log aktivitas yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    logs?.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-muted/50">
                                            <td className="p-4 text-sm whitespace-nowrap">
                                                {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                                            </td>
                                            <td className="p-4">
                                                <BranchBadge branch={log.branch} />
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{log.user.email}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm max-w-md">
                                                <div className="space-y-1">
                                                    {log.entityType && (
                                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            {log.entityType.replace('_', ' ')}
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-foreground">
                                                        {formatAuditDetails(log)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {log.ipAddress || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
