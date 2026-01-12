import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface WebhookPayload {
  user: {
    phone: string
  }
  otp: string
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    const { user, otp } = payload

    // Clean phone number: MSG91 usually expects country code without + (e.g. 919999999999)
    const phone = user.phone.replace('+', '')

    console.log(`Sending OTP ${otp} to ${phone} via MSG91`)

    // MSG91 API V5 (Flow)
    const msg91Payload = {
      template_id: Deno.env.get("MSG91_TEMPLATE_ID"),
      short_url: "0",
      realTimeResponse: "1",
      recipients: [
        {
          mobiles: phone,
          otp: otp // Variable name must match your MSG91 template variable
        }
      ]
    }

    const response = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "authkey": Deno.env.get("MSG91_AUTH_KEY") ?? "",
        "content-type": "application/json"
      },
      body: JSON.stringify(msg91Payload)
    })

    const result = await response.json()
    console.log("MSG91 Result:", result)

    if (result.type === "error") {
      throw new Error(result.message)
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })

  } catch (error) {
    console.error("Error sending SMS:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    })
  }
})