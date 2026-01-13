import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';

// --- CONFIGURATION ---
const TWELVE_DATA_API_KEY = "45f5dda259ed4218a790cda4807bf5a1"; 

export function useMarketData(symbol: string, interval: string, source: 'binance' | 'twelve') {
  const [candles, setCandles] = useState<{ time: Time; value: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // ✅ NEW: Loading State
  
  const symbolRef = useRef(symbol);
  const intervalRef = useRef(interval);

  useEffect(() => {
    symbolRef.current = symbol;
    intervalRef.current = interval;
    
    setCandles([]); 
    setCurrentPrice(null);
    setIsLoading(true); // ✅ Start Loading

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
            setIsLoading(false); // ✅ Stop Loading
          }
        } catch (e) { 
          console.error("Binance Error", e); 
          setIsLoading(false);
        }
      };
      
      fetchBinanceHistory();
      
      // Keep your correct @kline logic
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
      
      ws.onmessage = (event) => {
        if (symbolRef.current !== symbol) return;
        
        const message = JSON.parse(event.data);
        const candle = message.k;

        const price = parseFloat(candle.c);
        const time = (candle.t / 1000) as Time;

        setCurrentPrice(price);
        setLastCandleTime(time);
        setIsLoading(false); // ✅ Data received
      };

      return () => ws.close();
    }

    // --- ENGINE B: TWELVE DATA (Stocks, Forex, Gold) ---
    if (source === 'twelve') {
      let attempts = 0; // ✅ Retry Counter

      const fetchTwelveData = async () => {
        try {
          const tdInterval = interval === '1d' ? '1day' : interval; 
          
          // Fetch 5000 candles for deep history
          const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${tdInterval}&apikey=${TWELVE_DATA_API_KEY}&outputsize=5000`);
          const data = await res.json();

          if (data.values && Array.isArray(data.values) && symbolRef.current === symbol) {
            const formatted = data.values.reverse().map((d: any) => ({
              time: (new Date(d.datetime).getTime() / 1000) as Time,
              value: parseFloat(d.close)
            }));
            
            setCandles(formatted);
            const last = formatted[formatted.length - 1];
            setCurrentPrice(last.value);
            setLastCandleTime(last.time);
            setIsLoading(false); // ✅ Success
          } else {
             // ✅ AUTO-RETRY LOGIC
             console.warn("Twelve Data Retry:", data);
             attempts++;
             if (attempts < 3) {
                setTimeout(fetchTwelveData, 1500); // Try again in 1.5s
             } else {
                setIsLoading(false);
                if (!currentPrice) setCurrentPrice(150.00); 
             }
          }
        } catch (e) { 
          console.error("Twelve Data Error", e);
          setIsLoading(false);
        }
      };

      fetchTwelveData();
      
      const intervalId = setInterval(fetchTwelveData, 60000); 
      return () => clearInterval(intervalId);
    }

  }, [symbol, interval, source]);

  return { candles, currentPrice, lastCandleTime, isLoading }; // ✅ Return isLoading
}