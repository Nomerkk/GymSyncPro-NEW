import { useState } from "react";
import Navigation from "./navigation";
import AdminSidebar from "./admin-sidebar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  user: any;
  notificationCount?: number;
  children: React.ReactNode;
}

export default function AdminLayout({ user, notificationCount = 0, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation 
        user={user} 
        isAdmin={true}
        notificationCount={notificationCount}
      />
      
      {/* Enhanced Hamburger Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-5 left-5 z-50 group",
          "w-11 h-11 rounded-xl",
          "bg-gradient-to-br from-blue-500 to-purple-600",
          "hover:from-blue-600 hover:to-purple-700",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "flex items-center justify-center",
          "border-2 border-white/20",
          sidebarOpen && "rotate-90"
        )}
        data-testid="button-toggle-sidebar"
      >
        <div className="relative w-5 h-4 flex flex-col justify-between">
          <span className={cn(
            "w-full h-0.5 bg-white rounded-full transition-all duration-300 origin-left",
            sidebarOpen && "rotate-45 translate-x-0.5"
          )} />
          <span className={cn(
            "w-full h-0.5 bg-white rounded-full transition-all duration-300",
            sidebarOpen && "opacity-0 scale-0"
          )} />
          <span className={cn(
            "w-full h-0.5 bg-white rounded-full transition-all duration-300 origin-left",
            sidebarOpen && "-rotate-45 translate-x-0.5"
          )} />
        </div>
      </button>
      
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8 lg:p-10 max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
