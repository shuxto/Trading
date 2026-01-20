import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';
import { supabase } from '../lib/supabase'; 
import type { CandleData, ActiveAsset } from '../types';

export function useMarketData(asset: ActiveAsset, interval: string) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const assetRef = useRef(asset);
  // ⏱️ TRACKER: When was the last time we got a price?
  const lastUpdateRef = useRef<number>(Date.now()); 

  // 1. FETCH HISTORY (Standard Proxy Load)
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

  // 2. 📡 THE HYBRID RECEIVER (Radio + Backup)
  useEffect(() => {
    if (!asset.symbol) return;
    lastUpdateRef.current = Date.now(); // Reset timer on asset change

    // A. Listen to Radio (Preferred - Fast & Free)
    const channel = supabase.channel('market_prices');

    channel
      .on('broadcast', { event: 'price_update' }, (payload) => {
        const update = payload.payload;
        
        if (update.symbol === asset.symbol) {
            // We got a signal! Update the timer.
            lastUpdateRef.current = Date.now();
            
            const price = parseFloat(update.price);
            setCurrentPrice(price);

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
    })
    .subscribe();

    // B. Backup Poller (The "Safety Net")
    // Checks every 5 seconds. If Radio is silent, it asks the API manually.
    const backupInterval = setInterval(async () => {
        const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
        
        // If silence > 5 seconds, assume this is a "Rare Asset" and Poll API
        if (timeSinceLastUpdate > 5000) {
            // console.log(`[MarketData] Radio silent for ${asset.symbol}. Polling API...`);
            
            const { data } = await supabase.functions.invoke('market-proxy', {
                body: { endpoint: 'quote', params: { symbol: asset.symbol } }
            });

            if (data && (data.price || data.close)) {
                const price = parseFloat(data.price || data.close);
                setCurrentPrice(price);
                lastUpdateRef.current = Date.now(); // Reset timer
                
                // Update chart
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
        }
    }, 5000); // Check every 5s

    return () => {
        supabase.removeChannel(channel);
        clearInterval(backupInterval);
    };
  }, [asset.symbol]);

  return { candles, currentPrice, lastCandleTime, isLoading };
}