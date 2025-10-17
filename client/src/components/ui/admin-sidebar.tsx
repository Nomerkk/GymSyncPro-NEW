import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  UserCog, 
  CreditCard, 
  QrCode, 
  MessageSquare,
  Calendar,
  CalendarCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ className, isOpen, onClose }: AdminSidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", color: "from-blue-500 to-cyan-500" },
    { href: "/admin/members", icon: Users, label: "Members", color: "from-purple-500 to-pink-500" },
    { href: "/admin/classes", icon: Dumbbell, label: "Classes", color: "from-orange-500 to-red-500" },
    { href: "/admin/trainers", icon: UserCog, label: "Trainers", color: "from-green-500 to-emerald-500" },
    { href: "/admin/plans", icon: CreditCard, label: "Plans", color: "from-yellow-500 to-amber-500" },
    { href: "/admin/pt-bookings", icon: Calendar, label: "PT Bookings", color: "from-indigo-500 to-blue-500" },
    { href: "/admin/class-bookings", icon: CalendarCheck, label: "Bookings", color: "from-teal-500 to-cyan-500" },
    { href: "/admin/checkins", icon: QrCode, label: "Check-ins", color: "from-pink-500 to-rose-500" },
    { href: "/admin/feedback", icon: MessageSquare, label: "Feedback", color: "from-violet-500 to-purple-500" },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-card/50 backdrop-blur-xl border-r border-border/50 transition-transform duration-300 lg:translate-x-0",
          "w-60",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Logo/Brand */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  Gym Admin
                </h2>
                <p className="text-[10px] text-muted-foreground">Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                    isActive 
                      ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20" 
                      : "hover:bg-muted/50"
                  )}
                  data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={onClose}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0",
                    isActive 
                      ? `bg-gradient-to-br ${item.color}` 
                      : "bg-muted group-hover:bg-gradient-to-br group-hover:" + item.color
                  )}>
                    <Icon className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
                    )} />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "font-medium transition-colors text-xs",
                    isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 m-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-[10px] font-semibold text-foreground">Quick Check-in</h3>
              <p className="text-[9px] text-muted-foreground">Scan QR</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
