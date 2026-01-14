import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';
import type { CandleData } from '../types';

// --- CONFIGURATION ---
const TWELVE_DATA_API_KEY = "45f5dda259ed4218a790cda4807bf5a1"; 

export function useMarketData(symbol: string, interval: string, source: 'binance' | 'twelve') {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const symbolRef = useRef(symbol);
  const intervalRef = useRef(interval);

  useEffect(() => {
    symbolRef.current = symbol;
    intervalRef.current = interval;
    
    setCandles([]); 
    setCurrentPrice(null);
    setIsLoading(true);

    // --- ENGINE A: BINANCE (Crypto) ---
    if (source === 'binance') {
      const fetchBinanceHistory = async () => {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`);
          const data = await res.json();
          if (Array.isArray(data) && symbolRef.current === symbol) {
            const formatted: CandleData[] = data.map((d: any) => ({ 
              time: (d[0] / 1000) as Time, 
              open: parseFloat(d[1]),
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close: parseFloat(d[4]),
              volume: parseFloat(d[5]) // ✅ Capture Volume
            }));

            setCandles(formatted);
            const last = formatted[formatted.length - 1];
            setCurrentPrice(last.close);
            setLastCandleTime(last.time);
            setIsLoading(false);
          }
        } catch (e) { 
          console.error("Binance Error", e); 
          setIsLoading(false);
        }
      };
      
      fetchBinanceHistory();
      
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
      
      ws.onmessage = (event) => {
        if (symbolRef.current !== symbol) return;
        
        const message = JSON.parse(event.data);
        const candle = message.k;

        const price = parseFloat(candle.c);
        const time = (candle.t / 1000) as Time;
        const volume = parseFloat(candle.v); // ✅ Capture Volume

        setCurrentPrice(price);
        setLastCandleTime(time);
        
        setCandles(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.time === time) {
            return [...prev.slice(0, -1), { 
               ...last, 
               close: price,
               high: Math.max(last.high, price),
               low: Math.min(last.low, price),
               volume: last.volume ? last.volume + volume : volume // Accumulate volume if same candle
            }];
          } else {
             // We don't append new candle here to avoid flicker, usually chart handles it via ticks
             // But for completeness in state:
             return prev;
          }
        });

        setIsLoading(false);
      };

      return () => ws.close();
    }

    // --- ENGINE B: TWELVE DATA (Stocks, Forex, Gold) ---
    if (source === 'twelve') {
      let attempts = 0;

      const fetchTwelveData = async () => {
        try {
          const tdInterval = interval === '1d' ? '1day' : interval; 
          
          const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${tdInterval}&apikey=${TWELVE_DATA_API_KEY}&outputsize=5000`);
          const data = await res.json();

          if (data.values && Array.isArray(data.values) && symbolRef.current === symbol) {
            const formatted: CandleData[] = data.values.reverse().map((d: any) => ({
              time: (new Date(d.datetime).getTime() / 1000) as Time,
              open: parseFloat(d.open),
              high: parseFloat(d.high),
              low: parseFloat(d.low),
              close: parseFloat(d.close),
              volume: parseFloat(d.volume || '0') // ✅ Capture Volume (handle missing)
            }));
            
            setCandles(formatted);
            const last = formatted[formatted.length - 1];
            setCurrentPrice(last.close);
            setLastCandleTime(last.time);
            setIsLoading(false);
          } else {
             console.warn("Twelve Data Retry:", data);
             attempts++;
             if (attempts < 3) {
               setTimeout(fetchTwelveData, 1500);
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

  return { candles, currentPrice, lastCandleTime, isLoading };
}