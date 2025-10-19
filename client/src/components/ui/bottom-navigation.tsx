import { Home, Calendar, Bell, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import ProfileSheet from "@/components/ui/profile-sheet";
import NotificationsSheet from "@/components/ui/notifications-sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  notificationCount?: number;
}

export default function BottomNavigation({ notificationCount = 0 }: BottomNavigationProps) {
  const [location] = useLocation();
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      active: location === "/",
      testId: "bottom-nav-home",
      type: "link" as const,
    },
    {
      icon: Calendar,
      label: "Bookings",
      href: "/my-bookings",
      active: location === "/my-bookings",
      testId: "bottom-nav-bookings",
      type: "link" as const,
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "#",
      active: false,
      testId: "bottom-nav-notifications",
      type: "button" as const,
      badge: notificationCount,
    },
    {
      icon: User,
      label: "Profile",
      href: "#",
      active: showProfileSheet,
      testId: "bottom-nav-profile",
      type: "profile" as const,
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-xl border-t border-border shadow-lg z-50 pb-safe">
      <div className="grid grid-cols-4 h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          // Profile sheet
          if (item.type === "profile") {
            return (
              <ProfileSheet 
                key={item.testId}
                open={showProfileSheet} 
                onOpenChange={setShowProfileSheet}
              >
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 relative rounded-lg transition-all duration-300",
                    "hover:bg-muted/50 active:scale-95",
                    isActive && "text-primary"
                  )}
                  data-testid={item.testId}
                >
                  <div className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 border",
                    isActive ? "bg-primary/15 dark:bg-primary/10 border-primary/20" : "border-transparent"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-scale-in" />
                  )}
                </button>
              </ProfileSheet>
            );
          }
          
          // Notifications sheet
          if (item.type === "button") {
            return (
              <NotificationsSheet
                key={item.testId}
                open={showNotificationsSheet}
                onOpenChange={setShowNotificationsSheet}
              >
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 relative rounded-lg transition-all duration-300",
                    "hover:bg-muted/50 active:scale-95",
                    showNotificationsSheet && "text-primary"
                  )}
                  data-testid={item.testId}
                >
                  <div className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 border",
                    showNotificationsSheet ? "bg-primary/15 dark:bg-primary/10 border-primary/20" : "border-transparent"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      showNotificationsSheet ? "text-primary" : "text-muted-foreground"
                    )} />
                    {item.badge && item.badge > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-neon-green dark:bg-neon-green rounded-full flex items-center justify-center animate-scale-in shadow-md border border-neon-green/20">
                        <span className="text-[10px] font-bold text-white px-1">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold transition-colors duration-300",
                    showNotificationsSheet ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                  {showNotificationsSheet && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-scale-in" />
                  )}
                </button>
              </NotificationsSheet>
            );
          }
          
          // Regular links
          return (
            <Link 
              key={item.testId}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative rounded-lg transition-all duration-300",
                "hover:bg-muted/50 active:scale-95",
                isActive && "text-primary"
              )}
              data-testid={item.testId}
            >
              <div className={cn(
                "relative p-2.5 rounded-xl transition-all duration-300 border",
                isActive ? "bg-primary/15 dark:bg-primary/10 border-primary/20" : "border-transparent"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-scale-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
