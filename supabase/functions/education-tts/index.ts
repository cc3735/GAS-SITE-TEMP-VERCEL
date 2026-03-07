// Education TTS Edge Function
// Converts lesson text to natural speech via ElevenLabs (MP3)
// Requires JWT auth + sufficient TTS credits
//
// Deploy with: supabase functions deploy education-tts
// (JWT verification enabled — requires Authorization header)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah
const MAX_CHARS_PER_REQUEST = 5000

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Extract user from JWT (Supabase handles verification)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create authenticated client to get user, service client for writes
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { text, voice_id, course_id, lesson_id } = await req.json()

    if (!text || !course_id || !lesson_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: text, course_id, lesson_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const voiceId = voice_id || DEFAULT_VOICE_ID
    const charCount = text.length

    // Check credit balance
    const { data: balance } = await serviceClient
      .from('tts_credit_balances')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()

    const creditsRemaining = balance?.credits_remaining ?? 0

    if (creditsRemaining < charCount) {
      return new Response(JSON.stringify({
        error: 'insufficient_credits',
        credits_remaining: creditsRemaining,
        characters_needed: charCount,
      }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Split text into chunks if > 5000 chars
    const chunks: string[] = []
    if (charCount <= MAX_CHARS_PER_REQUEST) {
      chunks.push(text)
    } else {
      // Split on sentence boundaries
      const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text]
      let current = ''
      for (const sentence of sentences) {
        if ((current + sentence).length > MAX_CHARS_PER_REQUEST && current.length > 0) {
          chunks.push(current.trim())
          current = sentence
        } else {
          current += sentence
        }
      }
      if (current.trim()) chunks.push(current.trim())
    }

    // Call ElevenLabs for each chunk
    const audioBuffers: ArrayBuffer[] = []
    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: chunk,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: false,
            },
          }),
        }
      )

      if (!response.ok) {
        const err = await response.text()
        console.error('ElevenLabs error:', err)
        return new Response(JSON.stringify({ error: 'TTS generation failed' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      audioBuffers.push(await response.arrayBuffer())
    }

    // Concatenate MP3 buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0
    for (const buf of audioBuffers) {
      combined.set(new Uint8Array(buf), offset)
      offset += buf.byteLength
    }

    // Deduct credits and log usage atomically
    await serviceClient
      .from('tts_credit_balances')
      .update({
        credits_remaining: creditsRemaining - charCount,
        credits_used: (balance as any).credits_used
          ? (balance as any).credits_used + charCount
          : charCount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    await serviceClient.from('tts_usage_log').insert({
      user_id: user.id,
      course_id,
      lesson_id,
      characters_used: charCount,
      voice_id: voiceId,
    })

    return new Response(combined.buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': totalLength.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Education TTS error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
