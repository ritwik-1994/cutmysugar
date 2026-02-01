// Basic Service Worker for Expo Web Push
self.addEventListener('push', function (event) {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        const title = data.title || "CutMySugar";
        const options = {
            body: data.body || "New notification",
            icon: "/apple-touch-icon.png", // Fallback to existing icon
            badge: "/apple-touch-icon.png",
            data: data.data,
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (err) {
        console.error('Error processing push notification:', err);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    // Add logic here to open specific windows/tabs if needed
    event.waitUntil(
        clients.openWindow('/')
    );
});


// REQUIRED for PWA "Install App": A fetch handler
self.addEventListener('fetch', function (event) {
    // A simple pass-through fetch handler is enough to satisfy Chrome
    event.respondWith(fetch(event.request));
});
