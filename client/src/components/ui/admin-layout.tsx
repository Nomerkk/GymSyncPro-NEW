import { useState } from "react";
import AdminSidebar from "./admin-sidebar";
import BottomNavigation from "./bottom-navigation";
import { Button } from "@/components/ui/button";
import { Menu, Bell, LogOut } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminLayoutProps {
  user?: any;
  notificationCount?: number;
  children: React.ReactNode;
}

export default function AdminLayout({ user, notificationCount = 0, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.clear();
      window.location.href = "/login-admin";
    } catch (error) {
      console.error("Logout error:", error);
      queryClient.clear();
      window.location.href = "/login-admin";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              data-testid="button-toggle-sidebar"
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Idachi Fitness Management
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="p-4 sm:p-6 max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        <div className="md:hidden">
          <BottomNavigation notificationCount={notificationCount} />
        </div>
      </div>
    </div>
  );
}
