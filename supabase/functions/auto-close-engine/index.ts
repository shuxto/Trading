// ✅ FIXED IMPORTS: No inline URLs, using the map from deno.json
import { createClient } from '@supabase/supabase-js'

// ✅ CONFIGURATION: Using Twelve Data to match your Trade Engine
const TWELVE_DATA_API = 'https://api.twelvedata.com/price';

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
    // 1. Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ✅ SECURE API KEY
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) throw new Error('Missing TWELVE_DATA_API_KEY env variable');

    const { action, payload } = await req.json()

    // ============================================================
    // 🚀 NEW PRO FEATURE: SCAN & AUTO-CLOSE (THE WATCHTOWER)
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
      // We use 'any' here, but it's allowed now because of deno.json
      const uniqueSymbols = [...new Set(openTrades.map((t: any) => t.symbol))];
      const closedTrades = [];

      // 3. Loop through symbols and check trades
      for (const symbol of uniqueSymbols) {
          // Fetch Real Price (Server Side)
          const priceRes = await fetch(`${TWELVE_DATA_API}?symbol=${symbol}&apikey=${apiKey}`);
          const priceData = await priceRes.json();
          const currentPrice = parseFloat(priceData.price);

          if (!currentPrice) continue; // Skip if API fails for this symbol

          // Check all trades for this symbol
          const tradesForSymbol = openTrades.filter((t: any) => t.symbol === symbol);

          for (const trade of tradesForSymbol) {
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

                  // Return Funds to Balance
                  const returnAmount = trade.margin + pnl;
                  
                  // Update Account Balance
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

                  // Close the Trade Record
                  await supabase.from('trades').update({ 
                      status: 'closed', 
                      exit_price: currentPrice, 
                      pnl: pnl, 
                      closed_at: new Date().toISOString() 
                  }).eq('id', trade.id);

                  closedTrades.push({ id: trade.id, reason, pnl });
              }
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