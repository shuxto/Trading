// scripts/broadcaster.js
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// ⚠️ YOUR KEYS (Make sure they are correct)
const TD_API_KEY = "05e7f5f30b384f11936a130f387c4092"; 
const SUPABASE_URL = "https://zqvvytgglralkoiuhqor.supabase.co"; 
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // <--- PASTE KEY HERE

// 🚀 TOP 50 ASSETS
const SYMBOLS = [
    "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "BNB/USD", "DOGE/USD", 
    "ADA/USD", "AVAX/USD", "MATIC/USD", "DOT/USD", "LTC/USD", "SHIB/USD",
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "AUD/USD", "USD/CHF", 
    "SPX", "NDX", "DJI", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", 
    "GOOGL", "META", "NFLX", "AMD", "COIN", "GME", "AMC"
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let ws;

// 1. SETUP SUPABASE FIRST
console.log("[Tower] 🟡 Connecting to Supabase...");
const channel = supabase.channel('market_prices');

channel.subscribe((status) => {
    // 2. ONLY CONNECT TO DATA WHEN SUPABASE IS READY
    if (status === 'SUBSCRIBED') {
        console.log('[Tower] 🟢 Supabase Ready! Connecting to Twelve Data...');
        connectTwelveData();
    }
});

function connectTwelveData() {
    if (ws) return; // Prevent double connection

    ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TD_API_KEY}`);

    ws.on('open', () => {
        console.log(`[Tower] ✅ Twelve Data Connected! Streaming ${SYMBOLS.length} assets.`);
        ws.send(JSON.stringify({
            action: "subscribe",
            params: { symbols: SYMBOLS.join(',') }
        }));
    });

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.event === 'price') {
                // Now this is safe because we KNOW Supabase is ready
                await channel.send({
                    type: 'broadcast',
                    event: 'price_update',
                    payload: { symbol: msg.symbol, price: parseFloat(msg.price) }
                });
                // process.stdout.write('.'); // Optional: Un-comment to see dots in logs
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        console.log('\n[Tower] 🔴 Twelve Data Disconnected. Restarting...');
        ws = null;
        setTimeout(connectTwelveData, 3000);
    });
    
    ws.on('error', (err) => console.error('\n[Tower] Error:', err.message));
}