import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify calling user
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get Zoho Sign credentials from mcp_servers
    const { data: server } = await supabase
      .from('mcp_servers')
      .select('config')
      .eq('catalog_id', 'zoho-sign')
      .limit(1)
      .single()

    if (!server?.config) {
      return new Response(
        JSON.stringify({ error: 'Zoho Sign not configured. Ask your admin to install it via OS > MCP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

    // TODO: Replace mock responses with real Zoho Sign API calls
    // using server.config.client_id, client_secret, refresh_token, domain
    switch (action) {
      case 'send_document':
        return new Response(JSON.stringify({
          success: true,
          request_id: 'mock-' + crypto.randomUUID(),
          status: 'sent',
          message: 'Document sent for signature (mock — connect Zoho Sign API for production)',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      case 'check_status':
        return new Response(JSON.stringify({
          request_id: params.request_id,
          status: 'viewed',
          signers: [{ email: 'signer@example.com', status: 'viewed' }],
          message: 'Status check (mock)',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      case 'download_signed':
        return new Response(JSON.stringify({
          request_id: params.request_id,
          download_url: null,
          message: 'Download not yet available (mock)',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
