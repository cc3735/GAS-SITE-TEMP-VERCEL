// Voice TTS Proxy Edge Function
// Simple HTTP endpoint that converts text to speech via ElevenLabs
// Twilio's <Play> fetches audio from this URL
//
// Deploy with: supabase functions deploy voice-relay --no-verify-jwt
// (keeping the name "voice-relay" to avoid creating a new function)
//
// Usage: GET /functions/v1/voice-relay?text=Hello&voice_id=EXAVITQu4vr4xnSDxMaL

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah - natural conversational voice

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const url = new URL(req.url)
  const text = url.searchParams.get('text')
  const voiceId = url.searchParams.get('voice_id') || DEFAULT_VOICE_ID

  if (!text) {
    return new Response('Missing text parameter', { status: 400 })
  }

  try {
    // Call ElevenLabs TTS API - request mp3 format (Twilio supports mp3)
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs error:', err)
      return new Response(`TTS error: ${response.status}`, { status: 502 })
    }

    // Stream the audio bytes back as mp3
    const audioBytes = await response.arrayBuffer()

    return new Response(audioBytes, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Voice TTS error:', error)
    return new Response('Internal error', { status: 500 })
  }
})
