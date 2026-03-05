import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

const VOICE = 'Polly.Joanna' as const;
const COMPANY = 'Global Automation Solutions';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const twiml = new VoiceResponse();
  const speechResult = req.body?.SpeechResult as string | undefined;

  if (speechResult) {
    // Caller spoke — acknowledge and offer voicemail
    twiml.say(
      { voice: VOICE },
      `Thank you for sharing that. A member of the ${COMPANY} team will follow up with you shortly regarding your inquiry.`
    );
    twiml.pause({ length: 1 });
    twiml.say(
      { voice: VOICE },
      'If you would like to leave a detailed message, please do so after the beep. Press the pound key when finished.'
    );
    twiml.record({
      maxLength: 120,
      finishOnKey: '#',
      transcribe: true,
      playBeep: true,
    });
    twiml.say({ voice: VOICE }, 'We did not receive a recording. Goodbye.');
  } else {
    // Initial greeting — gather speech input
    const gather = twiml.gather({
      input: ['speech'],
      timeout: 5,
      speechTimeout: 'auto',
      action: '/api/voice',
      method: 'POST',
    });
    gather.say(
      { voice: VOICE },
      `Thank you for calling ${COMPANY}, your AI automation partner. How can we help you today?`
    );

    // No input fallback — offer voicemail
    twiml.say(
      { voice: VOICE },
      'We didn\'t catch that. Please leave a message after the beep and we\'ll get back to you within 24 hours.'
    );
    twiml.record({
      maxLength: 120,
      finishOnKey: '#',
      transcribe: true,
      playBeep: true,
    });
    twiml.say({ voice: VOICE }, 'Goodbye.');
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
