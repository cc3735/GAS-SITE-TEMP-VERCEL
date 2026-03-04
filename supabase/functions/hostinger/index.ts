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

    // Get Hostinger credentials from mcp_servers
    const { data: server } = await supabase
      .from('mcp_servers')
      .select('config')
      .eq('catalog_id', 'hostinger')
      .limit(1)
      .single()

    if (!server?.config) {
      return new Response(
        JSON.stringify({ error: 'Hostinger not configured. Ask your admin to install it via OS > MCP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

    // TODO: Replace mock responses with real Hostinger API calls
    // using server.config.api_token
    switch (action) {
      case 'domain_search':
        return new Response(JSON.stringify({
          domain: params.domain,
          available: true,
          price: '$9.99/yr',
          message: 'Domain availability check (mock — connect Hostinger API for production)',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      case 'domain_register':
        return new Response(JSON.stringify({
          success: true,
          domain: params.domain,
          status: 'registered',
          message: 'Domain registered (mock)',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      case 'dns_manage':
        return new Response(JSON.stringify({
          success: true,
          records: [],
          message: 'DNS management (mock)',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      case 'hosting_provision':
        return new Response(JSON.stringify({
          success: true,
          status: 'provisioning',
          message: 'Hosting environment being set up (mock)',
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
