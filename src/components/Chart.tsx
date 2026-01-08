import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, type ISeriesApi, type IChartApi } from 'lightweight-charts';
import { useBinanceData } from '../hooks/useBinanceData';
import ChartContextMenu from './ChartContextMenu';
import ChartOverlay from './ChartOverlay';

interface ChartProps {
  activeOrders?: any[]; 
  activeTool: string | null;     
  onToolComplete: () => void;    
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

// REMOVED: activeOrders from destructuring to fix TS error
export default function Chart({ activeTool, onToolComplete }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null); 
  
  const [interval, setInterval] = useState<string>('1m');
  const [menuState, setMenuState] = useState<{ visible: boolean; x: number; y: number; price: number }>({
    visible: false, x: 0, y: 0, price: 0
  });

  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [seriesApi, setSeriesApi] = useState<ISeriesApi<"Area"> | null>(null);

  const { candles, currentPrice, lastCandleTime } = useBinanceData(interval);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const currentAnimatedPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: 'transparent' }, 
        textColor: '#9ca3af', 
        attributionLogo: false 
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.08)', style: 1, visible: true }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.08)', style: 1, visible: true } 
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: true, 
        borderColor: '#2a2e39', 
        rightOffset: 10, 
        barSpacing: 6, 
      },
      rightPriceScale: { borderColor: 'transparent' },
      crosshair: {
        vertLine: { visible: true, labelVisible: true, style: 3, width: 1, color: '#ffffff', labelBackgroundColor: '#1c2030' },
        horzLine: { visible: true, labelVisible: true, style: 3, width: 1, color: '#ffffff', labelBackgroundColor: '#21ce99' },
        mode: 0,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#ffffff', 
      topColor: 'rgba(255, 255, 255, 0.1)', 
      bottomColor: 'rgba(255, 255, 255, 0.1)', 
      lineWidth: 2, 
      crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;
    
    setChartApi(chart);
    setSeriesApi(areaSeries);

    // FIX: Removed unused 'param'
    chart.subscribeClick(() => {
        setMenuState(prev => ({ ...prev, visible: false }));
    });

    const handleRightClick = (event: MouseEvent) => {
        event.preventDefault(); 
        if (!chartRef.current || !seriesRef.current) return;
        const price = seriesRef.current.coordinateToPrice(event.offsetY);
        if (price) setMenuState({ visible: true, x: event.clientX, y: event.clientY, price: price });
    };

    chartContainerRef.current.addEventListener('contextmenu', handleRightClick);

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (chartContainerRef.current) chartContainerRef.current.removeEventListener('contextmenu', handleRightClick);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); 

  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles);
      const lastPrice = candles[candles.length - 1].value;
      currentAnimatedPriceRef.current = lastPrice;
    }
  }, [candles]);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      if (currentPrice && lastCandleTime && chartRef.current && seriesRef.current) {
        if (currentAnimatedPriceRef.current === null) currentAnimatedPriceRef.current = currentPrice;
        const diff = currentPrice - currentAnimatedPriceRef.current;
        if (Math.abs(diff) > 0.005) currentAnimatedPriceRef.current += diff * 0.1;
        else currentAnimatedPriceRef.current = currentPrice;

        seriesRef.current.update({ time: lastCandleTime, value: currentAnimatedPriceRef.current });
        
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

  // FIX: Removed unused 'price'
  const handleMenuAction = (action: string) => {
      if (action === 'reset' && chartRef.current) chartRef.current.timeScale().fitContent();
      setMenuState(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="w-full h-full relative group bg-transparent overflow-hidden">
      <style>{`#tv-attr-logo, .tv-lightweight-charts-attribution { display: none !important; } @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; box-shadow: 0 0 0 0 rgba(33, 206, 153, 0.7); } 100% { transform: scale(2); opacity: 0; box-shadow: 0 0 0 20px rgba(33, 206, 153, 0); } }`}</style>

      {/* TIMEFRAMES */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-[#151a21]/90 backdrop-blur-md p-1 rounded-lg border border-[#2a2e39] shadow-xl">
        {TIMEFRAMES.map((tf) => (
            <button key={tf} onClick={() => setInterval(tf)} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${interval === tf ? 'bg-[#21ce99] text-[#0b0e11] shadow-[0_0_10px_rgba(33,206,153,0.4)]' : 'text-[#5e6673] hover:text-white hover:bg-[#2a303c]'}`}>
                {tf.toUpperCase()}
            </button>
        ))}
      </div>

      <div className="absolute top-6 left-6 z-20 pointer-events-none mix-blend-difference"><h1 className="text-4xl font-black text-[#5e6673] select-none tracking-tighter opacity-20">BTC/USD</h1></div>

      <div ref={chartContainerRef} className="w-full h-full relative cursor-crosshair" />

      {/* RENDER OVERLAY */}
      <ChartOverlay 
        chart={chartApi} 
        series={seriesApi} 
        activeTool={activeTool}
        onToolComplete={onToolComplete}
      />

      <div ref={dotRef} className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full z-40 pointer-events-none transition-transform duration-75" style={{ display: 'none', boxShadow: '0 0 10px #21ce99' }}>
        <div className="absolute inset-0 rounded-full bg-[#21ce99]" style={{ animation: 'pulseRing 1.5s infinite ease-out' }}></div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-[1000px] border-b border-dashed border-[#21ce99] opacity-30"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0b0e11] z-[100] border-t border-[#1e232d] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#21ce99] rounded-full animate-pulse shadow-[0_0_10px_#21ce99]"></div><span className="text-[10px] text-[#21ce99] font-mono font-bold tracking-widest">LIVE BINANCE FEED</span></div>
          <div className="h-3 w-[1px] bg-[#2a2e39]"></div>
          <span className="text-[10px] text-white font-mono font-bold">{currentPrice ? currentPrice.toFixed(2) : '---'}</span>
        </div>
      </div>

      {menuState.visible && (
        <ChartContextMenu x={menuState.x} y={menuState.y} price={menuState.price} onClose={() => setMenuState(prev => ({ ...prev, visible: false }))} onAction={handleMenuAction} />
      )}
    </div>
  );
}