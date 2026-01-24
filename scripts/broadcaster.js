// scripts/broadcaster.js (The FREE Version)
import { Server } from "socket.io";
import WebSocket from 'ws';

// 1. Create the Free Radio Station (Socket.io)
// This listens on the port Railway gives us
const io = new Server(process.env.PORT || 3000, {
  cors: { origin: "*" } // Allow your frontend to listen from anywhere
});

// ⚠️ KEEP YOUR EXISTING KEY
const TD_API_KEY = "05e7f5f30b384f11936a130f387c4092"; 

// Top 30 Assets (Same list as before)
const SYMBOLS = [
    "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "BNB/USD", "DOGE/USD", 
    "ADA/USD", "AVAX/USD", "MATIC/USD", "DOT/USD", "LTC/USD", "SHIB/USD",
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "AUD/USD", "USD/CHF", 
    "SPX", "NDX", "DJI", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", 
    "GOOGL", "META", "NFLX", "AMD", "COIN", "GME", "AMC"
];

console.log("[Tower] 🟡 Starting Radio Tower...");

let ws;

function connectTwelveData() {
    ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TD_API_KEY}`);

    ws.on('open', () => {
        console.log("[Tower] ✅ Connected to Market Source");
        ws.send(JSON.stringify({ action: "subscribe", params: { symbols: SYMBOLS.join(',') } }));
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.event === 'price') {
                // 🚀 THE FIX: Send to Socket.io (Free) instead of Supabase ($$$)
                // We transmit directly to the airwaves. No database involved.
                io.emit('price_update', { 
                    symbol: msg.symbol, 
                    price: parseFloat(msg.price) 
                });
            }
        } catch (e) {
            // Ignore heartbeat messages
        }
    });

    ws.on('close', () => {
        console.log('[Tower] 🔴 Source Closed. Reconnecting...');
        setTimeout(connectTwelveData, 3000);
    });
    
    ws.on('error', (err) => console.error('[Tower] Error:', err.message));
}

connectTwelveData();
console.log("🚀 Broadcasting Live on Port " + (process.env.PORT || 3000));