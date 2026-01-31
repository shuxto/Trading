// scripts/broadcaster.js (The "Smart Executioner" Version)
import { createServer } from "http";
import { Server } from "socket.io";
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// ⚠️ Ensure these are set in your Railway Environment Variables!
const SUPABASE_URL = process.env.SUPABASE_URL; 
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const TD_API_KEY = "05e7f5f30b384f11936a130f387c4092"; // Keep your existing key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("🚨 CRITICAL: Missing Supabase Keys in Environment Variables!");
    process.exit(1);
}

// Initialize Supabase Admin Client (Bypasses RLS to close trades)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 1. Create HTTP Server
const httpServer = createServer((req, res) => {
  res.writeHead(200);
  res.end("Smart Radio Tower is Online 🟢");
});

// 2. Attach Socket.io (Frontend Connection)
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- 🧠 THE BRAIN: MEMORY STORAGE ---
// We keep all open trades in RAM for instant access (0ms latency lookup)
let activeTrades = new Map(); 


// ✅ UPDATED: Exact match with src/constants/assets.ts (104 Assets)
// Your Pro Plan allows 500 connections. We are using 104. You are SAFE.
const SYMBOLS = [
    // 1. CRYPTO (35)
    "BTC/USD", "ETH/USD", "SOL/USD", "BNB/USD", "XRP/USD", "ADA/USD", "DOGE/USD", 
    "AVAX/USD", "DOT/USD", "LINK/USD", "MATIC/USD", "LTC/USD", "UNI/USD", "TRX/USD", 
    "SHIB/USD", "ETC/USD", "NEAR/USD", "ATOM/USD", "XLM/USD", "BCH/USD", "ALGO/USD", 
    "FIL/USD", "VET/USD", "ICP/USD", "GRT/USD", "AAVE/USD", "SAND/USD", "MANA/USD", 
    "AXS/USD", "EOS/USD", "THETA/USD", "RUNE/USD", "KSM/USD", "EGLD/USD", "XTZ/USD",

    // 2. STOCKS (30)
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "NFLX", "AMD", "INTC", 
    "CRM", "ADBE", "PYPL", "UBER", "ABNB", "COIN", "PLTR", "JPM", "V", "MA", "WMT", 
    "KO", "PEP", "MCD", "NKE", "TSM", "ASML", "BABA", "SONY", "TM",

    // 3. FOREX (22)
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD", 
    "EUR/GBP", "EUR/JPY", "EUR/CHF", "GBP/JPY", "GBP/AUD", "GBP/CAD", "AUD/JPY", 
    "AUD/CAD", "CAD/JPY", "CHF/JPY", "USD/SGD", "USD/HKD", "USD/ZAR", "USD/MXN", "USD/TRY",

    // 4. SMART INDICES / ETFs (5)
    "SPY", "QQQ", "DIA", "DAX", "EWU",

    // 5. COMMODITIES (12)
    "XAU/USD", "XAG/USD", "XPT/USD", "XPD/USD", "XCU/USD", "WTI", "BRENT", "NG", 
    "CORN", "WEAT", "SOYB", "CANE"
];

console.log("[Tower] 🟡 Starting Smart Tower...");

// --- STEP A: LOAD THE BRAIN ---
async function loadOpenTrades() {
    console.log("[Tower] 🧠 Downloading Active Orders...");
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'open');

    if (error) {
        console.error("[Tower] 🔴 Failed to load trades:", error.message);
        return;
    }

    // Store in Memory
    data.forEach(trade => {
        activeTrades.set(trade.id, trade);
    });
    console.log(`[Tower] ✅ Loaded ${activeTrades.size} Active Trades into Memory.`);
}

// --- STEP B: KEEP BRAIN SYNCED (Realtime) ---
function subscribeToTradeUpdates() {
    supabase
        .channel('system-trade-watcher')
        .on(
            'postgres_changes', 
            { event: '*', schema: 'public', table: 'trades' }, 
            (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;

                if (eventType === 'INSERT' && newRecord.status === 'open') {
                    console.log(`[Tower] 🆕 New Trade Detected: #${newRecord.id} (${newRecord.symbol})`);
                    activeTrades.set(newRecord.id, newRecord);
                } 
                else if (eventType === 'UPDATE') {
                    if (newRecord.status === 'closed') {
                        activeTrades.delete(newRecord.id);
                    } else {
                        activeTrades.set(newRecord.id, newRecord); // Update SL/TP changes
                    }
                } 
                else if (eventType === 'DELETE') {
                    activeTrades.delete(oldRecord.id);
                }
            }
        )
        .subscribe();
    console.log("[Tower] 👀 Watching for New Orders...");
}

