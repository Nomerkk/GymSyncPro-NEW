import { useState } from "react";
import Navigation from "./navigation";
import AdminSidebar from "./admin-sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  user: any;
  notificationCount?: number;
  children: React.ReactNode;
}

export default function AdminLayout({ user, notificationCount = 0, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation 
        user={user} 
        isAdmin={true}
        notificationCount={notificationCount}
      />
      
      {/* Simple Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-5 left-5 z-50",
          "w-10 h-10 rounded-lg",
          "bg-blue-600 hover:bg-blue-700",
          "shadow-md hover:shadow-lg",
          "transition-all duration-200",
          "flex items-center justify-center"
        )}
        data-testid="button-toggle-sidebar"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>
      
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
