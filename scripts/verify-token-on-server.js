const { createClient } = require('@supabase/supabase-js');

// Config from secrets
const SUPABASE_URL = 'https://efqzurkdfcptpuofcwdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmcXp1cmtkZmNwdHB1b2Zjd2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjcwMTAsImV4cCI6MjA4MzQ0MzAxMH0.VI761WtFh7cZz7_j6Nq86ug_oAQPbhPQVc5WcPo03ao';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log("🔍 Checking Database for recent Push Tokens...");

    // Fetch the 5 most recently updated profiles that HAVE a push token
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, expo_push_token, updated_at')
        .not('expo_push_token', 'is', null) // Only valid tokens
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching profiles:", error.message);
        console.log("   (Likely Row Level Security blocking access. We need a Real User ID or Service Key).");
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log("⚠️ No tokens found in last 5 updated profiles.");
        return;
    }

    console.log("\n✅ Found Recent Tokens:");
    profiles.forEach((p, i) => {
        console.log(`\n--- User ${i + 1} ---`);
        console.log(`Name: ${p.full_name || 'No Name'}`);
        console.log(`Email: ${p.email || 'No Email'}`); // Might be hidden by RLS
        console.log(`Updated: ${new Date(p.updated_at).toLocaleString()}`);
        console.log(`Token: ${p.expo_push_token.substring(0, 50)}...`);

        // Save to file for the test script
        if (i === 0) {
            console.log("\n(Saving most recent token to 'scripts/push-token.json' for testing...)");
            const fs = require('fs');
            // Try to parse if it's JSON (Web) or String (Mobile)
            let tokenData = p.expo_push_token;
            try {
                // If it looks like JSON, parse it
                if (tokenData.startsWith('{')) {
                    // It's a Web VAPID JSON string
                    // We can write it as is
                } else {
                    // It's an Expo Token string
                    // The test script might expect an object? 
                    // Let's check test-web-push.js logic later.
                }
                fs.writeFileSync('scripts/push-token.json', tokenData);
            } catch (e) { }
        }
    });
}

main();
