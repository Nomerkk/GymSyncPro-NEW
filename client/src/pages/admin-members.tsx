import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query"; // retained for dashboard stats; member list now via useMembers hook
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { BranchBadge } from "@/components/ui/branch-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// MemberWithMembership type now sourced from centralized domain utils.
interface AdminDashboardData {
  stats?: {
    expiringSoon?: number;
  };
}

// getErrorMessage centralized in @/lib/errors

export default function AdminMembers() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [memberFilter, setMemberFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithMembership | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
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
    enabled: isAuthenticated && isAdmin,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Debounce search term to prevent excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: membersData, refetch } = useMembers(
    isAuthenticated && isAdmin,
    page,
    limit,
    debouncedSearch,
    branchFilter !== "all" ? branchFilter : undefined
  );
  const members = membersData?.data || [];
  const totalMembers = membersData?.total || 0;
  const totalPages = Math.ceil(totalMembers / limit);

  // Replace individual mutations with unified memberActions hook.
  const { suspend: suspendMutation, activate: activateMutation, remove: deleteMutation } = useMemberActions();

  // Attach toast side-effects to unified mutations.
  useEffect(() => {
    if (suspendMutation.isSuccess) {
      toast({ title: "Success!", description: "Member has been suspended" });
      refetch();
    }
    if (activateMutation.isSuccess) {
      toast({ title: "Success!", description: "Member has been activated" });
      refetch();
    }
    if (deleteMutation.isSuccess) {
      toast({ title: "Success!", description: "Member has been deleted" });
      refetch();
    }
  }, [suspendMutation.isSuccess, activateMutation.isSuccess, deleteMutation.isSuccess, toast, refetch]);

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

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  // Client-side filtering for status/plan if needed, but search is now server-side
  // We can still use filterMembers for non-search filters if we want, or move them to server too.
  // For now, let's keep status filtering client-side on the current page, or ideally move it to server.
  // Given the requirement for speed, client-side filtering on a small page (10 items) is fast.
  const filteredMembers = useMemo(() => {
    // We only filter by status/plan here since search is handled by server
    return filterMembers(members, { searchTerm: "", memberFilter });
  }, [members, memberFilter]);

  const handleDetail = useCallback((member: MemberWithMembership) => {
    setSelectedMember(member);
    setShowDetail(true);
  }, []);

  return (
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
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <MembersFilterBar
              memberFilter={memberFilter}
              onMemberFilterChange={setMemberFilter}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
            />

            {isSuperAdmin && (
              <div className="w-full md:w-48">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="Cikarang">Cikarang</SelectItem>
                    <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                    <SelectItem value="Bandung">Bandung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members ({totalMembers})</CardTitle>
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
                accessorKey: "homeBranch",
                header: "Branch",
                cell: (row: any) => <BranchBadge branch={row.homeBranch} />,
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

          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AdminMemberDialog
        open={showMemberDialog}
        onOpenChange={setShowMemberDialog}
        onSuccess={() => refetch()}
      />

      {/* Edit Member Dialog */}
      <AdminEditMemberDialog
        open={showEditMemberDialog}
        onOpenChange={setShowEditMemberDialog}
        member={selectedMember}
        onSuccess={() => refetch()}
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
    </div>
  );
}
