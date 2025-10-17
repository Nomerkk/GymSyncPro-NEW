import { useLocation } from "wouter";
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
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/members", icon: Users, label: "Members" },
    { href: "/admin/classes", icon: Dumbbell, label: "Classes" },
    { href: "/admin/trainers", icon: UserCog, label: "Trainers" },
    { href: "/admin/plans", icon: CreditCard, label: "Plans" },
    { href: "/admin/pt-bookings", icon: Calendar, label: "PT Bookings" },
    { href: "/admin/class-bookings", icon: CalendarCheck, label: "Bookings" },
    { href: "/admin/checkins", icon: QrCode, label: "Check-ins" },
    { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
  ];

  const handleNavClick = (href: string) => {
    window.location.href = href;
    onClose();
  };

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
          "fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col",
          "bg-white dark:bg-slate-900",
          "border-r border-slate-200 dark:border-slate-800",
          "transition-all duration-200 lg:translate-x-0",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Admin Panel
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
