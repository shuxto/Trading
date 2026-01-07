import { useEffect, useRef, useState } from 'react';
// FIX: Added 'type' before ISeriesApi to satisfy the strict rules
import { createChart, ColorType, AreaSeries, type ISeriesApi } from 'lightweight-charts';
import { useBinanceData } from '../hooks/useBinanceData';

interface ChartProps {
  activeOrders?: any[]; 
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function Chart({ activeOrders }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null); 
  
  // STATE
  const [interval, setInterval] = useState<string>('1m');

  // DATA HOOK
  const { candles, currentPrice, lastCandleTime } = useBinanceData(interval);

  // REFS
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const currentAnimatedPriceRef = useRef<number | null>(null);

  // --- 1. SETUP CHART (RUNS ONCE) ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#5e6673', attributionLogo: false },
      grid: { vertLines: { color: 'rgba(0,0,0,0)' }, horzLines: { color: 'rgba(42, 46, 57, 0.2)' } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: true, 
        borderColor: '#2a2e39', 
        rightOffset: 20 
      },
      rightPriceScale: { borderColor: '#2a2e39' },
      crosshair: { vertLine: { visible: false, labelVisible: false }, horzLine: { visible: false, labelVisible: false } },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#21ce99',
      topColor: 'rgba(33, 206, 153, 0.4)',
      bottomColor: 'rgba(33, 206, 153, 0)', 
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); 


  // --- 2. HANDLE DATA UPDATES ---
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles);
      const lastPrice = candles[candles.length - 1].value;
      currentAnimatedPriceRef.current = lastPrice;
    }
  }, [candles]);


  // --- 3. ANIMATION LOOP ---
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (currentPrice && lastCandleTime && chartRef.current && seriesRef.current) {
        
        // Physics
        if (currentAnimatedPriceRef.current === null) currentAnimatedPriceRef.current = currentPrice;
        
        const diff = currentPrice - currentAnimatedPriceRef.current;
        if (Math.abs(diff) > 0.005) {
            currentAnimatedPriceRef.current += diff * 0.1;
        } else {
            currentAnimatedPriceRef.current = currentPrice;
        }

        // Draw
        seriesRef.current.update({ 
            time: lastCandleTime, 
            value: currentAnimatedPriceRef.current 
        });

        // Dot
        const y = seriesRef.current.priceToCoordinate(currentAnimatedPriceRef.current);
        const coordinateX = chartRef.current.timeScale().timeToCoordinate(lastCandleTime);
        const containerWidth = chartContainerRef.current?.clientWidth || 0;
        const safeX = coordinateX ?? (containerWidth - 60);

        if (dotRef.current && y !== null) {
            dotRef.current.style.display = 'block';
            dotRef.current.style.transform = `translate(${safeX - 6}px, ${y - 6}px)`;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentPrice, lastCandleTime]);


  return (
    <div className="w-full h-full relative group bg-[#0b0e11] overflow-hidden">
      <style>{`#tv-attr-logo, .tv-lightweight-charts-attribution { display: none !important; } 
               @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; box-shadow: 0 0 0 0 rgba(33, 206, 153, 0.7); } 100% { transform: scale(2); opacity: 0; box-shadow: 0 0 0 20px rgba(33, 206, 153, 0); } }`}</style>

      {/* TIMEFRAMES */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-[#151a21]/90 backdrop-blur-md p-1 rounded-lg border border-[#2a2e39] shadow-xl">
        {TIMEFRAMES.map((tf) => (
            <button key={tf} onClick={() => setInterval(tf)} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${interval === tf ? 'bg-[#21ce99] text-[#0b0e11] shadow-[0_0_10px_rgba(33,206,153,0.4)]' : 'text-[#5e6673] hover:text-white hover:bg-[#2a303c]'}`}>
                {tf.toUpperCase()}
            </button>
        ))}
      </div>

      <div className="absolute top-6 left-6 z-20 pointer-events-none mix-blend-difference"><h1 className="text-4xl font-black text-[#5e6673] select-none tracking-tighter opacity-20">BTC/USD</h1></div>

      <div ref={chartContainerRef} className="w-full h-full relative" />

      <div ref={dotRef} className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full z-40 pointer-events-none transition-transform duration-75" style={{ display: 'none', boxShadow: '0 0 10px #21ce99' }}>
        <div className="absolute inset-0 rounded-full bg-[#21ce99]" style={{ animation: 'pulseRing 1.5s infinite ease-out' }}></div>
        <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#21ce99] text-[#0b0e11] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">{currentPrice ? currentPrice.toFixed(2) : '...'}</div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-[1000px] border-b border-dashed border-[#21ce99] opacity-30"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0b0e11] z-[100] border-t border-[#1e232d] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#21ce99] rounded-full animate-pulse shadow-[0_0_10px_#21ce99]"></div><span className="text-[10px] text-[#21ce99] font-mono font-bold tracking-widest">LIVE BINANCE FEED</span></div>
          <div className="h-3 w-[1px] bg-[#2a2e39]"></div>
          <span className="text-[10px] text-white font-mono font-bold">{currentPrice ? currentPrice.toFixed(2) : '---'}</span>
        </div>
      </div>
    </div>
  );
}