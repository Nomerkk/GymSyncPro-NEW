import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface MembersFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  memberFilter: string; // 'all' | 'active' | 'expiring' | 'expired' | 'inactive'
  onMemberFilterChange: (value: string) => void;
}

export function MembersFilterBar({ searchTerm, onSearchTermChange, memberFilter, onMemberFilterChange }: MembersFilterBarProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search members by name, email, username, or phone..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
          data-testid="input-search-members"
        />
      </div>
      <Select value={memberFilter} onValueChange={onMemberFilterChange}>
        <SelectTrigger className="w-48" data-testid="select-filter-members">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="expiring">Expiring Soon</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="inactive">Inactive (7+ days)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default MembersFilterBar;
