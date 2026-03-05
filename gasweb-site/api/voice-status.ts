import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const body = req.body;

  try {
    if (body.RecordingSid && body.RecordingUrl && !body.TranscriptionSid) {
      // Recording completed callback
      const { error } = await supabase.from('voicemails').insert({
        call_sid: body.CallSid,
        recording_sid: body.RecordingSid,
        recording_url: `${body.RecordingUrl}.mp3`,
        recording_duration: parseInt(body.RecordingDuration, 10) || null,
        caller_phone: body.From || null,
        called_number: body.To || null,
        caller_city: body.CallerCity || null,
        caller_state: body.CallerState || null,
        caller_country: body.CallerCountry || null,
        speech_result: (req.query.speech as string) || null,
      });

      if (error) throw error;
    } else if (body.TranscriptionSid && body.TranscriptionText) {
      // Transcription completed callback
      const { error } = await supabase
        .from('voicemails')
        .update({
          transcription_sid: body.TranscriptionSid,
          transcription_text: body.TranscriptionText,
          updated_at: new Date().toISOString(),
        })
        .eq('recording_sid', body.RecordingSid);

      if (error) throw error;
    }

    return res.status(204).send('');
  } catch (err) {
    console.error('voice-status error:', err);
    return res.status(500).send('Internal Server Error');
  }
}
