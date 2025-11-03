import { ArrowLeft, Bell, Moon, Sun, Globe, Shield, Lock, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const settingsSections = [
    {
      title: "Tampilan",
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: "Dark Mode",
          description: "Ubah tema aplikasi",
          type: "toggle" as const,
          value: darkMode,
          onChange: setDarkMode,
          testId: "setting-dark-mode"
        },
        {
          icon: Globe,
          label: "Bahasa",
          description: "Indonesia",
          type: "link" as const,
          testId: "setting-language"
        }
      ]
    },
    {
      title: "Notifikasi",
      items: [
        {
          icon: Bell,
          label: "Notifikasi",
          description: "Aktifkan semua notifikasi",
          type: "toggle" as const,
          value: notifications,
          onChange: setNotifications,
          testId: "setting-notifications"
        },
        {
          icon: Bell,
          label: "Email Notifications",
          description: "Terima notifikasi via email",
          type: "toggle" as const,
          value: emailNotif,
          onChange: setEmailNotif,
          testId: "setting-email-notif"
        },
        {
          icon: Bell,
          label: "Push Notifications",
          description: "Terima push notification",
          type: "toggle" as const,
          value: pushNotif,
          onChange: setPushNotif,
          testId: "setting-push-notif"
        }
      ]
    },
    {
      title: "Keamanan & Privasi",
      items: [
        {
          icon: Lock,
          label: "Ubah Password",
          description: "Perbarui password akun Anda",
          type: "link" as const,
          testId: "setting-change-password"
        },
        {
          icon: Shield,
          label: "Keamanan Akun",
          description: "Two-factor authentication, dll",
          type: "link" as const,
          testId: "setting-security"
        }
      ]
    },
    {
      title: "Zona Bahaya",
      danger: true,
      items: [
        {
          icon: Trash2,
          label: "Hapus Akun",
          description: "Hapus akun Anda secara permanen",
          type: "link" as const,
          testId: "setting-delete-account",
          danger: true
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background to-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <h3 className={cn(
              "text-sm font-semibold px-2 uppercase tracking-wide",
              section.danger ? "text-destructive" : "text-muted-foreground"
            )}>
              {section.title}
            </h3>
            
            <Card className={section.danger ? "border-destructive/20" : ""}>
              <CardContent className="p-0">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.testId}>
                      <div
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        data-testid={item.testId}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={cn(
                            "p-2 rounded-lg",
                            ("danger" in item && item.danger) ? "bg-destructive/10" : "bg-primary/10"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              ("danger" in item && item.danger) ? "text-destructive" : "text-primary"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium",
                              ("danger" in item && item.danger) && "text-destructive"
                            )}>
                              {item.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        
                        {item.type === "toggle" && (
                          <Switch
                            checked={item.value}
                            onCheckedChange={item.onChange}
                          />
                        )}
                        
                        {item.type === "link" && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      {itemIndex < section.items.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tentang Aplikasi</CardTitle>
            <CardDescription>Informasi versi dan build</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Versi</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Build</span>
              <span className="text-sm font-medium">2024.11.03</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-medium">Web App</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
