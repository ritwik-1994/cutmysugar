import { useState } from 'react';
import * as Notifications from 'expo-notifications';

export const usePushNotifications = () => {
    // SUNSET: Push notifications disabled for stability.
    // Keeping hooks to prevent breaking changes in UI components.

    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();

    const register = async () => {
        console.log("Push Notifications are currently disabled.");
        return undefined;
    };

    const trackMealLog = async () => {
        // No-op
    };

    return {
        expoPushToken,
        notification,
        register,
        trackMealLog
    };
};
