import { useEffect, useState, useRef } from 'react';
import { type Time } from 'lightweight-charts';
import { supabase } from '../lib/supabase'; // ✅ Imported Supabase
import type { CandleData, ActiveAsset } from '../types';

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
    // UNIFIED ENGINE: VIA SECURE PROXY
    // ==========================================
    
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

        // Check if Crypto
        const isCrypto = (asset as any).type === 'crypto' || 
                         (asset.symbol.includes('/') && !asset.symbol.includes('USD') && !asset.symbol.includes('EUR'));

        let data;

        if (isCrypto) {
            // TRY 1: Attempt to fetch from BINANCE (via Proxy) to get VOLUME
            const { data: binanceData, error: binanceError } = await supabase.functions.invoke('market-proxy', {
                body: {
                    endpoint: 'time_series',
                    params: {
                        symbol: asset.symbol,
                        interval: tdInterval,
                        outputsize: '5000',
                        exchange: 'binance' // Request Binance data
                    }
                }
            });

            if (!binanceError && binanceData && binanceData.values) {
                data = binanceData;
            } else {
                console.warn("Binance data missing or error, falling back to Composite feed...");
                // TRY 2: Fallback to COMPOSITE (via Proxy)
                const { data: compositeData, error: compositeError } = await supabase.functions.invoke('market-proxy', {
                    body: {
                        endpoint: 'time_series',
                        params: {
                            symbol: asset.symbol,
                            interval: tdInterval,
                            outputsize: '5000'
                        }
                    }
                });
                if (compositeError) throw compositeError;
                data = compositeData;
            }
        } else {
            // Standard fetch for Stocks/Forex (via Proxy)
            const { data: stockData, error: stockError } = await supabase.functions.invoke('market-proxy', {
                body: {
                    endpoint: 'time_series',
                    params: {
                        symbol: asset.symbol,
                        interval: tdInterval,
                        outputsize: '5000'
                    }
                }
            });
            if (stockError) throw stockError;
            data = stockData;
        }

        if (data && data.values && Array.isArray(data.values)) {
          // Check if we are still looking at the same asset (avoid race condition)
          if (assetRef.current.symbol !== asset.symbol) return;

          const formatted: CandleData[] = data.values.reverse().map((d: any) => {
            // Force UTC
            const utcDate = new Date(d.datetime + "Z");

            return {
              time: (utcDate.getTime() / 1000) as Time,
              open: parseFloat(d.open),
              high: parseFloat(d.high),
              low: parseFloat(d.low),
              close: parseFloat(d.close),
              volume: parseFloat(d.volume || '0')
            };
          });

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
        console.error("Data Fetch Error", e);
        setIsLoading(false);
      }
    };

    fetchHistory();

    // 2. Real-Time WebSocket (DISABLED FOR SECURITY)
    // To re-enable this securely, we need a backend relay or token system.
    // For now, charts will update on refresh or timeframe change.
    
    /* const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVE_DATA_API_KEY}`);

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
    */

  }, [asset, interval]);

  return { candles, currentPrice, lastCandleTime, isLoading };
}