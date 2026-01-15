// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';

Deno.serve(async (req) => {
  try {
    // 1. Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch all OPEN trades
    const { data: openTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('status', 'open');

    if (error || !openTrades || openTrades.length === 0) {
      return new Response('No open trades to check.', { status: 200 });
    }

    // 3. Get Unique Symbols to minimize API calls (e.g., BTC/USDT)
    const uniqueSymbols = [...new Set(openTrades.map(t => t.symbol))];

    // 4. Fetch Current Prices from Binance
    const priceMap: Record<string, number> = {};
    
    await Promise.all(uniqueSymbols.map(async (symbol) => {
      try {
        const cleanSymbol = symbol.replace('/', '');
        const res = await fetch(`${BINANCE_API}?symbol=${cleanSymbol}`); 
        const data = await res.json();
        if (data.price) priceMap[symbol] = parseFloat(data.price);
      } catch (err) {
        console.error(`Failed to fetch price for ${symbol}`);
      }
    }));

    // 5. Evaluate every open trade
    const closePromises = openTrades.map(async (trade) => {
      const currentPrice = priceMap[trade.symbol];
      if (!currentPrice) return; 

      let shouldClose = false;

      // A. Check Take Profit
      if (trade.take_profit) {
        if (trade.type === 'buy' && currentPrice >= trade.take_profit) shouldClose = true;
        if (trade.type === 'sell' && currentPrice <= trade.take_profit) shouldClose = true;
      }

      // B. Check Stop Loss
      if (trade.stop_loss) {
        if (trade.type === 'buy' && currentPrice <= trade.stop_loss) shouldClose = true;
        if (trade.type === 'sell' && currentPrice >= trade.stop_loss) shouldClose = true;
      }

      // C. Check Liquidation
      if (trade.liquidation_price) {
         if (trade.type === 'buy' && currentPrice <= trade.liquidation_price) shouldClose = true;
         if (trade.type === 'sell' && currentPrice >= trade.liquidation_price) shouldClose = true;
      }

      // 6. Execute Close via the secure Database Function (RPC)
      if (shouldClose) {
        console.log(`⚡ AUTO-CLOSING trade ${trade.id} at price ${currentPrice}`);
        await supabase.rpc('close_trade_position', { 
           p_trade_id: trade.id, 
           p_exit_price: currentPrice 
        });
      }
    });

    await Promise.all(closePromises);

    return new Response('Auto-close check complete', { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})