import { useEffect, useState } from 'react';
// REMOVED: useRef import
import { type Time } from 'lightweight-charts';

export function useBinanceData(interval: string) {
  const [candles, setCandles] = useState<{ time: Time; value: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastCandleTime, setLastCandleTime] = useState<Time | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=1000`);
        const data = await res.json();
        
        const formattedData = data.map((d: any) => ({
          time: (d[0] / 1000) as Time,
          value: parseFloat(d[4]),
        }));

        setCandles(formattedData);
        
        const last = formattedData[formattedData.length - 1];
        setCurrentPrice(last.value);
        setLastCandleTime(last.time);
      } catch (error) {
        console.error("Binance API Error:", error);
      }
    };

    fetchHistory();

    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    
    ws.onmessage = (event) => {
      const d = JSON.parse(event.data);
      const price = parseFloat(d.p);
      const time = Math.floor(d.T / 1000) as Time;

      setCurrentPrice(price);
      setLastCandleTime(time);
    };

    return () => {
      ws.close();
    };
  }, [interval]);

  return { candles, currentPrice, lastCandleTime };
}