const webpush = require('web-push');

// 1. configuration
const vapidKeys = {
    publicKey: 'BChqiccwpMXM9EXzXHdEeZB77tdHYlDAYlt-j-8S9QyAUA0mUFRGvbQQk20eIembrB0ezWyxmRO15eRBKwHUx5k',
    privateKey: 'rkc9IIDK1O3pH9nJSrvQIHlgYccDQ44p1sxrqF_0_8I'
};

webpush.setVapidDetails(
    'mailto:admin@cutmysugar.app',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// 2. Get token from file
const fs = require('fs');
const path = require('path');
const tokenPath = path.join(__dirname, 'push-token.json');

let pushSubscription;
try {
    if (fs.existsSync(tokenPath)) {
        console.log(`📂 Reading token from ${tokenPath}...`);
        const tokenRaw = fs.readFileSync(tokenPath, 'utf8');
        pushSubscription = JSON.parse(tokenRaw);
    } else {
        // Fallback to argv
        const tokenArg = process.argv[2];
        if (!tokenArg) {
            throw new Error('No token file found and no argument provided.');
        }
        pushSubscription = JSON.parse(tokenArg);
    }
} catch (e) {
    console.error('❌ Error reading token:', e.message);
    process.exit(1);
}

// 3. Send Notification
const payload = JSON.stringify({
    title: '🍬 Sugar Spike Alert!',
    body: 'This is a TEST notification from your Node.js script!',
    data: { url: 'http://localhost:8081' }
});

console.log('🚀 Sending notification...');

webpush.sendNotification(pushSubscription, payload)
    .then(response => {
        console.log('✅ VICTORY! Notification sent successfully.');
        console.log('Status Code:', response.statusCode);
        console.log('Check your browser/sidebar now!');
    })
    .catch(error => {
        console.error('❌ FAILED to send notification:');
        console.error(error);
    });
