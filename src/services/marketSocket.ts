// src/services/marketSocket.ts

// ⚠️ REPLACE WITH YOUR TWELVE DATA API KEY
const API_KEY = "05e7f5f30b384f11936a130f387c4092"; 

type PriceCallback = (price: number) => void;

class MarketSocket {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<PriceCallback>> = new Map();
  private activeSymbols: Set<string> = new Set();
  private connectionPromise: Promise<void> | null = null;
  private keepAliveInterval: any = null;

  // Connect ONLY once
  private connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${API_KEY}`);

      this.ws.onopen = () => {
        console.log("[Socket] 🟢 Connected (Singleton)");
        this.resubscribeAll();
        this.startKeepAlive();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'price' && data.symbol && data.price) {
            this.notify(data.symbol, parseFloat(data.price));
          }
        } catch (e) {
          console.error("Parse error", e);
        }
      };

      this.ws.onclose = () => {
        console.log("[Socket] 🔴 Closed");
        this.ws = null;
        this.connectionPromise = null;
        this.stopKeepAlive();
      };

      this.ws.onerror = (err) => {
        console.error("[Socket] ⚠️ Error", err);
        this.ws = null;
        this.connectionPromise = null;
        reject(err);
      };
    });

    return this.connectionPromise;
  }

  // Add a listener for a specific symbol
  public async subscribe(symbol: string, callback: PriceCallback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)?.add(callback);

    // If this is the first listener for this symbol, tell the server
    if (!this.activeSymbols.has(symbol)) {
      this.activeSymbols.add(symbol);
      await this.connect();
      this.send({ action: "subscribe", params: { symbols: symbol } });
    }
  }

  // Remove a listener
  public unsubscribe(symbol: string, callback: PriceCallback) {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(symbol);
        this.activeSymbols.delete(symbol);
        // Optional: Unsubscribe from server to save bandwidth
        // this.send({ action: "unsubscribe", params: { symbols: symbol } });
      }
    }
  }

  private send(msg: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private notify(symbol: string, price: number) {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(cb => cb(price));
    }
  }

  private resubscribeAll() {
    if (this.activeSymbols.size > 0) {
      const symbols = Array.from(this.activeSymbols).join(',');
      this.send({ action: "subscribe", params: { symbols } });
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: "heartbeat" }));
        }
    }, 10000); // Send heartbeat every 10s
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
  }
}

export const marketSocket = new MarketSocket();