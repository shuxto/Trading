import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';

// --- CONFIGURATION ---
// I put your key here correctly:
const TWELVE_DATA_API_KEY = "45f5dda259ed4218a790cda4807bf5a1"; 

export function useMarketData(symbol: string, interval: string, source: 'binance' | 'twelve') {
  const [candles, setCandles] = useState<{ time: Time; value: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);
  
  // Ref to prevent race conditions when switching assets quickly
  const symbolRef = useRef(symbol);

  useEffect(() => {
    symbolRef.current = symbol;
    setCandles([]); // Clear chart immediately on switch
    setCurrentPrice(null);

    // --- ENGINE A: BINANCE (Crypto) ---
    if (source === 'binance') {
      const fetchBinanceHistory = async () => {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`);
          const data = await res.json();
          if (Array.isArray(data) && symbolRef.current === symbol) {
            const formatted = data.map((d: any) => ({ time: (d[0] / 1000) as Time, value: parseFloat(d[4]) }));
            setCandles(formatted);
            const last = formatted[formatted.length - 1];
            setCurrentPrice(last.value);
            setLastCandleTime(last.time);
          }
        } catch (e) { console.error("Binance Error", e); }
      };
      
      fetchBinanceHistory();
      
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
      ws.onmessage = (event) => {
        if (symbolRef.current !== symbol) return;
        const d = JSON.parse(event.data);
        setCurrentPrice(parseFloat(d.p));
        setLastCandleTime(Math.floor(d.T / 1000) as Time);
      };
      return () => ws.close();
    }

    // --- ENGINE B: TWELVE DATA (Stocks, Forex, Gold) ---
    if (source === 'twelve') {
      const fetchTwelveData = async () => {
        try {
          // Map binance intervals to Twelve Data intervals (1m, 5m, 1h, 1day)
          const tdInterval = interval === '1d' ? '1day' : interval; 
          
          const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${tdInterval}&apikey=${TWELVE_DATA_API_KEY}&outputsize=100`);
          const data = await res.json();

          if (data.values && Array.isArray(data.values) && symbolRef.current === symbol) {
            // Twelve Data returns newest first, so we reverse it
            const formatted = data.values.reverse().map((d: any) => ({
              time: (new Date(d.datetime).getTime() / 1000) as Time,
              value: parseFloat(d.close)
            }));
            
            setCandles(formatted);
            const last = formatted[formatted.length - 1];
            setCurrentPrice(last.value);
            setLastCandleTime(last.time);
          } else {
             console.warn("Twelve Data Limit/Error:", data);
             // FALLBACK: If API limit reached or invalid key, show static mock price
             if (!currentPrice) setCurrentPrice(150.00); 
          }
        } catch (e) { console.error("Twelve Data Error", e); }
      };

      fetchTwelveData();
      
      // Poll every minute to save API credits (Free tier has limits)
      const intervalId = setInterval(fetchTwelveData, 60000); 
      return () => clearInterval(intervalId);
    }

  }, [symbol, interval, source]);

  return { candles, currentPrice, lastCandleTime };
}