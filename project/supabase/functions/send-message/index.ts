import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client — to verify caller identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Service client — to read secrets in channel_integrations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const {
      organization_id,
      conversation_id,
      channel,
      body,
      recipient_email,
      recipient_phone,
      subject,
    } = await req.json();

    if (!organization_id || !conversation_id || !channel || !body) {
      throw new Error("Missing required fields: organization_id, conversation_id, channel, body");
    }

    // Look up the active channel integration for this org + channel
    const { data: integration, error: intError } = await serviceClient
      .from("channel_integrations")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("channel_type", channel)
      .eq("is_active", true)
      .limit(1)
      .single();

    // Dispatch through provider
    let providerResult: { success: boolean; provider_message_id?: string; error?: string } = {
      success: false,
    };

    if (intError || !integration) {
      // No integration configured — store message locally only (no external send)
      providerResult = { success: true, provider_message_id: undefined };
    } else if (channel === "email") {
      providerResult = await sendEmail(integration, {
        to: recipient_email,
        subject: subject || "New message",
        body,
      });
    } else if (channel === "sms") {
      providerResult = await sendSMS(integration, {
        to: recipient_phone,
        body,
      });
    } else {
      // social / voicemail — store locally for now
      providerResult = { success: true };
    }

    // Insert message into messages table
    const { data: message, error: msgError } = await serviceClient
      .from("messages")
      .insert({
        conversation_id,
        sender_type: "staff",
        sender_id: user.id,
        body,
        channel,
        metadata: providerResult.provider_message_id
          ? { provider_message_id: providerResult.provider_message_id }
          : {},
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation denormalized fields
    const preview = body.length > 100 ? body.substring(0, 100) + "..." : body;
    await serviceClient
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        unread_count_client: 1, // staff sent → increment client unread
      })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        provider_sent: !!integration && providerResult.success,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

// ── Email dispatch ──────────────────────────────────────────────────
async function sendEmail(
  integration: any,
  params: { to?: string; subject: string; body: string }
): Promise<{ success: boolean; provider_message_id?: string; error?: string }> {
  const config = integration.config;
  const provider = integration.provider;

  if (!params.to) return { success: false, error: "No recipient email" };

  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        from: config.from_email
          ? `${config.from_name || "Support"} <${config.from_email}>`
          : "onboarding@resend.dev",
        to: params.to,
        subject: params.subject,
        html: `<p>${params.body.replace(/\n/g, "<br/>")}</p>`,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Resend API error" };
    return { success: true, provider_message_id: data.id };
  }

  if (provider === "sendgrid") {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: config.from_email || "noreply@example.com", name: config.from_name || "Support" },
        subject: params.subject,
        content: [{ type: "text/html", value: `<p>${params.body.replace(/\n/g, "<br/>")}</p>` }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }
    return { success: true };
  }

  return { success: false, error: `Unsupported email provider: ${provider}` };
}

// ── SMS dispatch (Twilio) ───────────────────────────────────────────
async function sendSMS(
  integration: any,
  params: { to?: string; body: string }
): Promise<{ success: boolean; provider_message_id?: string; error?: string }> {
  const config = integration.config;

  if (!params.to) return { success: false, error: "No recipient phone number" };
  if (!config.account_sid || !config.auth_token || !config.phone_number) {
    return { success: false, error: "Incomplete Twilio configuration" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`;
  const formBody = new URLSearchParams({
    To: params.to,
    From: config.phone_number,
    Body: params.body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${config.account_sid}:${config.auth_token}`),
    },
    body: formBody.toString(),
  });

  const data = await res.json();
  if (!res.ok) return { success: false, error: data.message || "Twilio API error" };
  return { success: true, provider_message_id: data.sid };
}
