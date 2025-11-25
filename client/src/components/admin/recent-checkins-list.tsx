import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CheckInRecord {
  id: string;
  checkInTime: string;
  status?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  membership?: {
    plan?: {
      name?: string;
    };
  };
}

export function RecentCheckinsList({
  items,
  onViewAll,
}: {
  items: CheckInRecord[] | undefined;
  onViewAll?: () => void;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Check-ins</h3>
          {onViewAll && (
            <Button variant="ghost" size="sm" data-testid="button-view-all-checkins" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {!items || items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">No recent check-ins</p>
            </div>
          ) : (
            items.slice(0, 5).map((checkin) => (
              <div
                key={checkin.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={checkin.user?.profileImageUrl} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {`${checkin.user?.firstName?.[0] || ''}${checkin.user?.lastName?.[0] || ''}`}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {checkin.user?.firstName} {checkin.user?.lastName}
                    </p>
                    <span className="text-xs rounded border px-2 py-0.5 text-muted-foreground">
                      {checkin.membership?.plan?.name || 'No Plan'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {format(new Date(checkin.checkInTime), 'HH:mm')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(checkin.checkInTime), 'dd MMM')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
