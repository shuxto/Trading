// scripts/broadcaster.js
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const TD_API_KEY = "05e7f5f30b384f11936a130f387c4092"; 
const SUPABASE_URL = "https://zqvvytgglralkoiuhqor.supabase.co"; 
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // ⚠️ Paste Key Here

// 🚀 YOU CAN ADD UP TO 1,500 SYMBOLS HERE
const SYMBOLS = [
    // --- CRYPTO (Top 20) ---
    "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "BNB/USD", "DOGE/USD", 
    "ADA/USD", "AVAX/USD", "MATIC/USD", "DOT/USD", "LTC/USD", "SHIB/USD",
    "TRX/USD", "LINK/USD", "XLM/USD", "ATOM/USD", "UNI/USD", "BCH/USD",

    // --- FOREX (Major Pairs) ---
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "AUD/USD", "USD/CHF", 
    "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY",

    // --- US STOCKS (Tech & Popular) ---
    "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "NFLX", 
    "AMD", "COIN", "GME", "AMC", "PLTR", "BABA", "INTC", "PYPL", "UBER",
    "DIS", "SBUX", "NKE", "KO", "PEP", "MCD", "V", "MA", "JPM", "BAC"
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let ws;
const channel = supabase.channel('market_prices');

function connect() {
    console.log(`[Tower] 📡 Connecting...`);
    ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TD_API_KEY}`);

    ws.on('open', () => {
        // This is where the magic happens. We subscribe to EVERYTHING at once.
        console.log(`[Tower] ✅ Connected! Subscribing to ${SYMBOLS.length} assets.`);
        console.log(`[Tower] ℹ️ (Capacity used: ${SYMBOLS.length} / 1500)`);
        
        ws.send(JSON.stringify({
            action: "subscribe",
            params: { symbols: SYMBOLS.join(',') }
        }));
    });

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.event === 'price') {
                // Broadcast to Supabase
                // Supabase can handle thousands of these per second.
                await channel.send({
                    type: 'broadcast',
                    event: 'price_update',
                    payload: { symbol: msg.symbol, price: parseFloat(msg.price) }
                });
                
                // Print minimal log so terminal doesn't freeze
                process.stdout.write(`\r[Tower] ⚡ Streaming ${SYMBOLS.length} Assets... Last: ${msg.symbol} ($${msg.price})   `);
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        console.log('\n[Tower] 🔴 Restarting...');
        setTimeout(connect, 2000);
    });
    
    ws.on('error', (err) => console.error('\n[Tower] Error:', err.message));
}

connect();