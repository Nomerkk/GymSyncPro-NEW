import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminMembersActions } from "@/hooks/useAdminMembersActions";
import { Activity, Mail, MessageCircle, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import AdminEditMemberDialog from "./admin-edit-member-dialog";
import AdminWhatsappDialog from "./admin-whatsapp-dialog";
import AdminEmailDialog from "./admin-email-dialog";

export interface MemberWithMembership {
  id: string;
  email?: string;
  username?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  active?: boolean;
  lastCheckIn?: string | null;
  daysInactive?: number | null;
  membership?: {
    status?: string;
    endDate?: string;
    plan?: { name?: string };
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberWithMembership | null;
};

export default function AdminMemberDetailSheet({ open, onOpenChange, member }: Props) {
  const { suspendMember, activateMember, deleteMember } = useAdminMembersActions();
  const [showEdit, setShowEdit] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowEdit(false);
      setShowWa(false);
      setShowEmail(false);
    }
  }, [open]);

  const name = useMemo(() => (member ? `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.username || "Member" : "Member"), [member]);

  const handleSuspend = () => {
    if (!member) return;
    suspendMember.mutate(member.id, { onSuccess: () => onOpenChange(false) });
  };
  const handleActivate = () => {
    if (!member) return;
    activateMember.mutate(member.id, { onSuccess: () => onOpenChange(false) });
  };
  const handleDelete = () => {
    if (!member) return;
    if (confirm('Delete this member?')) {
      deleteMember.mutate(member.id, { onSuccess: () => onOpenChange(false) });
    }
  };

  const statusBadge = () => {
    const status = member?.membership?.status === "active" ? "Active" : member?.membership?.status === "expired" ? "Expired" : (member?.membership?.status || "Unknown");
    let variant: BadgeProps["variant"] = "outline";
    if (status === "Active") variant = "default"; else if (status === "Expired") variant = "destructive";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>Member Detail</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          {/* Header profile */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={member?.profileImageUrl} />
              <AvatarFallback>{(member?.firstName?.[0] || '') + (member?.lastName?.[0] || '') || 'M'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">{name}</div>
                {statusBadge()}
              </div>
              <div className="text-sm text-muted-foreground">{member?.email || '-'}</div>
              <div className="text-sm text-muted-foreground">{member?.phone || '-'}</div>
            </div>
          </div>

          {/* Membership & Activity */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Membership</div>
              <div className="font-medium">{member?.membership?.plan?.name || 'No Plan'}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Last Check-in</div>
              <div className="font-medium flex items-center gap-2">
                {member?.lastCheckIn ? <><Activity size={14} className="text-green-600" />{format(new Date(member!.lastCheckIn!), 'dd MMM yyyy')}</> : 'Never'}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Inactive Days</div>
              <div className="font-medium">{member?.daysInactive ?? '-'}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Username</div>
              <div className="font-medium">{member?.username || '-'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil className="mr-2 h-4 w-4"/>Edit Member</Button>
              <Button variant="outline" disabled={!member?.phone} onClick={() => setShowWa(true)}><MessageCircle className="mr-2 h-4 w-4 text-green-600"/>WhatsApp</Button>
              <Button variant="outline" disabled={!member?.email} onClick={() => setShowEmail(true)}><Mail className="mr-2 h-4 w-4 text-blue-600"/>Email</Button>
              {member?.active === false ? (
                <Button variant="outline" onClick={handleActivate} disabled={activateMember.isPending}><UserCheck className="mr-2 h-4 w-4 text-green-600"/>{activateMember.isPending ? 'Mengaktifkan...' : 'Aktifkan Kembali'}</Button>
              ) : (
                <Button variant="outline" onClick={handleSuspend} disabled={suspendMember.isPending}><UserX className="mr-2 h-4 w-4 text-orange-600"/>{suspendMember.isPending ? 'Memproses...' : 'Cuti'}</Button>
              )}
              <Button
                variant="destructive"
                disabled={member?.membership?.status === 'active' || deleteMember.isPending}
                title={member?.membership?.status === 'active' ? 'Tidak bisa hapus saat membership masih aktif' : undefined}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4"/>{deleteMember.isPending ? 'Menghapus...' : 'Delete'}
              </Button>
            </div>
            {member?.membership?.status === 'active' && (
              <p className="text-xs text-muted-foreground">Tidak dapat menghapus member selama membership masih aktif. Nonaktifkan/akhiri membership terlebih dahulu.</p>
            )}
            {member?.active === false && (
              <p className="text-xs text-muted-foreground">Status akun: Cuti — member tidak dapat check-in sampai diaktifkan kembali.</p>
            )}
          </div>
        </div>

        {/* Nested dialogs */}
        <AdminEditMemberDialog open={showEdit} onOpenChange={setShowEdit} member={member} />
        <AdminWhatsappDialog open={showWa} onOpenChange={setShowWa} member={member} />
        <AdminEmailDialog open={showEmail} onOpenChange={setShowEmail} member={member} />
      </SheetContent>
    </Sheet>
  );
}
