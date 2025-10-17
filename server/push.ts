import webpush from 'web-push';
import { storage } from './storage';
import type { InsertNotification } from '@shared/schema';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@yourgym.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidMailto,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushNotificationPayload {
  title: string;
  message: string;
  url?: string;
  notificationId?: string;
  tag?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured, skipping push notification');
      return;
    }

    const subscriptions = await storage.getUserPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const notificationData = JSON.stringify(payload);

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationData
        );
        console.log(`Push notification sent to ${subscription.endpoint}`);
      } catch (error: any) {
        console.error(`Error sending push notification to ${subscription.endpoint}:`, error);
        
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Subscription expired, removing: ${subscription.endpoint}`);
          await storage.deletePushSubscription(subscription.endpoint, userId);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}

export async function sendNotificationWithPush(
  userId: string,
  notification: InsertNotification
): Promise<void> {
  try {
    const createdNotification = await storage.createNotification(notification);

    await sendPushNotification(userId, {
      title: notification.title,
      message: notification.message,
      url: '/',
      notificationId: createdNotification.id,
      tag: notification.type,
    });
  } catch (error) {
    console.error('Error in sendNotificationWithPush:', error);
  }
}
