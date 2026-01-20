// ✅ FIX 1: Use the "Short Names" defined in deno.json
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { endpoint, params } = await req.json();
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY'); 
    
    // 1. SETUP SUPABASE CLIENT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 🛑 CACHING LOGIC
    if (endpoint === 'time_series') {
        const symbol = params.symbol;
        const interval = params.interval;

        // A. Check The Vault
        const { data: cached } = await supabaseClient
            .from('market_cache')
            .select('*')
            .eq('symbol', symbol)
            .eq('interval', interval)
            .single();

        // B. If fresh, RETURN IT FREE
        if (cached) {
            const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
            if (cacheAge < 5 * 60 * 1000) { // 5 Minutes
                console.log(`[Cache] 🟢 HIT for ${symbol} (Saved 1 Credit)`);
                return new Response(JSON.stringify(cached.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }
        console.log(`[Cache] 🔴 MISS for ${symbol} (Spending 1 Credit...)`);
    }

    // 2. IF NO CACHE, BUY FROM TWELVE DATA
    const baseUrl = 'https://api.twelvedata.com';
    const queryString = new URLSearchParams({ ...params, apikey: apiKey }).toString();
    const response = await fetch(`${baseUrl}/${endpoint}?${queryString}`);
    const data = await response.json();

    if (data.status === 'error') throw new Error(data.message);

    // 3. SAVE TO VAULT
    if (endpoint === 'time_series' && data.values) {
        await supabaseClient.from('market_cache').upsert({
            symbol: params.symbol,
            interval: params.interval,
            data: data,
            updated_at: new Date().toISOString()
        });
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) { // ✅ FIX 2: Use 'unknown' instead of 'any'
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    return new Response(JSON.stringify({ error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});