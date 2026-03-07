// Voicemail Audio Proxy Edge Function
// Fetches Twilio recording audio with credentials so the browser doesn't prompt for login.
//
// Deploy with: supabase functions deploy voicemail-audio --no-verify-jwt
//
// Usage: GET /functions/v1/voicemail-audio?url=<encoded_twilio_recording_url>

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const params = new URL(req.url).searchParams
  const recordingUrl = params.get('url')

  if (!recordingUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // Security: only allow Twilio API URLs
  if (!recordingUrl.startsWith('https://api.twilio.com/')) {
    return new Response('Invalid recording URL', { status: 403 })
  }

  try {
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    })

    if (!response.ok) {
      console.error('Twilio fetch error:', response.status, await response.text())
      return new Response(`Twilio error: ${response.status}`, { status: 502 })
    }

    const audioBytes = await response.arrayBuffer()

    return new Response(audioBytes, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBytes.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Voicemail audio proxy error:', error)
    return new Response('Internal error', { status: 500 })
  }
})