// --- STEP C: EXECUTE (The Killer) ---
async function closeTrade(trade, currentPrice, reason) {
    // 1. Remove from memory immediately to prevent double-closing
    activeTrades.delete(trade.id);
    
    console.log(`[Tower] ⚡ EXECUTING CLOSE: #${trade.id} | Reason: ${reason} | Price: ${currentPrice}`);

    try {
        // 2. Calculate PnL
        let pnl = 0;
        if (trade.type === 'buy') {
            pnl = ((currentPrice - trade.entry_price) / trade.entry_price) * trade.size;
        } else {
            pnl = ((trade.entry_price - currentPrice) / trade.entry_price) * trade.size;
        }

        // 3. Calculate Refund (Margin + PnL)
        // Note: PnL can be negative, so we subtract loss from margin
        const returnAmount = trade.margin + pnl;

        // 4. Update Account Balance
        // We fetch the latest balance first to be safe
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

        // 5. Mark Trade as Closed in DB
        const { error } = await supabase
            .from('trades')
            .update({ 
                status: 'closed', 
                exit_price: currentPrice, 
                pnl: pnl, 
                closed_at: new Date().toISOString() 
            })
            .eq('id', trade.id);

        if (!error) {
            console.log(`[Tower] ✅ Trade #${trade.id} Liquidated/Closed Successfully.`);
            // Optional: Tell frontend to refresh
            io.emit('trade_closed', { id: trade.id, pnl, reason });
        } else {
            console.error(`[Tower] 🔴 DB Error closing trade #${trade.id}:`, error.message);
        }

    } catch (err) {
        console.error(`[Tower] ☠️ CRITICAL ERROR closing trade #${trade.id}:`, err);
    }
}

// --- STEP D: MARKET CONNECTION ---
let ws;
function connectTwelveData() {
    ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TD_API_KEY}`);

    ws.on('open', () => {
        console.log("[Tower] 📡 Connected to Market Source");
        ws.send(JSON.stringify({ action: "subscribe", params: { symbols: SYMBOLS.join(',') } }));
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.event === 'price') {
                const currentPrice = parseFloat(msg.price);
                const symbol = msg.symbol;

                // 1. Broadcast to Frontend (The "Shouter" job)
                io.emit('price_update', { symbol: symbol, price: currentPrice });

                // 2. CHECK TRADES (The "Brain" job)
                // We loop through our memory Map. This is extremely fast.
                for (const [id, trade] of activeTrades.entries()) {
                    if (trade.symbol !== symbol) continue; // Skip mismatching symbols

                    // A. LIQUIDATION CHECK
                    if (trade.liquidation_price && trade.liquidation_price > 0) {
                        if (trade.type === 'buy' && currentPrice <= trade.liquidation_price) {
                            closeTrade(trade, currentPrice, 'LIQUIDATION');
                            continue;
                        }
                        if (trade.type === 'sell' && currentPrice >= trade.liquidation_price) {
                            closeTrade(trade, currentPrice, 'LIQUIDATION');
                            continue;
                        }
                    }

                    // B. STOP LOSS CHECK
                    if (trade.stop_loss) {
                        if (trade.type === 'buy' && currentPrice <= trade.stop_loss) {
                            closeTrade(trade, currentPrice, 'STOP_LOSS');
                            continue;
                        }
                        if (trade.type === 'sell' && currentPrice >= trade.stop_loss) {
                            closeTrade(trade, currentPrice, 'STOP_LOSS');
                            continue;
                        }
                    }

                    // C. TAKE PROFIT CHECK
                    if (trade.take_profit) {
                        if (trade.type === 'buy' && currentPrice >= trade.take_profit) {
                            closeTrade(trade, currentPrice, 'TAKE_PROFIT');
                            continue;
                        }
                        if (trade.type === 'sell' && currentPrice <= trade.take_profit) {
                            closeTrade(trade, currentPrice, 'TAKE_PROFIT');
                            continue;
                        }
                    }
                }
            }
        } catch (e) { 
            // Ignore parse errors
        }
    });

    ws.on('close', () => {
        console.log('[Tower] 🔴 Source Closed. Reconnecting...');
        setTimeout(connectTwelveData, 3000);
    });
    
    ws.on('error', (err) => console.error('[Tower] Error:', err.message));
}

// --- BOOT UP ---
(async () => {
    await loadOpenTrades();        // Load Memory
    subscribeToTradeUpdates();     // Keep Memory Fresh
    connectTwelveData();           // Start Listening
})();

const PORT = process.env.PORT || 3000; 
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Smart Tower Active on Port ${PORT}`);
});