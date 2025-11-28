import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BranchBadgeProps {
    branch?: string | null;
    className?: string;
}

export function BranchBadge({ branch, className }: BranchBadgeProps) {
    if (!branch) return null;

    // Generate a consistent color based on branch name string
    const getBranchColor = (name: string) => {
        const colors = [
            "bg-blue-100 text-blue-800 border-blue-200",
            "bg-green-100 text-green-800 border-green-200",
            "bg-purple-100 text-purple-800 border-purple-200",
            "bg-orange-100 text-orange-800 border-orange-200",
            "bg-pink-100 text-pink-800 border-pink-200",
            "bg-indigo-100 text-indigo-800 border-indigo-200",
            "bg-teal-100 text-teal-800 border-teal-200",
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    return (
        <Badge
            variant="outline"
            className={cn("font-medium border", getBranchColor(branch), className)}
        >
            {branch}
        </Badge>
    );
}
