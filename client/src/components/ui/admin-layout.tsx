import Navigation from "./navigation";
import AdminSidebar from "./admin-sidebar";

interface AdminLayoutProps {
  user: any;
  notificationCount?: number;
  children: React.ReactNode;
}

export default function AdminLayout({ user, notificationCount = 0, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation 
        user={user} 
        isAdmin={true}
        notificationCount={notificationCount}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
