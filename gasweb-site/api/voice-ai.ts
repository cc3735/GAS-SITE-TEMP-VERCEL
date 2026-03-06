import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const VoiceResponse = twilio.twiml.VoiceResponse;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const TTS_BASE_URL = process.env.VOICE_TTS_URL
  || 'https://alamczcfsimukmsftqiq.supabase.co/functions/v1/voice-relay';
const FALLBACK_VOICE = 'Polly.Joanna' as const;

// --- Tool definitions for Gemini function calling ---

const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'transfer_call',
        description: 'Transfer the caller to a human agent or specific phone number. Use when the caller requests to speak with a person or you cannot help them.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: { type: 'STRING', description: 'Why the call is being transferred' },
          },
          required: ['reason'],
        },
      },
      {
        name: 'take_message',
        description: 'Save a message from the caller for the team to follow up on.',
        parameters: {
          type: 'OBJECT',
          properties: {
            caller_name: { type: 'STRING', description: "The caller's name" },
            message: { type: 'STRING', description: 'The message content' },
            callback_number: { type: 'STRING', description: 'Number to call back' },
            urgency: { type: 'STRING', description: 'Urgency level: low, normal, or high' },
          },
          required: ['message'],
        },
      },
      {
        name: 'end_call',
        description: 'Gracefully end the call. Use when the conversation is complete.',
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING', description: 'Brief summary of what was discussed' },
          },
          required: ['summary'],
        },
      },
    ],
  },
];

// --- Tool execution ---

async function executeTool(
  toolName: string,
  input: any,
  context: { orgId: string; callerPhone: string; callSid: string }
): Promise<string> {
  switch (toolName) {
    case 'take_message': {
      await supabase.from('voicemails').insert({
        call_sid: context.callSid,
        caller_phone: context.callerPhone,
        speech_result: `[AI Message] From: ${input.caller_name || 'Unknown'} | Urgency: ${input.urgency || 'normal'} | Message: ${input.message}${input.callback_number ? ` | Callback: ${input.callback_number}` : ''}`,
      });
      return 'Message has been saved. The team will follow up.';
    }

    case 'transfer_call':
      return `Transfer requested. Reason: ${input.reason}`;

    case 'end_call':
      return `Call complete. Summary: ${input.summary}`;

    default:
      return `Unknown tool: ${toolName}`;
  }
}

// --- Gemini API ---

async function callGemini(
  contents: any[],
  systemInstruction: string
): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        tools: GEMINI_TOOLS,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini API error:', err);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  return response.json();
}

function buildTtsUrl(text: string, voiceId: string): string {
  const url = new URL(TTS_BASE_URL);
  url.searchParams.set('text', text);
  url.searchParams.set('voice_id', voiceId);
  return url.toString();
}

