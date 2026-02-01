import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Expo } from 'npm:expo-server-sdk'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch profiles with tokens - targeting WEB only for now
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('expo_push_token')
            .eq('push_platform', 'web')
            .not('expo_push_token', 'is', null)

        if (error) throw error

        // Deduplicate and validate
        const uniqueTokens = [...new Set(profiles.map(p => p.expo_push_token))];
        const tokens = uniqueTokens.filter(t => Expo.isExpoPushToken(t));

        console.log(`Found ${tokens.length} valid tokens from ${profiles.length} profiles`)

        if (tokens.length === 0) {
            return new Response(JSON.stringify({ message: 'No valid tokens found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Prepare messages
        const expo = new Expo()
        const messages = []
        for (const pushToken of tokens) {
            messages.push({
                to: pushToken,
                sound: 'default',
                title: 'Time to log! 🥗',
                body: 'Keep your Sugar Score in check. What are you eating?',
                data: { url: '/home' },
            })
        }

        // 3. Send in batches
        const chunks = expo.chunkPushNotifications(messages)
        const tickets = []

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
                tickets.push(...ticketChunk)
            } catch (error) {
                console.error(error)
            }
        }

        return new Response(JSON.stringify({ success: true, count: tokens.length, tickets }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
