import { useState } from "react";
import Navigation from "./navigation";
import AdminSidebar from "./admin-sidebar";
import { Button } from "./button";
import { Menu } from "lucide-react";

interface AdminLayoutProps {
  user: any;
  notificationCount?: number;
  children: React.ReactNode;
}

export default function AdminLayout({ user, notificationCount = 0, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation 
        user={user} 
        isAdmin={true}
        notificationCount={notificationCount}
      />
      
      {/* Hamburger Menu Button - Mobile & Desktop */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3.5 left-4 z-30 p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-muted transition-colors lg:hidden"
        data-testid="button-toggle-sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Desktop Hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden lg:block fixed top-3.5 left-4 z-30 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border shadow-md hover:bg-muted transition-colors"
        data-testid="button-toggle-sidebar-desktop"
      >
        <Menu size={18} />
      </button>
      
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-3 md:p-4 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
