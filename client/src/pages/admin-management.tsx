import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, UserCog, ShieldAlert, Edit, Trash2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminSchema, updateAdminSchema } from "@shared/admin-schema";
import { BranchBadge } from "@/components/ui/branch-badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Type for the form
type CreateAdminForm = z.infer<typeof createAdminSchema>;

interface AdminUser {
    id: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
    homeBranch: string | null;
    phone: string | null;
    createdAt: string;
}

export default function AdminManagementPage() {
    const { isSuperAdmin } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: admins, isLoading, refetch } = useQuery<AdminUser[]>({
        queryKey: ["/api/super-admin/admins"],
        enabled: isSuperAdmin,
    });

    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

    const form = useForm<CreateAdminForm>({
        resolver: zodResolver(editingAdmin ? updateAdminSchema : createAdminSchema),
        defaultValues: {
            username: "",
            password: "",
            firstName: "",
            lastName: "",
            homeBranch: "",
            email: "",
            phone: "",
        },
    });

    // Reset form when dialog opens/closes or mode changes
    const handleOpenDialog = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingAdmin(null);
            form.reset({
                username: "",
                password: "",
                firstName: "",
                lastName: "",
                homeBranch: "",
                email: "",
                phone: "",
            });
        }
    };

    const handleEdit = (admin: AdminUser) => {
        setEditingAdmin(admin);
        form.reset({
            username: admin.username,
            firstName: admin.firstName,
            lastName: admin.lastName,
            homeBranch: admin.homeBranch || "",
            email: admin.email || "",
            phone: admin.phone || "",
            password: "",
        });
        setIsDialogOpen(true);
    };

    const createAdminMutation = useMutation({
        mutationFn: async (data: CreateAdminForm) => {
            const res = await fetch("/api/super-admin/create-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gagal membuat admin");
            }

            return res.json();
        },
        onSuccess: async () => {
            toast({
                title: "Berhasil",
                description: "Admin baru berhasil dibuat",
            });
            setIsDialogOpen(false);
            form.reset();
            await queryClient.invalidateQueries({ queryKey: ["/api/super-admin/admins"] });
            await refetch();
        },
        onError: (error: Error) => {
            toast({
                title: "Gagal",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateAdminMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`/api/super-admin/admins/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gagal mengupdate admin");
            }

            return res.json();
        },
        onSuccess: async () => {
            toast({
                title: "Berhasil",
                description: "Data admin berhasil diperbarui",
            });
            handleOpenDialog(false);
            await queryClient.invalidateQueries({ queryKey: ["/api/super-admin/admins"] });
            await refetch();
        },
        onError: (error: Error) => {
            toast({
                title: "Gagal",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteAdminMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/super-admin/admins/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gagal menghapus admin");
            }
            return res.json();
        },
        onSuccess: async () => {
            toast({ title: "Berhasil", description: "Admin berhasil dihapus" });
            await queryClient.invalidateQueries({ queryKey: ["/api/super-admin/admins"] });
            setAdminToDelete(null); // Close dialog only on success
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
            // Keep dialog open on error so user can retry or see error
        },
    });

    const [adminToDelete, setAdminToDelete] = useState<string | null>(null);

    const handleDelete = () => {
        if (adminToDelete) {
            deleteAdminMutation.mutate(adminToDelete);
        }
    };

    const onSubmit = (data: CreateAdminForm) => {
        if (editingAdmin) {
            updateAdminMutation.mutate({ id: editingAdmin.id, data });
        } else {
            createAdminMutation.mutate(data);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <ShieldAlert className="w-16 h-16 text-destructive" />
                <h1 className="text-2xl font-bold">Akses Ditolak</h1>
                <p className="text-muted-foreground">Halaman ini hanya untuk Super Admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Admin</h1>
                    <p className="text-muted-foreground">
                        Kelola akun admin dan hak akses
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingAdmin ? "Edit Akun Admin" : "Buat Akun Admin Baru"}</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nama Depan</Label>
                                    <Input id="firstName" {...form.register("firstName")} placeholder="John" />
                                    {form.formState.errors.firstName && (
                                        <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nama Belakang</Label>
                                    <Input id="lastName" {...form.register("lastName")} placeholder="Doe" />
                                    {form.formState.errors.lastName && (
                                        <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" {...form.register("username")} placeholder="admin_john" />
                                {form.formState.errors.username && (
                                    <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password {editingAdmin && "(Kosongkan jika tidak ingin mengubah)"}</Label>
                                <Input id="password" type="password" {...form.register("password")} placeholder="******" />
                                {form.formState.errors.password && (
                                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="homeBranch">Cabang</Label>
                                <Select
                                    onValueChange={(value) => form.setValue("homeBranch", value)}
                                    defaultValue={form.getValues("homeBranch")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cikarang">Cikarang</SelectItem>
                                        <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.homeBranch && (
                                    <p className="text-xs text-destructive">{form.formState.errors.homeBranch.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email (Opsional)</Label>
                                    <Input id="email" type="email" {...form.register("email")} placeholder="john@example.com" />
                                    {form.formState.errors.email && (
                                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">No. Telepon (Opsional)</Label>
                                    <Input id="phone" {...form.register("phone")} placeholder="81234567890" />
                                    {form.formState.errors.phone && (
                                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={createAdminMutation.isPending || updateAdminMutation.isPending}>
                                    {(createAdminMutation.isPending || updateAdminMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingAdmin ? "Simpan Perubahan" : "Buat Admin"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Admin</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : admins && admins.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Cabang</TableHead>
                                    <TableHead>Dibuat Pada</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{admin.firstName} {admin.lastName}</span>
                                                <span className="text-xs text-muted-foreground">{admin.email || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{admin.username}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.role === 'super_admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <BranchBadge branch={admin.homeBranch} />
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(admin.createdAt), "dd MMM yyyy", { locale: localeId })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(admin)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {admin.role !== 'super_admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        title="Hapus"
                                                        onClick={() => setAdminToDelete(admin.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <UserCog className="mx-auto h-12 w-12 opacity-20 mb-4" />
                            <p>Belum ada admin yang terdaftar.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Akun admin ini akan dihapus secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteAdminMutation.isPending}
                        >
                            {deleteAdminMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
