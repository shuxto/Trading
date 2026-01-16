import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';
import type { CandleData, ActiveAsset } from '../types';

// ✅ API Key
const TWELVE_DATA_API_KEY = "05e7f5f30b384f11936a130f387c4092"; 

export function useMarketData(asset: ActiveAsset, interval: string) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const assetRef = useRef(asset);
  const intervalRef = useRef(interval);

  useEffect(() => {
    assetRef.current = asset;
    intervalRef.current = interval;
    
    setCandles([]); 
    setCurrentPrice(null);
    setIsLoading(true);

    // ==========================================
    // UNIFIED ENGINE: TWELVE DATA (For Everything)
    // ==========================================
    
    // 1. Fetch History (REST API)
    const fetchHistory = async () => {
      try {
        const intervalMap: Record<string, string> = {
          '1m': '1min',
          '5m': '5min',
          '15m': '15min',
          '1h': '1h',
          '4h': '4h',
          '1d': '1day',
        };
        
        const tdInterval = intervalMap[interval] || '1day';
        
        // Base URL
        const baseUrl = `https://api.twelvedata.com/time_series?symbol=${asset.symbol}&interval=${tdInterval}&apikey=${TWELVE_DATA_API_KEY}&outputsize=5000`;

        // Check if Crypto (by type or symbol)
        // We cast to 'any' because 'type' might be missing on the initial load default asset
        const isCrypto = (asset as any).type === 'crypto' || 
                         (asset.symbol.includes('/') && !asset.symbol.includes('USD') && !asset.symbol.includes('EUR'));

        let data;

        if (isCrypto) {
            // 🛑 TRY 1: Attempt to fetch from BINANCE to get VOLUME
            try {
                const res = await fetch(`${baseUrl}&exchange=binance`);
                data = await res.json();
            } catch (e) {
                data = { code: 400 }; // Force fallback on network error
            }

            // 🛑 TRY 2: If Binance failed (no values), Fallback to COMPOSITE (No Volume, but working Price)
            if (!data.values) {
                console.warn("Binance data missing, falling back to Composite feed...");
                const res = await fetch(baseUrl);
                data = await res.json();
            }
        } else {
            // Standard fetch for Stocks/Forex
            const res = await fetch(baseUrl);
            data = await res.json();
        }

        if (data.values && Array.isArray(data.values) && assetRef.current.symbol === asset.symbol) {
          const formatted: CandleData[] = data.values.reverse().map((d: any) => ({
            time: (new Date(d.datetime).getTime() / 1000) as Time,
            open: parseFloat(d.open),
            high: parseFloat(d.high),
            low: parseFloat(d.low),
            close: parseFloat(d.close),
            // Use 0 if volume is missing (Composite feed)
            volume: parseFloat(d.volume || '0')
          }));
          
          setCandles(formatted);
          const last = formatted[formatted.length - 1];
          setCurrentPrice(last.close);
          setLastCandleTime(last.time);
          setIsLoading(false);
        } else {
           console.warn("Twelve Data History Error:", data);
           setIsLoading(false);
        }
      } catch (e) { 
        console.error("Twelve Data Error", e);
        setIsLoading(false);
      }
    };

    fetchHistory();

    // 2. Real-Time WebSocket
    const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVE_DATA_API_KEY}`);

    ws.onopen = () => {
      if (assetRef.current.symbol === asset.symbol) {
          ws.send(JSON.stringify({
              action: "subscribe",
              params: { symbols: asset.symbol }
          }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'price' && data.symbol === asset.symbol && assetRef.current.symbol === asset.symbol) {
            const price = parseFloat(data.price);
            setCurrentPrice(price);
            
            // Update the last candle in real-time
            setCandles(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), {
                   ...last,
                   close: price,
                   high: Math.max(last.high, price),
                   low: Math.min(last.low, price)
                }];
            });
        }
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    return () => ws.close();

  }, [asset, interval]);

  return { candles, currentPrice, lastCandleTime, isLoading };
}