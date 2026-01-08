// Setup: 
// 1. Create a Google Cloud Service Account with "Vertex AI User" role.
// 2. Download JSON key.
// 3. Set secret: supabase secrets set GCP_SERVICE_ACCOUNT='$(cat path/to/key.json)'

import jwt from 'npm:jsonwebtoken@9.0.2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { base64Image, prompt, inlineData, foodName, description, context } = await req.json()
        const serviceAccount = Deno.env.get('GCP_SERVICE_ACCOUNT')

        if (!serviceAccount) {
            throw new Error('GCP_SERVICE_ACCOUNT secret not set. Please run: supabase secrets set GCP_SERVICE_ACCOUNT=...')
        }

        let saKey;
        try {
            saKey = JSON.parse(serviceAccount)
        } catch (e) {
            throw new Error('GCP_SERVICE_ACCOUNT secret is not valid JSON.')
        }

        // 1. Authenticate with Google (Manual JWT Flow)
        const now = Math.floor(Date.now() / 1000)
        const payload = {
            iss: saKey.client_email,
            sub: saKey.client_email,
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600,
            scope: 'https://www.googleapis.com/auth/cloud-platform'
        }

        const signedJwt = jwt.sign(payload, saKey.private_key, { algorithm: 'RS256' })

        // Exchange JWT for Access Token
        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: signedJwt
            })
        })

        if (!tokenResp.ok) {
            const err = await tokenResp.text()
            throw new Error(`Google Auth Token Exchange Failed: ${tokenResp.status} - ${err}`)
        }

        const tokenData = await tokenResp.json()
        const accessToken = tokenData.access_token

        // 2. Construct Vertex AI Request
        const projectId = saKey.project_id
        const location = 'us-central1'
        const modelId = 'gemini-2.5-flash' // STRICT USER REQUEST

        // SWITCH TO NON-STREAMING ENDPOINT (generateContent) prevents partial chunks
        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`

        const parts = []
        if (prompt) parts.push({ text: prompt })
        if (base64Image) {
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '')
            parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64
                }
            })
        }
        if (foodName) {
            let textContext = `Detailed analysis for food: "${foodName}". `
            if (description) textContext += `Description: ${description}. `
            if (context) textContext += `Context: ${context}.`
            parts.push({ text: textContext })
        }

        // 3. Call Vertex AI API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: parts }],
                generationConfig: {
                    temperature: 0.0,
                    maxOutputTokens: 16384, // INCREASED to ~16k per user request
                    topP: 0.8,
                    topK: 40
                }
            })
        })

        if (!response.ok) {
            // ... (Diagnostic Logic same as before) ...
            const errorText = await response.text()

            // --- DIAGNOSTIC PROBE: LIST LOCATIONS ---
            console.log("Main call failed. Probing accessible locations...");
            let locationDebug = "Probe failed";
            try {
                const locResp = await fetch(`https://aiplatform.googleapis.com/v1/projects/${projectId}/locations`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (locResp.ok) {
                    const locData = await locResp.json();
                    const locIds = locData.locations ? locData.locations.map((l: any) => l.locationId).join(", ") : "No locations found";
                    locationDebug = `Accessible Regions: [${locIds}]`;
                } else {
                    locationDebug = `Probe Error: ${locResp.status} - ${await locResp.text()}`;
                }
            } catch (probeError) {
                locationDebug = `Probe Exception: ${probeError.message}`;
            }

            throw new Error(`Vertex AI Failed (${response.status}). ${locationDebug} || Original Error: ${errorText}`)
        }

        const data = await response.json()

        // NEW PARSING LOGIC FOR generateContent (one object, not array)
        let fullText = ""
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            fullText = data.candidates[0].content.parts[0].text || ""
        } else {
            fullText = JSON.stringify(data); // Fallback
        }

        // Clean JSON
        const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/) || fullText.match(/```\n([\s\S]*?)\n```/)
        const finalJsonString = jsonMatch ? jsonMatch[1] : fullText

        return new Response(finalJsonString, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({
            error: "Edge Function Logic Error",
            message: error.message,
            stack: error instanceof Error ? error.stack : String(error)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
