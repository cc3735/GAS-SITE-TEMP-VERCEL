// Send Invitation Edge Function
// Creates an invitation record and sends an email to the invitee
// Deploy: supabase functions deploy send-invitation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://app.gasweb.info";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "invitations@gasweb.info";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  organization_id: string;
  email: string;
  role?: string;
}

interface InvitationResponse {
  success: boolean;
  invitation_id?: string;
  error?: string;
}

// Generate a secure token for the invitation
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const base64 = btoa(String.fromCharCode(...array));
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Send email using Resend (can be swapped for other services)
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: true }; // Don't fail if email not configured
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Email send failed:", error);
      return { success: false, error: `Email send failed: ${error}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

// Generate invitation email HTML
function generateInvitationEmailHtml(
  organizationName: string,
  inviterEmail: string,
  role: string,
  inviteUrl: string,
  expiresAt: Date
): string {
  const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6, #2563eb);">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                You're Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                <strong>${inviterEmail}</strong> has invited you to join <strong>${organizationName}</strong> on GAS OS.
              </p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Your role:</p>
                <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; text-transform: capitalize;">${role}</p>
              </div>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                Click the button below to accept this invitation and join the organization.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #9ca3af; font-size: 14px; line-height: 20px;">
                This invitation expires on <strong>${expiresFormatted}</strong>.
              </p>
              
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 14px; line-height: 20px;">
                If you can't click the button, copy and paste this URL into your browser:
              </p>
              <p style="margin: 8px 0 0; color: #3b82f6; font-size: 12px; word-break: break-all;">
                ${inviteUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This email was sent by GAS OS on behalf of ${organizationName}.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
          Powered by <a href="https://gasweb.info" style="color: #3b82f6; text-decoration: none;">Global Automation Solutions</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid or expired token");
    }

    // Parse request body
    const body: InvitationRequest = await req.json();
    const { organization_id, email, role = "member" } = body;

    // Validate required fields
    if (!organization_id || !email) {
      throw new Error("Missing required fields: organization_id and email");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate role
    const validRoles = ["owner", "admin", "member", "viewer"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    // Check if user has permission to invite (must be admin/owner of org or master admin)
    const { data: membership, error: membershipError } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .single();

    const { data: masterOrg } = await supabaseClient
      .from("organizations")
      .select("id")
      .eq("is_master", true)
      .single();

    const { data: masterMembership } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", masterOrg?.id)
      .eq("user_id", user.id)
      .single();

    const isMasterAdmin = masterMembership && ["owner", "admin"].includes(masterMembership.role);
    const isOrgAdmin = membership && ["owner", "admin"].includes(membership.role);

    if (!isMasterAdmin && !isOrgAdmin) {
      throw new Error("You don't have permission to invite users to this organization");
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from("organizations")
      .select("id, name, slug")
      .eq("id", organization_id)
      .single();

    if (orgError || !organization) {
      throw new Error("Organization not found");
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", (
        await supabaseClient
          .from("auth.users")
          .select("id")
          .eq("email", email)
          .single()
      ).data?.id)
      .single();

    if (existingMember) {
      throw new Error("This user is already a member of the organization");
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabaseClient
      .from("organization_invitations")
      .select("id, expires_at")
      .eq("organization_id", organization_id)
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvitation) {
      throw new Error("A pending invitation already exists for this email");
    }

    // Generate token and expiration
    const token_value = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("organization_invitations")
      .insert({
        organization_id,
        email,
        role,
        token: token_value,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Failed to create invitation:", inviteError);
      throw new Error("Failed to create invitation");
    }

    // Generate invitation URL
    const inviteUrl = `${APP_URL}/setup?token=${token_value}`;

    // Send invitation email
    const emailHtml = generateInvitationEmailHtml(
      organization.name,
      user.email || "An administrator",
      role,
      inviteUrl,
      expiresAt
    );

    const emailResult = await sendEmail(
      email,
      `You're invited to join ${organization.name}`,
      emailHtml
    );

    if (!emailResult.success) {
      console.warn("Email send failed, but invitation created:", emailResult.error);
    }

    const response: InvitationResponse = {
      success: true,
      invitation_id: invitation.id,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-invitation:", error);
    
    const response: InvitationResponse = {
      success: false,
      error: error.message || "An unexpected error occurred",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

