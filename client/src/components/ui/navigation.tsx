import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Bell, ShieldQuestion, LogOut } from "lucide-react";

interface NavigationProps {
  user: any;
  isAdmin?: boolean;
  notificationCount?: number;
}

export default function Navigation({ user, isAdmin = false, notificationCount = 0 }: NavigationProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isAdmin ? 'bg-gradient-to-r from-red-500 to-red-600' : 'gym-gradient'
            }`}>
              {isAdmin ? (
                <ShieldQuestion className="text-white" size={20} />
              ) : (
                <Dumbbell className="text-white" size={20} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                FitZone {isAdmin && "Admin"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Management Portal" : "Member Portal"}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <Button variant="ghost" size="sm" data-testid="button-notifications">
                <Bell size={18} className="text-muted-foreground" />
                {notificationCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs h-5 w-5 flex items-center justify-center p-0"
                    data-testid="badge-notification-count"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground" data-testid="text-username">
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "Administrator" : "Member"}
                </p>
              </div>
              
              <Avatar className="h-10 w-10" data-testid="img-avatar">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>
                  {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U'}
                </AvatarFallback>
              </Avatar>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
