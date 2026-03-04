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
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { organization_id, channel_type, provider, config, test_recipient } =
      await req.json();

    if (!channel_type || !provider || !config) {
      throw new Error("Missing required fields: channel_type, provider, config");
    }

    let result: { success: boolean; error?: string };

    if (channel_type === "email") {
      result = await testEmail(provider, config, test_recipient || user.email);
    } else if (channel_type === "sms") {
      result = await testSMS(config, test_recipient);
    } else {
      result = { success: false, error: `Testing not supported for channel: ${channel_type}` };
    }

    // If successful, update last_verified_at on the integration record
    if (result.success && organization_id) {
      const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await serviceClient
        .from("channel_integrations")
        .update({ last_verified_at: new Date().toISOString() })
        .eq("organization_id", organization_id)
        .eq("channel_type", channel_type)
        .eq("provider", provider);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

// ── Test email ──────────────────────────────────────────────────────
async function testEmail(
  provider: string,
  config: any,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!recipientEmail) return { success: false, error: "No test recipient email" };

  if (provider === "resend") {
    if (!config.api_key) return { success: false, error: "Missing API key" };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        from: config.from_email
          ? `${config.from_name || "Test"} <${config.from_email}>`
          : "onboarding@resend.dev",
        to: recipientEmail,
        subject: "GAS Integration Test",
        html: "<p>This is a test email from your GAS messaging integration. If you received this, your email integration is working correctly.</p>",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.message || "Resend API error" };
    }
    return { success: true };
  }

  if (provider === "sendgrid") {
    if (!config.api_key) return { success: false, error: "Missing API key" };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipientEmail }] }],
        from: {
          email: config.from_email || "noreply@example.com",
          name: config.from_name || "Test",
        },
        subject: "GAS Integration Test",
        content: [
          {
            type: "text/html",
            value: "<p>This is a test email from your GAS messaging integration. If you received this, your email integration is working correctly.</p>",
          },
        ],
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

// ── Test SMS (Twilio) ───────────────────────────────────────────────
async function testSMS(
  config: any,
  testPhone?: string
): Promise<{ success: boolean; error?: string }> {
  if (!testPhone) return { success: false, error: "Please provide a test phone number" };
  if (!config.account_sid || !config.auth_token || !config.phone_number) {
    return { success: false, error: "Incomplete Twilio configuration" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`;
  const formBody = new URLSearchParams({
    To: testPhone,
    From: config.phone_number,
    Body: "GAS Integration Test: Your SMS integration is working correctly.",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${config.account_sid}:${config.auth_token}`),
    },
    body: formBody.toString(),
  });

  if (!res.ok) {
    const data = await res.json();
    return { success: false, error: data.message || "Twilio API error" };
  }
  return { success: true };
}
