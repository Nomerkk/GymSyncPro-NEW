import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DashboardStatCard({ icon, label, value, className }: DashboardStatCardProps) {
  return (
    <Card className={cn("p-6 border-slate-200 dark:border-slate-800", className)}>
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}
