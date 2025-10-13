import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  hasGivenConsent,
  setConsent,
  getCookiePreferences,
  setCookiePreferences,
  applyAnalyticsCookies,
  applyMarketingCookies,
  removeAnalyticsCookies,
  removeMarketingCookies,
  deleteAllNonEssentialCookies,
} from '@/lib/cookies';
import { CookiePreferences } from '@shared/schema';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(getCookiePreferences());

  useEffect(() => {
    const consentGiven = hasGivenConsent();
    if (!consentGiven) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      consentGiven: true,
      consentDate: new Date().toISOString(),
    };
    
    setCookiePreferences(allAccepted);
    setConsent(true);
    applyAnalyticsCookies();
    applyMarketingCookies();
    setShowBanner(false);
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
    
    setCookiePreferences(rejected);
    setConsent(true);
    deleteAllNonEssentialCookies();
    removeAnalyticsCookies();
    removeMarketingCookies();
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
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
    
    setShowSettings(false);
    setShowBanner(false);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
        <Card className="max-w-6xl mx-auto pointer-events-auto bg-white dark:bg-gray-900 shadow-2xl border-2 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie className="h-8 w-8 text-primary" data-testid="icon-cookie" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white" data-testid="text-cookie-title">
                  Kami Menggunakan Cookie
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4" data-testid="text-cookie-description">
                  Kami menggunakan cookie untuk meningkatkan pengalaman Anda, menganalisis lalu lintas situs, 
                  dan memberikan konten yang dipersonalisasi. Dengan mengklik "Terima Semua", Anda menyetujui 
                  penggunaan cookie kami.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleAcceptAll} 
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-accept-all-cookies"
                  >
                    Terima Semua
                  </Button>
                  
                  <Button 
                    onClick={handleRejectAll} 
                    variant="outline"
                    data-testid="button-reject-all-cookies"
                  >
                    Tolak Semua
                  </Button>
                  
                  <Button 
                    onClick={() => setShowSettings(true)} 
                    variant="ghost"
                    className="gap-2"
                    data-testid="button-customize-cookies"
                  >
                    <Settings className="h-4 w-4" />
                    Sesuaikan
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleRejectAll}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
                data-testid="button-close-banner"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl" data-testid="dialog-cookie-settings">
          <DialogHeader>
            <DialogTitle data-testid="text-settings-title">Pengaturan Cookie</DialogTitle>
            <DialogDescription data-testid="text-settings-description">
              Kelola preferensi cookie Anda. Cookie yang diperlukan selalu aktif karena diperlukan untuk fungsi dasar website.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="necessary" className="text-base font-medium" data-testid="label-necessary">
                  Cookie Penting
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-necessary-description">
                  Cookie ini diperlukan untuk fungsi dasar website dan tidak dapat dinonaktifkan.
                </p>
              </div>
              <Switch
                id="necessary"
                checked={true}
                disabled
                data-testid="switch-necessary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analytics" className="text-base font-medium" data-testid="label-analytics">
                  Cookie Analitik
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-analytics-description">
                  Membantu kami memahami bagaimana pengunjung berinteraksi dengan website.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                data-testid="switch-analytics"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="marketing" className="text-base font-medium" data-testid="label-marketing">
                  Cookie Pemasaran
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-marketing-description">
                  Digunakan untuk menampilkan iklan yang relevan dengan minat Anda.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                data-testid="switch-marketing"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="preferences" className="text-base font-medium" data-testid="label-preferences">
                  Cookie Preferensi
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-preferences-description">
                  Mengingat preferensi Anda seperti tema dan bahasa.
                </p>
              </div>
              <Switch
                id="preferences"
                checked={preferences.preferences}
                onCheckedChange={(checked) => handlePreferenceChange('preferences', checked)}
                data-testid="switch-preferences"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              onClick={() => setShowSettings(false)} 
              variant="outline"
              data-testid="button-cancel-settings"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSavePreferences}
              data-testid="button-save-preferences"
            >
              Simpan Preferensi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
