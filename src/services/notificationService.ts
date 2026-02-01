// SUNSET: Push Notifcations Logic Removed.
// See push_notifications_sunset.md for backup.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// VAPID Key for Web Push (PWA)
const VAPID_PUBLIC_KEY = 'BChqiccwpMXM9EXzXHdEeZB77tdHYlDAYlt-j-8S9QyAUA0mUFRGvbQQk20eIembrB0ezWyxmRO15eRBKwHUx5k';

export async function registerForPushNotificationsAsync() {
    return null;
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64); // window.atob on web
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Helper to send a test notification locally (works on foreground)
export async function sendLocalNotification(title: string, body: string) {
    // No-op
}

// Helper to schedule daily reminders
export async function scheduleDailyReminders() {
    // No-op
}
