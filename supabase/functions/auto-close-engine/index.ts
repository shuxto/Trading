// supabase/functions/auto-close-engine/index.ts

// ✅ FIX 1: Use the clean import name (mapped in deno.json)
import { createClient } from '@supabase/supabase-js'

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

    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) throw new Error('Missing TWELVE_DATA_API_KEY env variable');

    const { action, payload } = await req.json()

    // ============================================================
    // 🚀 ACTION: SCAN & AUTO-CLOSE (BATCH OPTIMIZED)
    // ============================================================
    if (action === 'scan_market') {
      
      // 1. Get ALL Open Trades
      const { data: openTrades, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'open');

      if (fetchError) throw fetchError;
      if (!openTrades || openTrades.length === 0) {
         return new Response(JSON.stringify({ message: 'No open trades to check' }), { 
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
         });
      }

      // 2. Get Unique Symbols
      const uniqueSymbols = [...new Set(openTrades.map((t: any) => t.symbol))];
      const closedTrades = [];

      // 3. ⚡ BATCH FETCH: Get all prices in ONE request
      const symbolString = uniqueSymbols.join(',');
      const priceRes = await fetch(`${TWELVE_DATA_API}?symbol=${symbolString}&apikey=${apiKey}`);
      const priceData = await priceRes.json();

      // Normalize Response
      // ✅ FIX 2: Use 'const' because we don't reassign the variable itself
      const pricesMap: Record<string, number> = {};

      if (uniqueSymbols.length === 1) {
          // Single symbol case
          if (priceData.price) {
              pricesMap[uniqueSymbols[0]] = parseFloat(priceData.price);
          }
      } else {
          // Multiple symbol case
          for (const sym of uniqueSymbols) {
              if (priceData[sym] && priceData[sym].price) {
                  pricesMap[sym] = parseFloat(priceData[sym].price);
              }
          }
      }

      // 4. Check Trades against the fetched prices
      for (const trade of openTrades) {
          const currentPrice = pricesMap[trade.symbol];

          // Skip if we failed to get a price for this specific symbol
          if (!currentPrice) continue;

          let shouldClose = false;
          let reason = '';

          // A. LIQUIDATION CHECK (Futures)
          if (trade.leverage > 1) {
              if (trade.type === 'buy' && currentPrice <= trade.liquidation_price) { shouldClose = true; reason = 'LIQUIDATION'; }
              if (trade.type === 'sell' && currentPrice >= trade.liquidation_price) { shouldClose = true; reason = 'LIQUIDATION'; }
          }

          // B. TAKE PROFIT CHECK
          if (trade.take_profit) {
              if (trade.type === 'buy' && currentPrice >= trade.take_profit) { shouldClose = true; reason = 'TAKE PROFIT'; }
              if (trade.type === 'sell' && currentPrice <= trade.take_profit) { shouldClose = true; reason = 'TAKE PROFIT'; }
          }

          // C. STOP LOSS CHECK
          if (trade.stop_loss) {
              if (trade.type === 'buy' && currentPrice <= trade.stop_loss) { shouldClose = true; reason = 'STOP LOSS'; }
              if (trade.type === 'sell' && currentPrice >= trade.stop_loss) { shouldClose = true; reason = 'STOP LOSS'; }
          }

          // D. EXECUTE CLOSE IF TRIGGERED
          if (shouldClose) {
              // Calculate PnL
              let pnl = 0;
              if (trade.type === 'buy') {
                  pnl = ((currentPrice - trade.entry_price) / trade.entry_price) * trade.size;
              } else {
                  pnl = ((trade.entry_price - currentPrice) / trade.entry_price) * trade.size;
              }

              const returnAmount = trade.margin + pnl;
              
              // Refund/Update Balance
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

              // Close Trade
              await supabase.from('trades').update({ 
                  status: 'closed', 
                  exit_price: currentPrice, 
                  pnl: pnl, 
                  closed_at: new Date().toISOString() 
              }).eq('id', trade.id);

              closedTrades.push({ id: trade.id, symbol: trade.symbol, reason, pnl });
          }
      }

      return new Response(JSON.stringify({ success: true, closed_count: closedTrades.length, details: closedTrades }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ============================================================
    // MANUAL CLOSE ACTION
    // ============================================================
    if (action === 'close') {
      const { trade_id } = payload;

      const authHeader = req.headers.get('Authorization')!
      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (authError || !user) throw new Error('Unauthorized');

      const { data: trade } = await supabase.from('trades').select('*').eq('id', trade_id).single();
      
      if (!trade || trade.user_id !== user.id || trade.status !== 'open') {
        throw new Error('Invalid Trade');
      }

      const priceRes = await fetch(`${TWELVE_DATA_API}?symbol=${trade.symbol}&apikey=${apiKey}`);
      const priceData = await priceRes.json();
      const realPrice = parseFloat(priceData.price);

      let pnl = 0;
      if (trade.type === 'buy') {
         pnl = ((realPrice - trade.entry_price) / trade.entry_price) * trade.size;
      } else {
         pnl = ((trade.entry_price - realPrice) / trade.entry_price) * trade.size;
      }

      const returnAmount = trade.margin + pnl;

      const { data: account } = await supabase.from('trading_accounts').select('balance').eq('id', trade.account_id).single();
      if (account) {
        await supabase.from('trading_accounts').update({ balance: account.balance + returnAmount }).eq('id', trade.account_id);
      }
      
      await supabase.from('trades').update({ 
        status: 'closed', 
        exit_price: realPrice, 
        pnl: pnl, 
        closed_at: new Date().toISOString() 
      }).eq('id', trade_id);

      return new Response(JSON.stringify({ success: true, pnl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})