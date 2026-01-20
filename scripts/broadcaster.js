// scripts/broadcaster.js
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// 🛑 DOUBLE CHECK THESE ARE REAL KEYS
const TD_API_KEY = "05e7f5f30b384f11936a130f387c4092"; 
const SUPABASE_URL = "https://zqvvytgglralkoiuhqor.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdnZ5dGdnbHJhbGtvaXVocW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mzk0ODcsImV4cCI6MjA4MzMxNTQ4N30.3Kx0bJUcy_IK-7EPhgvl_c8moLmJhbarqQtB246etqk"; // <--- ⚠️  HERE!!!

// Top 30 Assets
const SYMBOLS = [
    "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "BNB/USD", "DOGE/USD", 
    "ADA/USD", "AVAX/USD", "MATIC/USD", "DOT/USD", "LTC/USD", "SHIB/USD",
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "AUD/USD", "USD/CHF", 
    "SPX", "NDX", "DJI", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", 
    "GOOGL", "META", "NFLX", "AMD", "COIN", "GME", "AMC"
];

if (SUPABASE_KEY.includes("YOUR_SUPABASE")) {
    console.error("❌ CRITICAL ERROR: You forgot to paste the Supabase Key!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let ws;

console.log("[Tower] 🟡 Attempting to connect to Supabase...");

const channel = supabase.channel('market_prices');

channel.subscribe((status, err) => {
    // 🔍 LOG EVERY STATUS CHANGE
    console.log(`[Tower] Supabase Status Change: ${status}`);

    if (status === 'SUBSCRIBED') {
        console.log('[Tower] 🟢 Supabase Ready! Connecting to Twelve Data...');
        connectTwelveData();
    } 
    
    if (status === 'CHANNEL_ERROR') {
        console.error(`[Tower] 🔴 Supabase Connection Failed. Error:`, err);
        console.error(`[Tower] ⚠️ CHECK YOUR SUPABASE KEY.`);
    }

    if (status === 'TIMED_OUT') {
        console.error(`[Tower] 🔴 Supabase Timed Out. Retrying...`);
    }
});

function connectTwelveData() {
    if (ws) return;
    ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TD_API_KEY}`);

    ws.on('open', () => {
        console.log(`[Tower] ✅ Twelve Data Connected! Streaming...`);
        ws.send(JSON.stringify({ action: "subscribe", params: { symbols: SYMBOLS.join(',') } }));
    });

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.event === 'price') {
                await channel.send({
                    type: 'broadcast',
                    event: 'price_update',
                    payload: { symbol: msg.symbol, price: parseFloat(msg.price) }
                });
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        console.log('[Tower] 🔴 Twelve Data Closed. Reconnecting in 3s...');
        ws = null;
        setTimeout(connectTwelveData, 3000);
    });
    
    ws.on('error', (err) => console.error('[Tower] Twelve Data Error:', err.message));
}