import { apiRequest } from './queryClient';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak didukung browser ini');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker berhasil didaftarkan');
    return registration;
  } catch (error) {
    console.error('Gagal mendaftarkan Service Worker:', error);
    return null;
  }
};

export const subscribeToPushNotifications = async (): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notifikasi permission ditolak');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const response = await fetch('/api/push/public-key');
    const { publicKey } = await response.json();
    
    if (!publicKey) {
      throw new Error('VAPID public key tidak tersedia');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');
    
    await apiRequest('POST', '/api/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh!)))),
        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth!)))),
      },
    });

    console.log('Push subscription berhasil');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return false;
    }

    await apiRequest('DELETE', '/api/push/unsubscribe', {
      endpoint: subscription.endpoint,
    });

    await subscription.unsubscribe();
    
    console.log('Push subscription dibatalkan');
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

export const checkPushSubscription = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription !== null;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
};
