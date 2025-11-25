import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Cookie, Shield, BarChart3, Megaphone, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  getCookiePreferences,
  setCookiePreferences,
  setConsent,
  applyAnalyticsCookies,
  applyMarketingCookies,
  removeAnalyticsCookies,
  removeMarketingCookies,
  deleteAllNonEssentialCookies,
} from '@/lib/cookies';
import { CookiePreferences } from '@shared/schema';

export default function CookieSettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<CookiePreferences>(getCookiePreferences());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const currentPrefs = getCookiePreferences();
    setPreferences(currentPrefs);
  }, []);

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedPreferences: CookiePreferences = {
      ...preferences,
      necessary: true,
      consentGiven: true,
      consentDate: new Date().toISOString(),
    };
    
    setCookiePreferences(updatedPreferences);
    setConsent(true);
    
    if (updatedPreferences.analytics) {
      applyAnalyticsCookies();
    } else {
      removeAnalyticsCookies();
    }
    
    if (updatedPreferences.marketing) {
      applyMarketingCookies();
    } else {
      removeMarketingCookies();
    }

    if (!updatedPreferences.preferences) {
      deleteAllNonEssentialCookies();
    }
    
    setHasChanges(false);
    toast({
      title: 'Preferensi Disimpan',
      description: 'Pengaturan cookie Anda telah berhasil diperbarui.',
    });
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      consentGiven: true,
      consentDate: new Date().toISOString(),
    };
    
    setPreferences(allAccepted);
    setCookiePreferences(allAccepted);
    setConsent(true);
    applyAnalyticsCookies();
    applyMarketingCookies();
    setHasChanges(false);
    
    toast({
      title: 'Semua Cookie Diterima',
      description: 'Anda telah menerima semua jenis cookie.',
    });
  };

  const handleRejectAll = () => {
    const rejected: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      consentGiven: true,
      consentDate: new Date().toISOString(),
    };
    
    setPreferences(rejected);
    setCookiePreferences(rejected);
    setConsent(true);
    deleteAllNonEssentialCookies();
    removeAnalyticsCookies();
    removeMarketingCookies();
    setHasChanges(false);
    
    toast({
      title: 'Cookie Ditolak',
      description: 'Hanya cookie penting yang akan digunakan.',
    });
  };

  const cookieTypes = [
    {
      id: 'necessary',
      key: 'necessary' as keyof CookiePreferences,
      icon: Shield,
      title: 'Cookie Penting',
      description: 'Cookie ini diperlukan untuk fungsi dasar website seperti autentikasi, keamanan, dan navigasi. Cookie ini tidak dapat dinonaktifkan karena website tidak akan berfungsi tanpanya.',
      required: true,
    },
    {
      id: 'analytics',
      key: 'analytics' as keyof CookiePreferences,
      icon: BarChart3,
      title: 'Cookie Analitik',
      description: 'Cookie ini membantu kami memahami bagaimana pengunjung berinteraksi dengan website. Kami mengumpulkan informasi anonim tentang halaman yang dikunjungi, durasi kunjungan, dan perilaku pengguna untuk meningkatkan pengalaman website.',
      required: false,
    },
    {
      id: 'marketing',
      key: 'marketing' as keyof CookiePreferences,
      icon: Megaphone,
      title: 'Cookie Pemasaran',
      description: 'Cookie ini digunakan untuk menampilkan iklan yang relevan dengan minat Anda. Cookie ini juga membantu kami mengukur efektivitas kampanye iklan kami.',
      required: false,
    },
    {
      id: 'preferences',
      key: 'preferences' as keyof CookiePreferences,
      icon: SettingsIcon,
      title: 'Cookie Preferensi',
      description: 'Cookie ini mengingat preferensi Anda seperti tema tampilan (terang/gelap), bahasa yang dipilih, dan pengaturan antarmuka lainnya untuk memberikan pengalaman yang dipersonalisasi.',
      required: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Cookie className="h-8 w-8 text-primary" data-testid="icon-cookie-settings" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Pengaturan Cookie
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400" data-testid="text-page-description">
            Kelola preferensi cookie Anda untuk mengontrol pengalaman browsing Anda
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle data-testid="text-info-title">Tentang Cookie Kami</CardTitle>
            <CardDescription data-testid="text-info-description">
              Cookie adalah file kecil yang disimpan di perangkat Anda saat Anda mengunjungi website. 
              Cookie membantu kami memberikan pengalaman yang lebih baik dengan mengingat preferensi Anda 
              dan menganalisis bagaimana Anda menggunakan website kami.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4 mb-6">
          {cookieTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card key={type.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" data-testid={`icon-${type.id}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid={`text-${type.id}-title`}>
                            {type.title}
                          </h3>
                          {type.required && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300" data-testid={`badge-${type.id}-required`}>
                              Wajib
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-${type.id}-description`}>
                          {type.description}
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      id={type.id}
                      checked={preferences[type.key] as boolean}
                      onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                      disabled={type.required}
                      data-testid={`switch-${type.id}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {preferences.consentDate && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-consent-date">
                Terakhir diperbarui: {new Date(preferences.consentDate).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator className="my-6" />

        <div className="flex flex-wrap gap-3 justify-end">
          <Button 
            onClick={handleRejectAll} 
            variant="outline"
            data-testid="button-reject-all"
          >
            Tolak Semua
          </Button>
          <Button 
            onClick={handleAcceptAll} 
            variant="outline"
            data-testid="button-accept-all"
          >
            Terima Semua
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges}
            data-testid="button-save-changes"
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}
