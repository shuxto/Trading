// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';

// CORS Headers to allow requests from your frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Admin Client (Service Role)
    // This client bypasses Row Level Security (RLS) to modify balances securely
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get the User from the Request Header (Security Check)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { action, payload } = await req.json()

    // ============================================================
    // ACTION: OPEN TRADE
    // ============================================================
    if (action === 'open') {
      const { symbol, type, size, leverage, account_id, stop_loss, take_profit } = payload;

      // A. Fetch REAL Price from Binance (Server-Side)
      // We do NOT trust the price sent by the client
      const cleanSymbol = symbol.replace('/', '');
      const priceRes = await fetch(`${BINANCE_API}?symbol=${cleanSymbol}`);
      const priceData = await priceRes.json();
      const realPrice = parseFloat(priceData.price);

      if (!realPrice || isNaN(realPrice)) {
        throw new Error('Failed to fetch verified market price');
      }

      // B. Calculate Margin Required
      const margin = size / leverage;

      // C. Check User Balance
      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
      
      if (!profile || profile.balance < margin) {
        return new Response(JSON.stringify({ error: 'Insufficient Balance' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // D. Execute Database Transaction
      // 1. Deduct Balance
      await supabase.from('profiles').update({ balance: profile.balance - margin }).eq('id', user.id);
      
      // 2. Calculate Liquidation Price
      const liquidationPrice = type === 'buy' 
          ? realPrice * (1 - (1/leverage) + 0.005) 
          : realPrice * (1 + (1/leverage) - 0.005);

      // 3. Insert Trade
      const { data: trade, error } = await supabase.from('trades').insert([{
        user_id: user.id,
        account_id,
        symbol,
        type,
        entry_price: realPrice, // ✅ Uses Verified Price
        size,
        leverage,
        margin,
        status: 'open',
        stop_loss,
        take_profit,
        liquidation_price: liquidationPrice
      }]).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, trade }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ============================================================
    // ACTION: CLOSE TRADE
    // ============================================================
    if (action === 'close') {
      const { trade_id } = payload;

      // A. Fetch Trade Details
      const { data: trade } = await supabase.from('trades').select('*').eq('id', trade_id).single();
      
      // Security: Ensure the trade belongs to the user and is actually open
      if (!trade || trade.user_id !== user.id || trade.status !== 'open') {
        return new Response(JSON.stringify({ error: 'Invalid Trade or already closed' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // B. Fetch REAL Price from Binance
      const cleanSymbol = trade.symbol.replace('/', '');
      const priceRes = await fetch(`${BINANCE_API}?symbol=${cleanSymbol}`);
      const priceData = await priceRes.json();
      const realPrice = parseFloat(priceData.price);

      if (!realPrice) throw new Error('Failed to fetch verified market price');

      // C. Calculate PnL
      // Formula: (Price Diff / Entry Price) * Position Size
      let pnl = 0;
      if (trade.type === 'buy') {
         pnl = ((realPrice - trade.entry_price) / trade.entry_price) * trade.size;
      } else {
         pnl = ((trade.entry_price - realPrice) / trade.entry_price) * trade.size;
      }

      // Return amount = Initial Margin + Profit (or - Loss)
      const returnAmount = trade.margin + pnl;

      // D. Update DB
      // 1. Return funds to User Balance
      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
      await supabase.from('profiles').update({ balance: profile.balance + returnAmount }).eq('id', user.id);
      
      // 2. Close Trade
      await supabase.from('trades').update({ 
        status: 'closed', 
        exit_price: realPrice, 
        pnl: pnl, 
        closed_at: new Date().toISOString() 
      }).eq('id', trade_id);

      return new Response(JSON.stringify({ success: true, pnl, exit_price: realPrice }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})