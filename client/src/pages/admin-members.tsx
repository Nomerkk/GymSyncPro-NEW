import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query"; // retained for dashboard stats; member list now via useMembers hook
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/ui/admin-layout";
import PageHeader from "@/components/layout/page-header";
import AdminMemberDialog from "@/components/admin-member-dialog";
import AdminEditMemberDialog from "@/components/admin-edit-member-dialog";
import AdminWhatsappDialog from "@/components/admin-whatsapp-dialog";
import AdminEmailDialog from "@/components/admin-email-dialog";
import { UserPlus, Activity } from "lucide-react";
import { filterMembers, type MemberWithMembership } from "@/utils/member";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import MembersFilterBar from "@/components/admin/members-filter-bar";
import MemberRowActions from "@/components/admin/member-row-actions";
import { useMembers, useMemberActions } from "@/hooks/useMembers";
import MemberDetailSheet from "@/components/admin-member-detail-sheet";
import { format } from "date-fns";
import { getErrorMessage } from "@/lib/errors";

// MemberWithMembership type now sourced from centralized domain utils.
interface AdminDashboardData {
  stats?: {
    expiringSoon?: number;
  };
}

// getErrorMessage centralized in @/lib/errors

export default function AdminMembers() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [memberFilter, setMemberFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithMembership | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: dashboardData } = useQuery<AdminDashboardData>({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: members } = useMembers(isAuthenticated && user?.role === 'admin');

  // Replace individual mutations with unified memberActions hook.
  const { suspend: suspendMutation, activate: activateMutation, remove: deleteMutation } = useMemberActions();

  // Attach toast side-effects to unified mutations.
  useEffect(() => {
    if (suspendMutation.isSuccess) {
      toast({ title: "Success!", description: "Member has been suspended" });
    }
    if (activateMutation.isSuccess) {
      toast({ title: "Success!", description: "Member has been activated" });
    }
    if (deleteMutation.isSuccess) {
      toast({ title: "Success!", description: "Member has been deleted" });
    }
  }, [suspendMutation.isSuccess, activateMutation.isSuccess, deleteMutation.isSuccess, toast]);

  useEffect(() => {
    if (suspendMutation.error) {
      toast({ title: "Error", description: getErrorMessage(suspendMutation.error, "Failed to suspend member"), variant: "destructive" });
    }
  }, [suspendMutation.error, toast]);
  useEffect(() => {
    if (activateMutation.error) {
      toast({ title: "Error", description: getErrorMessage(activateMutation.error, "Failed to activate member"), variant: "destructive" });
    }
  }, [activateMutation.error, toast]);
  useEffect(() => {
    if (deleteMutation.error) {
      toast({ title: "Error", description: getErrorMessage(deleteMutation.error, "Failed to delete member"), variant: "destructive" });
    }
  }, [deleteMutation.error, toast]);

  // Do not block rendering with a loading spinner; rely on cached data.

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = dashboardData?.stats || {};

  // Memoized filtering to avoid recalculations on unrelated state changes.
  const filteredMembers = useMemo(() => filterMembers(members || [], { searchTerm, memberFilter }), [members, searchTerm, memberFilter]);

  const handleDetail = useCallback((member: MemberWithMembership) => {
    setSelectedMember(member);
    setShowDetail(true);
  }, []);

  return (
    <AdminLayout user={user} notificationCount={stats.expiringSoon || 0}>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Members"
          subtitle="Manage gym member accounts"
          actions={
            <Button 
              className="gym-gradient text-white" 
              onClick={() => setShowMemberDialog(true)}
              data-testid="button-add-member"
            >
              <UserPlus className="mr-2" size={16} />
              Add New Member
            </Button>
          }
        />

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <MembersFilterBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              memberFilter={memberFilter}
              onMemberFilterChange={setMemberFilter}
            />
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<MemberWithMembership>
              data={filteredMembers}
              getRowKey={(row) => row.id}
              columns={[
                {
                  id: 'member',
                  header: 'Member',
                  cell: (member) => (
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profileImageUrl} />
                        <AvatarFallback>
                          {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}` || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'No Name'}
                          </p>
                          {member.active === false && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Cuti
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'membership',
                  header: 'Membership',
                  cell: (m) => <span className="text-sm text-foreground">{m.membership?.plan?.name || 'No Plan'}</span>,
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (m) => <StatusBadge member={m} />,
                },
                {
                  id: 'lastCheckin',
                  header: 'Last Check-in',
                  cell: (m) => (
                    m.lastCheckIn ? (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Activity size={14} className="text-green-600" />
                        {format(new Date(m.lastCheckIn), 'dd MMM yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )
                  ),
                },
                {
                  id: 'inactive',
                  header: 'Inactive Days',
                  cell: (m) => (
                    m.daysInactive !== null && m.daysInactive !== undefined ? (
                      <Badge 
                        variant={m.daysInactive >= 7 ? "destructive" : m.daysInactive >= 3 ? "secondary" : "default"}
                      >
                        {m.daysInactive} {m.daysInactive === 1 ? 'day' : 'days'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )
                  ),
                },
                {
                  id: 'detail',
                  header: <span className="sr-only">Actions</span>,
                  cell: (member) => (
                    <MemberRowActions member={member} onDetail={handleDetail} />
                  ),
                  className: "text-right",
                },
              ] as ColumnDef<MemberWithMembership>[]}
              empty={<p className="text-center text-muted-foreground py-12">No members found</p>}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <AdminMemberDialog
        open={showMemberDialog}
        onOpenChange={setShowMemberDialog}
      />

      {/* Edit Member Dialog */}
      <AdminEditMemberDialog
        open={showEditMemberDialog}
        onOpenChange={setShowEditMemberDialog}
        member={selectedMember}
      />

      {/* WhatsApp Dialog */}
      <AdminWhatsappDialog
        open={showWhatsappDialog}
        onOpenChange={setShowWhatsappDialog}
        member={selectedMember}
      />

      {/* Email Dialog */}
      <AdminEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        member={selectedMember}
      />

      {/* Member Detail Sheet */}
      <MemberDetailSheet open={showDetail} onOpenChange={setShowDetail} member={selectedMember} />
    </AdminLayout>
  );
}
