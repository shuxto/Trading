// scripts/broadcaster.js (The ROBUST Version)
import { createServer } from "http";
import { Server } from "socket.io";
import WebSocket from 'ws';

// 1. Create a basic HTTP Server
// This is required for Railway to "see" your app correctly
const httpServer = createServer((req, res) => {
  res.writeHead(200);
  res.end("Radio Tower is Online 🟢");
});

// 2. Attach Socket.io to that HTTP Server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow connections from ANYWHERE (voidnet.app, localhost, etc.)
    methods: ["GET", "POST"]
  }
});

// ⚠️ YOUR KEY
const TD_API_KEY = "05e7f5f30b384f11936a130f387c4092"; 

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

// 3. LISTEN on 0.0.0.0 (Important for Railway!)
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Broadcasting Live on Port ${PORT}`);
});