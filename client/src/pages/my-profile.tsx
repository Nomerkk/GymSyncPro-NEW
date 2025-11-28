import { Bell, ChevronRight, FileText, HelpCircle, LogOut, Settings, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/types/adminDialogs";
import { useState } from "react";

export default function MyProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuthActions();
  const logoutMutation = logout;

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      icon: User,
      label: "My Profile",
      onClick: () => { }, // Placeholder for now
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => { }, // Placeholder
    },
    {
      icon: FileText,
      label: "Terms & Conditions",
      onClick: () => { }, // Placeholder
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => navigate("/feedback"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pb-20 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0b1121]/95 backdrop-blur-xl pt-2">
        <div className="text-center py-2">
          <h2 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">IDACHI FITNESS JAKARTA</h2>
        </div>
        <div className="flex items-center justify-between px-6 pb-4">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 -mr-2"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Profile Card */}
        <Card className="border-0 bg-[#151f32] shadow-lg rounded-2xl overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-0 bg-[#10B981]">
                <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-[#10B981] text-[#0F172A] font-bold text-xl">
                  {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'RG'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
                </h2>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                <p className="text-xs font-bold text-[#10B981] mt-1.5">Member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card className="border-0 bg-[#151f32] shadow-lg rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-white mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white">Push Notifications</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Terima notifikasi langsung di perangkat Anda untuk update penting
                </p>

                <div className="flex items-center justify-between mt-5">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {notificationsEnabled ? "Aktif" : "Nonaktif"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Aktifkan untuk menerima notifikasi penting
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                    className="data-[state=checked]:bg-[#10B981] data-[state=unchecked]:bg-[#2a3850]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 px-1">History</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/history/purchases")}
              className="w-full flex items-center justify-between p-0 group"
            >
              <div className="flex items-center gap-4 bg-[#151f32] flex-1 p-4 rounded-l-2xl rounded-r-2xl">
                <div className="p-2 bg-[#0b1121] rounded-lg text-gray-400 group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm text-white">Riwayat Pembelian Aplikasi</span>
              </div>
              <div className="pl-4 pr-2">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </div>
            </button>

            <button
              onClick={() => navigate("/history/checkins")}
              className="w-full flex items-center justify-between p-0 group"
            >
              <div className="flex items-center gap-4 bg-[#151f32] flex-1 p-4 rounded-l-2xl rounded-r-2xl">
                <div className="p-2 bg-[#0b1121] rounded-lg text-gray-400 group-hover:text-white transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm text-white">Riwayat Aktifitas</span>
              </div>
              <div className="pl-4 pr-2">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </div>
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 px-1">Feedback</h3>
          <div className="space-y-3">


            <button
              onClick={() => navigate("/feedback?openCreate=true")}
              className="w-full flex items-center justify-between p-0 group"
            >
              <div className="flex items-center gap-4 bg-[#151f32] flex-1 p-4 rounded-l-2xl rounded-r-2xl">
                <div className="p-2 bg-[#0b1121] rounded-lg text-gray-400 group-hover:text-white transition-colors">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm text-white">Open Ticket Feedback</span>
              </div>
              <div className="pl-4 pr-2">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </div>
            </button>
          </div>
        </div>

        {/* Other Menu Items */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 px-1">Account</h3>
          <div className="space-y-3">
            {menuItems.filter(item => item.label !== "Help & Support").map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-0 group"
                >
                  <div className="flex items-center gap-4 bg-[#151f32] flex-1 p-4 rounded-l-2xl rounded-r-2xl">
                    <div className="p-2 bg-[#0b1121] rounded-lg text-gray-400 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm text-white">{item.label}</span>
                  </div>
                  <div className="pl-4 pr-2">
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <Button
            variant="ghost"
            className="w-full h-12 font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => logoutMutation.mutate(undefined, {
              onSuccess: () => {
                toast({ title: "Logout berhasil" });
                navigate("/login");
              },
              onError: (error: unknown) => {
                toast({ title: "Logout gagal", description: getErrorMessage(error, "Silakan coba lagi"), variant: "destructive" });
              }
            })}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            {logoutMutation.isPending ? (
              <span>Keluar…</span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Logout
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
