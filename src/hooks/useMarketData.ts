import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';
import { supabase } from '../lib/supabase'; 
import { io } from "socket.io-client"; // 👈 New Import
import type { CandleData, ActiveAsset } from '../types';

// ⚠️ STEP 5: Railway URL here later
const RAILWAY_URL = "https://trading-production-169d.up.railway.app"; 

export function useMarketData(asset: ActiveAsset, interval: string) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const assetRef = useRef(asset);

  // 1. FETCH HISTORY (Keep this - it loads past candles from Supabase)
  // This is safe because it only runs ONCE per asset load.
  useEffect(() => {
    assetRef.current = asset;
    setCandles([]); 
    setCurrentPrice(null);
    setIsLoading(true);

    const fetchHistory = async () => {
      try {
        const intervalMap: Record<string, string> = {
          '1m': '1min', '5m': '5min', '15m': '15min', '1h': '1h', '4h': '4h', '1d': '1day',
        };
        const tdInterval = intervalMap[interval] || '1day';
        const isCrypto = (asset as any).type === 'crypto' || (asset.symbol.includes('/') && !asset.symbol.includes('USD'));

        const { data, error } = await supabase.functions.invoke('market-proxy', {
             body: { endpoint: 'time_series', params: { symbol: asset.symbol, interval: tdInterval, outputsize: '5000', exchange: isCrypto ? 'binance' : undefined } }
        });

        if (error) throw error;
        
        let validData = data;
        if (isCrypto && (!data || !data.values)) {
             const { data: compData } = await supabase.functions.invoke('market-proxy', {
                 body: { endpoint: 'time_series', params: { symbol: asset.symbol, interval: tdInterval, outputsize: '5000' } }
             });
             validData = compData;
        }

        if (validData && validData.values) {
          if (assetRef.current.symbol !== asset.symbol) return;

          const formatted: CandleData[] = validData.values.reverse().map((d: any) => ({
             time: (new Date(d.datetime + "Z").getTime() / 1000) as Time,
             open: parseFloat(d.open), high: parseFloat(d.high), low: parseFloat(d.low), close: parseFloat(d.close), volume: parseFloat(d.volume || '0')
          }));

          setCandles(formatted);
          const last = formatted[formatted.length - 1];
          setCurrentPrice(last.close);
          setLastCandleTime(last.time);
          setIsLoading(false);
        } else {
           setIsLoading(false);
        }
      } catch (e) { 
        console.error(e);
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [asset, interval]);

  // 2. 📡 THE NEW FREE RECEIVER (Socket.io)
  // This replaces the old 'supabase.channel' code
  useEffect(() => {
    if (!asset.symbol) return;

    // Connect to new Railway Radio
    const socket = io(RAILWAY_URL);

    socket.on('connect', () => {
        console.log("✅ Connected to Free Price Radio");
    });

    socket.on('price_update', (update: any) => {
        // Only update if the price is for the symbol we are currently looking at
        if (update.symbol === asset.symbol) {
            const price = update.price;
            setCurrentPrice(price);

            // Optimistic Chart Update (Make the candle move live)
            setCandles(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                setLastCandleTime(last.time);

                return [...prev.slice(0, -1), {
                    ...last,
                    close: price,
                    high: Math.max(last.high, price),
                    low: Math.min(last.low, price)
                }];
            });
        }
    });

    return () => {
        socket.disconnect(); // Clean up when you leave the page
    };
  }, [asset.symbol]);

  return { candles, currentPrice, lastCandleTime, isLoading };
}