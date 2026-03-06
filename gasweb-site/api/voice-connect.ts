// Voice Connect — AI-powered inbound call handler
import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const VoiceResponse = twilio.twiml.VoiceResponse;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TTS_BASE_URL = process.env.VOICE_TTS_URL
  || 'https://alamczcfsimukmsftqiq.supabase.co/functions/v1/voice-relay';

const FALLBACK_VOICE = 'Polly.Joanna' as const;
const COMPANY = 'Global Automation Solutions';

function isWithinBusinessHours(businessHours: any): boolean {
  if (!businessHours?.schedule || !businessHours?.timezone) return true;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: businessHours.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3);
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;

  if (!weekday || !hour || !minute) return true;

  const daySchedule = businessHours.schedule[weekday];
  if (!daySchedule) return false;

  const currentTime = `${hour}:${minute}`;
  return currentTime >= daySchedule.open && currentTime < daySchedule.close;
}

function buildTtsUrl(text: string, voiceId: string): string {
  const url = new URL(TTS_BASE_URL);
  url.searchParams.set('text', text);
  url.searchParams.set('voice_id', voiceId);
  return url.toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const calledNumber = req.body?.To as string | undefined;
  const callerPhone = req.body?.From as string | undefined;
  const callSid = req.body?.CallSid as string | undefined;

  if (!calledNumber) {
    return fallbackVoicemail(res);
  }

  // Look up voice agent config for this number
  const { data: config } = await supabase
    .from('voice_agent_configs')
    .select('*')
    .eq('twilio_phone_number', calledNumber)
    .eq('is_active', true)
    .single();

  if (!config) {
    return fallbackVoicemail(res);
  }

  // Check business hours
  if (!isWithinBusinessHours(config.business_hours)) {
    return handleAfterHours(res, config);
  }

  // Create call log entry
  await supabase.from('voice_call_logs').insert({
    agent_id: config.agent_id,
    organization_id: config.organization_id,
    config_id: config.id,
    call_sid: callSid,
    caller_phone: callerPhone,
    called_number: calledNumber,
    direction: 'inbound',
    status: 'in_progress',
    transcript: [],
    tool_calls: [],
    started_at: new Date().toISOString(),
  });

  // Build TwiML: play ElevenLabs greeting, then gather speech
  const twiml = new VoiceResponse();
  const greetingText = config.greeting_message || 'Thank you for calling. How can I help you today?';

  // Play greeting via ElevenLabs
  twiml.play(buildTtsUrl(greetingText, config.voice_id));

  // Gather caller's speech — sends result to /api/voice-ai
  const gather = twiml.gather({
    input: ['speech'],
    timeout: 5,
    speechTimeout: 'auto',
    action: `/api/voice-ai?config_id=${config.id}`,
    method: 'POST',
  });

  // If no speech detected, offer voicemail
  twiml.play(buildTtsUrl(
    "I didn't catch that. Please leave a message after the beep and someone will get back to you.",
    config.voice_id
  ));
  twiml.record({
    maxLength: 120,
    finishOnKey: '#',
    transcribe: true,
    transcribeCallback: '/api/voice-status',
    recordingStatusCallback: '/api/voice-status',
    recordingStatusCallbackEvent: ['completed'],
    playBeep: true,
  });

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}

function fallbackVoicemail(res: VercelResponse) {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: ['speech'],
    timeout: 5,
    speechTimeout: 'auto',
    action: '/api/voice',
    method: 'POST',
  });
  gather.say(
    { voice: FALLBACK_VOICE },
    `Thank you for calling ${COMPANY}, your AI automation partner. How can we help you today?`
  );

  twiml.say(
    { voice: FALLBACK_VOICE },
    "We didn't catch that. Please leave a message after the beep and we'll get back to you within 24 hours."
  );
  twiml.record({
    maxLength: 120,
    finishOnKey: '#',
    transcribe: true,
    transcribeCallback: '/api/voice-status',
    recordingStatusCallback: '/api/voice-status',
    recordingStatusCallbackEvent: ['completed'],
    playBeep: true,
  });
  twiml.say({ voice: FALLBACK_VOICE }, 'Goodbye.');

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}

function handleAfterHours(res: VercelResponse, config: any) {
  const twiml = new VoiceResponse();

  if (config.fallback_action === 'transfer' && config.fallback_number) {
    twiml.say(
      { voice: FALLBACK_VOICE },
      'We are currently outside of business hours. Let me transfer you.'
    );
    twiml.dial(config.fallback_number);
  } else {
    const afterHoursMsg = "We are currently outside of business hours. Please leave a message after the beep and we will get back to you on the next business day.";
    twiml.play(buildTtsUrl(afterHoursMsg, config.voice_id));
    twiml.record({
      maxLength: 120,
      finishOnKey: '#',
      transcribe: true,
      transcribeCallback: '/api/voice-status',
      recordingStatusCallback: '/api/voice-status',
      recordingStatusCallbackEvent: ['completed'],
      playBeep: true,
    });
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
