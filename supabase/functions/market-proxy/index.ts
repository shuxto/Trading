// supabase/functions/market-proxy/index.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Get the Secret Key
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY')
    if (!apiKey) throw new Error('Missing API Key in Supabase Secrets')

    // 3. Get the request
    const { endpoint, params } = await req.json()
    
    // 4. Construct URL
    let url = `https://api.twelvedata.com/${endpoint}?apikey=${apiKey}`
    
    // Add params if they exist
    if (params) {
      Object.keys(params).forEach(key => {
          url += `&${key}=${params[key]}`
      })
    }

    // 5. Fetch from Twelve Data
    const res = await fetch(url)
    const data = await res.json()

    // 6. Send data back
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) { 
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})