// --- Main handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const speechResult = req.body?.SpeechResult as string | undefined;
  const callSid = req.body?.CallSid as string | undefined;
  const callerPhone = req.body?.From as string | undefined;
  const configId = req.query?.config_id as string | undefined;

  if (!speechResult || !callSid || !configId) {
    const twiml = new VoiceResponse();
    twiml.say({ voice: FALLBACK_VOICE }, "Sorry, I didn't catch that. Goodbye.");
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  // Load agent config
  const { data: config } = await supabase
    .from('voice_agent_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (!config) {
    const twiml = new VoiceResponse();
    twiml.say({ voice: FALLBACK_VOICE }, 'Sorry, something went wrong. Please try again later.');
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  // Load existing conversation from call log
  const { data: callLog } = await supabase
    .from('voice_call_logs')
    .select('id, transcript, tool_calls')
    .eq('call_sid', callSid)
    .single();

  const transcript: Array<{ role: string; text: string; timestamp: string }> = callLog?.transcript || [];
  const toolCallsLog: any[] = callLog?.tool_calls || [];

  // Build Gemini message history from transcript
  // Gemini uses "user" and "model" roles with {parts: [{text: "..."}]} format
  const contents: any[] = [];

  if (transcript.length === 0) {
    // First turn — add greeting as model message
    const greeting = config.greeting_message || 'Thank you for calling. How can I help you?';
    contents.push({ role: 'model', parts: [{ text: greeting }] });
    transcript.push({ role: 'model', text: greeting, timestamp: new Date().toISOString() });
  } else {
    // Rebuild contents from transcript
    for (const entry of transcript) {
      const role = entry.role === 'assistant' ? 'model' : entry.role;
      contents.push({ role, parts: [{ text: entry.text }] });
    }
  }

  // Add caller's new speech
  contents.push({ role: 'user', parts: [{ text: speechResult }] });
  transcript.push({ role: 'user', text: speechResult, timestamp: new Date().toISOString() });

  // Build system instruction
  const systemInstruction = (config.system_prompt || '') +
    '\n\nYou are on a phone call. Keep responses concise and conversational (1-3 sentences). ' +
    'Speak naturally as if talking on the phone. Do not use markdown, bullet points, or any formatting. ' +
    'Do not use asterisks, dashes, or special characters.';

  try {
    let geminiResponse = await callGemini(contents, systemInstruction);

    let responseText = '';
    let shouldEndCall = false;
    let shouldTransfer = false;
    const transferNumber = config.fallback_number;

    // Process Gemini response — handle function calls
    let candidate = geminiResponse.candidates?.[0];
    let parts = candidate?.content?.parts || [];

    // Check for function calls
    while (parts.some((p: any) => p.functionCall)) {
      // Extract text parts
      for (const part of parts) {
        if (part.text) responseText += part.text;
      }

      // Add model response to contents
      contents.push({ role: 'model', parts });

      // Execute function calls and build responses
      const functionResponses: any[] = [];
      for (const part of parts) {
        if (!part.functionCall) continue;

        const fnName = part.functionCall.name;
        const fnArgs = part.functionCall.args || {};

        const result = await executeTool(fnName, fnArgs, {
          orgId: config.organization_id,
          callerPhone: callerPhone || '',
          callSid,
        });

        toolCallsLog.push({
          tool: fnName,
          input: fnArgs,
          result,
          timestamp: new Date().toISOString(),
        });

        functionResponses.push({
          functionResponse: {
            name: fnName,
            response: { result },
          },
        });

        if (fnName === 'end_call') shouldEndCall = true;
        if (fnName === 'transfer_call') shouldTransfer = true;
      }

      // Send function results back to Gemini
      contents.push({ role: 'user', parts: functionResponses });
      geminiResponse = await callGemini(contents, systemInstruction);
      candidate = geminiResponse.candidates?.[0];
      parts = candidate?.content?.parts || [];
    }

    // Extract final text response
    for (const part of parts) {
      if (part.text) responseText += part.text;
    }

    // Log assistant response
    if (responseText) {
      transcript.push({ role: 'model', text: responseText, timestamp: new Date().toISOString() });
    }

    // Update call log
    const updateData: any = { transcript, tool_calls: toolCallsLog };
    if (shouldEndCall) {
      updateData.status = 'completed';
      updateData.ended_at = new Date().toISOString();
    }

    if (callLog?.id) {
      await supabase
        .from('voice_call_logs')
        .update(updateData)
        .eq('id', callLog.id);
    }

    // Build TwiML response
    const twiml = new VoiceResponse();

    if (responseText) {
      twiml.play(buildTtsUrl(responseText, config.voice_id));
    }

    if (shouldTransfer && transferNumber) {
      twiml.say({ voice: FALLBACK_VOICE }, 'Transferring you now.');
      twiml.dial(transferNumber);
    } else if (shouldEndCall) {
      twiml.pause({ length: 1 });
      twiml.hangup();
    } else {
      // Continue conversation — gather next speech
      twiml.gather({
        input: ['speech'],
        timeout: 5,
        speechTimeout: 'auto',
        action: `/api/voice-ai?config_id=${configId}`,
        method: 'POST',
      });

      // If no speech, offer voicemail
      twiml.play(buildTtsUrl(
        "Are you still there? If you'd like to leave a message, please do so after the beep.",
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
    }

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());

  } catch (error) {
    console.error('Voice AI error:', error);

    const twiml = new VoiceResponse();
    twiml.say(
      { voice: FALLBACK_VOICE },
      "I'm sorry, I'm having trouble right now. Please leave a message after the beep."
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

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }
}
