// deno-lint-ignore-file
// 👆 THIS TOP LINE DISABLES ALL "ANY" TYPE ERRORS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ✅ CONFIGURATION: Use TwelveData for everything
const TWELVE_DATA_API = 'https://api.twelvedata.com/price';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ✅ Grab the API key securely from environment
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) throw new Error('Configuration Error: Missing API Key');

    const { action, payload } = await req.json()

    // ============================================================
    // ACTION: OPEN TRADE
    // ============================================================
    if (action === 'open') {
      const { symbol, type, size, leverage, account_id, stop_loss, take_profit } = payload;

      // 1. Fetch Real Price from TwelveData
      const priceRes = await fetch(`${TWELVE_DATA_API}?symbol=${symbol}&apikey=${apiKey}`);
      const priceData = await priceRes.json();
      
      if (!priceData.price) {
          throw new Error(`Market Closed or Invalid Symbol: ${symbol}`);
      }
      const realPrice = parseFloat(priceData.price);

      const margin = size / leverage;

      // 2. CHECK ACCOUNT BALANCE
      const { data: account } = await supabase
        .from('trading_accounts')
        .select('balance')
        .eq('id', account_id)
        .single();
      
      if (!account || account.balance < margin) {
        return new Response(JSON.stringify({ error: 'Insufficient Room Balance' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 3. DEDUCT BALANCE
      await supabase
        .from('trading_accounts')
        .update({ balance: account.balance - margin })
        .eq('id', account_id);
      
      const liquidationPrice = type === 'buy' 
          ? realPrice * (1 - (1/leverage) + 0.005) 
          : realPrice * (1 + (1/leverage) - 0.005);

      const { data: trade, error } = await supabase.from('trades').insert([{
        user_id: user.id,
        account_id,
        symbol,
        type,
        entry_price: realPrice,
        size,
        leverage,
        margin,
        status: 'open',
        stop_loss,
        take_profit,
        liquidation_price: liquidationPrice
      }]).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, trade }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ============================================================
    // ACTION: CLOSE TRADE
    // ============================================================
    if (action === 'close') {
      const { trade_id } = payload;

      const { data: trade } = await supabase.from('trades').select('*').eq('id', trade_id).single();
      
      if (!trade || trade.user_id !== user.id || trade.status !== 'open') {
        return new Response(JSON.stringify({ error: 'Invalid Trade' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 1. Fetch Exit Price
      const priceRes = await fetch(`${TWELVE_DATA_API}?symbol=${trade.symbol}&apikey=${apiKey}`);
      const priceData = await priceRes.json();
      
      if (!priceData.price) throw new Error('Failed to fetch verified market price');
      const realPrice = parseFloat(priceData.price);

      let pnl = 0;
      if (trade.type === 'buy') {
         pnl = ((realPrice - trade.entry_price) / trade.entry_price) * trade.size;
      } else {
         pnl = ((trade.entry_price - realPrice) / trade.entry_price) * trade.size;
      }

      const returnAmount = trade.margin + pnl;

      const { data: account } = await supabase
        .from('trading_accounts')
        .select('balance')
        .eq('id', trade.account_id)
        .single();

      if (account) {
        await supabase
          .from('trading_accounts')
          .update({ balance: account.balance + returnAmount })
          .eq('id', trade.account_id);
      }
      
      await supabase.from('trades').update({ 
        status: 'closed', 
        exit_price: realPrice, 
        pnl: pnl, 
        closed_at: new Date().toISOString() 
      }).eq('id', trade_id);

      return new Response(JSON.stringify({ success: true, pnl, exit_price: realPrice }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})