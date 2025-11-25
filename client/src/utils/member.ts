/**
 * Member domain utility helpers.
 * Centralizes membership status computation and filtering logic previously duplicated
 * inside page components. Keeps UI layers (pages/components) focused on presentation.
 */
 

/** Raw member shape as received from API queries used in admin members page. */
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
    plan?: {
      name?: string;
    };
  };
}

/** Temporal thresholds and constants for status derivation. */
const EXPIRING_SOON_DAYS = 20;

/** Options for filtering members list. */
export interface FilterOptions {
  memberFilter: string; // 'all' | 'active' | 'expiring' | 'expired' | 'inactive'
  searchTerm: string;
}

/** Computes whether a membership end date is within the soon-expiring threshold. */
export function isExpiringSoon(endDate: string | undefined): boolean {
  if (!endDate) return false;
  const now = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= EXPIRING_SOON_DAYS && diffDays > 0;
}

/** Derives a human-readable membership status given a member object. */
export function computeMembershipStatus(member: MemberWithMembership): string {
  if (!member.membership) return "No Membership";
  const rawStatus = member.membership.status;
  if (rawStatus === "expired") return "Expired";
  if (member.membership.endDate && isExpiringSoon(member.membership.endDate)) return "Expiring Soon";
  if (rawStatus === "active") return "Active";
  return rawStatus || "Unknown";
}

/** Case-insensitive text matching across member searchable fields. */
function matchesSearch(member: MemberWithMembership, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  return (
    member.email?.toLowerCase().includes(term) ||
    member.username?.toLowerCase().includes(term) ||
    member.phone?.toLowerCase().includes(term) ||
    `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().includes(term)
  ) ? true : false;
}

/** Applies filter category logic to a given member. */
function matchesFilter(member: MemberWithMembership, opt: FilterOptions): boolean {
  const { memberFilter } = opt;
  if (memberFilter === "all") return true;

  if (memberFilter === "active") return member.membership?.status === "active";
  if (memberFilter === "expiring") return !!(member.membership?.endDate && isExpiringSoon(member.membership.endDate));
  if (memberFilter === "expired") return member.membership?.status === "expired";
  if (memberFilter === "inactive") return (member.daysInactive ?? 0) >= 7;
  return true;
}

/**
 * Filters a list of members by search term and filter category.
 * @param members raw members array
 * @param opts filter + search options
 */
export function filterMembers(members: MemberWithMembership[], opts: FilterOptions): MemberWithMembership[] {
  const { searchTerm } = opts;
  return members.filter(m => matchesSearch(m, searchTerm) && matchesFilter(m, opts));
}

/** Maps a computed membership status to a badge variant string. */
export function mapStatusToVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case "Active": return 'default';
    case "Expiring Soon": return 'secondary';
    case "Expired": return 'destructive';
    default: return 'outline';
  }
}

/** Convenience aggregator combining status + variant. */
export function getStatusPresentation(member: MemberWithMembership) {
  const status = computeMembershipStatus(member);
  return { status, variant: mapStatusToVariant(status) };
}
