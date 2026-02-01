
const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');

// --- CONFIG ---
const SUPABASE_URL = 'https://efqzurkdfcptpuofcwdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmcXp1cmtkZmNwdHB1b2Zjd2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjcwMTAsImV4cCI6MjA4MzQ0MzAxMH0.VI761WtFh7cZz7_j6Nq86ug_oAQPbhPQVc5WcPo03ao';

async function testPush() {
    console.log("1. Connecting to Supabase...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch tokens
    console.log("2. Fetching profiles with tokens...");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('expo_push_token, full_name')
        .not('expo_push_token', 'is', null);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`> Found ${profiles.length} profiles with tokens.`);
    profiles.forEach(p => console.log(`  - ${p.full_name}: ${p.expo_push_token.substring(0, 20)}...`));

    // Filter valid tokens
    const expo = new Expo();
    const messages = [];

    for (const profile of profiles) {
        if (!Expo.isExpoPushToken(profile.expo_push_token)) {
            console.warn(`  ! Invalid token for ${profile.full_name}: ${profile.expo_push_token}`);
            continue;
        }

        messages.push({
            to: profile.expo_push_token,
            sound: 'default',
            title: 'Test from Script 🚀',
            body: `Hello ${profile.full_name}! This is a server-side push test.`,
            data: { url: '/settings' },
        });
    }

    if (messages.length === 0) {
        console.log("No valid messages to send.");
        return;
    }

    console.log(`3. Sending ${messages.length} notifications...`);
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log("  > Tickets:", ticketChunk);
        } catch (error) {
            console.error(error);
        }
    }
    console.log("Done!");
}

testPush();
