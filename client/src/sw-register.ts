// Dev & Prod SW registration (ensures Lighthouse PWA audits run under npm run dev)
// In dev, Vite middleware serves /sw.js from client/public.
// Quietly ignore if unsupported or already registered.

declare global {
  interface Window {
    __sw_registered?: boolean;
  }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (!window.__sw_registered) {
    window.__sw_registered = true;
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[sw] registration failed', err);
      });
    }, 250);
  }
}

export {};
