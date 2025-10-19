import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Dumbbell,
  QrCode, 
  Calendar,
  Phone,
  X,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoPath from "@assets/image_1759411904981.png";
import { Button } from "@/components/ui/button";

interface MemberSidebarProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberSidebar({ className, isOpen, onClose }: MemberSidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard", color: "bg-green-500/10 text-green-500" },
    { href: "/my-bookings", icon: Dumbbell, label: "Class", color: "bg-purple-500/10 text-purple-500" },
    { href: "/", icon: QrCode, label: "Check-In", color: "bg-yellow-500/10 text-yellow-500", action: "checkin" },
    { href: "/my-bookings", icon: Calendar, label: "Booking", color: "bg-red-500/10 text-red-500" },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string, action?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === "checkin") {
      window.dispatchEvent(new CustomEvent('open-checkin'));
    } else {
      window.location.href = href;
    }
    onClose();
  };

  const handleContactUs = () => {
    const whatsappNumber = "6281234567890";
    const message = encodeURIComponent("Halo, saya ingin bertanya tentang Idachi Fitness");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
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
          "bg-[#0a0e27] dark:bg-[#0a0e27]",
          "transition-transform duration-200",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header with Logo */}
        <div className="px-6 py-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <img 
              src={logoPath} 
              alt="Idachi Fitness Logo" 
              className="w-12 h-12 object-contain"
              data-testid="img-sidebar-logo"
            />
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-slate-800 rounded text-slate-400"
              data-testid="button-close-sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            IDACHI FITNESS JAKARTA
          </h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <button
                key={item.label}
                onClick={(e) => handleNavClick(e, item.href, item.action)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  "text-slate-300 hover:bg-slate-800/50",
                  isActive && "bg-slate-800/50"
                )}
                data-testid={`button-nav-${item.label.toLowerCase()}`}
              >
                <div className={cn("p-2 rounded-lg", item.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-4 pb-6 space-y-4">
          <div className="px-4">
            <button
              className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
              data-testid="button-help-center"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Help Center</span>
            </button>
          </div>
          
          <Button
            onClick={handleContactUs}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg"
            size="lg"
            data-testid="button-contact-us"
          >
            <Phone className="w-4 h-4 mr-2" />
            Contact Us
          </Button>
        </div>
      </aside>
    </>
  );
}
