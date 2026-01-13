import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, type ISeriesApi, type IChartApi, CrosshairMode } from 'lightweight-charts';
import { useMarketData } from '../hooks/useMarketData';
import ChartContextMenu from './ChartContextMenu';
import ChartOverlay from './ChartOverlay';
import { Lock, Loader2, Clock } from 'lucide-react';

interface ChartProps {
  activeOrders?: any[]; 
  activeTool: string | null;     
  onToolComplete: () => void; 
  clearTrigger: number; 
  removeSelectedTrigger: number; 
  isLocked: boolean;
  isHidden: boolean;
  symbol: string;
  displaySymbol: string;
  source: 'binance' | 'twelve';
  onTriggerPremium: () => void;
}

const TIMEFRAMES = [
  { label: '1S', value: '1s', locked: true },
  { label: '5S', value: '5s', locked: true },
  { label: '15S', value: '15s', locked: true },
  { label: '30S', value: '30s', locked: true },
  { label: '1m', value: '1m', locked: false },
  { label: '5m', value: '5m', locked: false },
  { label: '15m', value: '15m', locked: false },
  { label: '1h', value: '1h', locked: false },
  { label: '4h', value: '4h', locked: false },
  { label: '1d', value: '1d', locked: false },
];

const RANGES = [
  { label: '1D', resolution: '5m' },
  { label: '5D', resolution: '15m' },
  { label: '1M', resolution: '1h' },
  { label: '3M', resolution: '4h' },
  { label: '6M', resolution: '1d' },
  { label: '1Y', resolution: '1d' },
  { label: '5Y', resolution: '1d' },
];

export default function Chart({ 
  activeTool, 
  onToolComplete, 
  clearTrigger, 
  removeSelectedTrigger, 
  isLocked, 
  isHidden,
  symbol,        
  displaySymbol, 
  source,
  onTriggerPremium 
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null); 
  
  // FIX: Renamed interval/setInterval to timeframe/setTimeframe to avoid conflict
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [activeRange, setActiveRange] = useState<string | null>(null);
  
  // Clock State
  const [currentTime, setCurrentTime] = useState<string>(''); 

  const [menuState, setMenuState] = useState<{ visible: boolean; x: number; y: number; price: number }>({
    visible: false, x: 0, y: 0, price: 0
  });

  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [seriesApi, setSeriesApi] = useState<ISeriesApi<"Area"> | null>(null);

  // FIX: Updated to use 'timeframe'
  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(symbol, timeframe, source);
  
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const currentAnimatedPriceRef = useRef<number | null>(null);

  // CLOCK TICKER
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Returns format like "14:30:45 (UTC+4)"
      const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
      const offset = -now.getTimezoneOffset() / 60;
      const offsetString = offset >= 0 ? `+${offset}` : `${offset}`;
      setCurrentTime(`${timeString} (UTC${offsetString})`);
    };
    
    updateTime(); 
    // FIX: This now correctly refers to the global window.setInterval
    const timer = setInterval(updateTime, 1000); 
    return () => clearInterval(timer);
  }, []);

  const handleTimeframeClick = (tf: typeof TIMEFRAMES[0]) => {
    if (tf.locked) {
      onTriggerPremium(); 
      return;
    }
    // FIX: Updated setter
    setTimeframe(tf.value);
    setActiveRange(null);
  };

  const handleRangeClick = (range: typeof RANGES[0]) => {
    setActiveRange(range.label);
    // FIX: Updated setter
    setTimeframe(range.resolution); 
    if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
    }
  };

  useEffect(() => {
    if (!chartApi) return;
    const isCrosshairActive = activeTool === 'crosshair';
    chartApi.applyOptions({
      crosshair: {
        vertLine: { visible: isCrosshairActive, labelVisible: isCrosshairActive },
        horzLine: { visible: isCrosshairActive, labelVisible: isCrosshairActive },
        mode: CrosshairMode.Normal, 
      },
    });
  }, [chartApi, activeTool]);

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
      // ✅ TIME SCALE CONFIG (X-AXIS)
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false, 
        borderColor: '#2a2e39', 
        rightOffset: 10, 
        barSpacing: 6 
      },
      rightPriceScale: { borderColor: 'transparent' },
      crosshair: {
        vertLine: { visible: false, labelVisible: false, style: 3, width: 1, color: '#ffffff', labelBackgroundColor: '#1c2030' },
        horzLine: { visible: false, labelVisible: false, style: 3, width: 1, color: '#ffffff', labelBackgroundColor: '#21ce99' },
        mode: 0,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#ffffff', topColor: 'rgba(255, 255, 255, 0.1)', bottomColor: 'rgba(255, 255, 255, 0.1)', lineWidth: 2, crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;
    setChartApi(chart);
    setSeriesApi(areaSeries);

    chart.subscribeClick(() => setMenuState(prev => ({ ...prev, visible: false })));

    const handleRightClick = (event: MouseEvent) => {
        event.preventDefault(); 
        if (!chartRef.current || !seriesRef.current) return;
        const price = seriesRef.current.coordinateToPrice(event.offsetY);
        if (price) setMenuState({ visible: true, x: event.clientX, y: event.clientY, price: price });
    };

    chartContainerRef.current.addEventListener('contextmenu', handleRightClick);
    const handleResize = () => { if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight }); };
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

  const handleMenuAction = (action: string) => {
      if (action === 'reset' && chartRef.current) chartRef.current.timeScale().fitContent();
      setMenuState(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="w-full h-full relative group bg-transparent overflow-hidden">
      <style>{`#tv-attr-logo, .tv-lightweight-charts-attribution { display: none !important; } @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; box-shadow: 0 0 0 0 rgba(33, 206, 153, 0.7); } 100% { transform: scale(2); opacity: 0; box-shadow: 0 0 0 20px rgba(33, 206, 153, 0); } }`}</style>

      {/* TOP TIMEFRAMES */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-[#151a21]/90 backdrop-blur-md p-1 rounded-lg border border-[#2a2e39] shadow-xl">
        {TIMEFRAMES.map((tf) => (
            <button 
              key={tf.label} 
              onClick={() => handleTimeframeClick(tf)} 
              className={`
                relative px-3 py-1 text-[10px] font-bold rounded transition-all flex items-center gap-1
                ${timeframe === tf.value // FIX: Updated variable name in comparison
                  ? 'bg-[#21ce99] text-[#0b0e11] shadow-[0_0_10px_rgba(33,206,153,0.4)]' 
                  : tf.locked 
                    ? 'text-[#5e6673] opacity-60 hover:text-white hover:bg-[#2a303c] cursor-not-allowed' 
                    : 'text-[#5e6673] hover:text-white hover:bg-[#2a303c]'
                }
              `}
            >
                {tf.locked && <Lock size={8} />}
                {tf.label}
            </button>
        ))}
      </div>

      <div className="absolute top-6 left-6 z-20 pointer-events-none mix-blend-difference">
        <h1 className="text-4xl font-black text-[#5e6673] select-none tracking-tighter opacity-20">{displaySymbol}</h1>
      </div>

      {/* ✅ CHART CONTAINER - Fixed: Ends 32px from bottom so Footer doesn't hide Time Axis */}
      <div 
         ref={chartContainerRef} 
         className={`absolute top-0 left-0 right-0 bottom-8 ${activeTool === 'crosshair' ? 'cursor-crosshair' : 'cursor-default'}`} 
      />

      {/* LOADING SPINNER */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#191f2e]/50 backdrop-blur-sm animate-in fade-in">
            <Loader2 className="w-10 h-10 text-[#21ce99] animate-spin mb-3" />
            <span className="text-[#21ce99] text-xs font-bold tracking-widest uppercase">Loading Market Data...</span>
        </div>
      )}

      {/* BOTTOM RANGES (Floating above footer) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-[#0b0e11]/80 backdrop-blur-sm p-1.5 rounded-full border border-[#2a2e39] transition-opacity hover:opacity-100 opacity-50">
        {RANGES.map((r) => (
            <button 
                key={r.label}
                onClick={() => handleRangeClick(r)}
                className={`text-[9px] font-bold px-3 py-1 rounded-full transition-all
                   ${activeRange === r.label 
                      ? 'bg-[#21ce99] text-[#0b0e11]' 
                      : 'text-[#5e6673] hover:text-white hover:bg-[#2a303c]'
                    }`}
            >
                {r.label}
            </button>
        ))}
      </div>

      <ChartOverlay 
        chart={chartApi} 
        series={seriesApi} 
        activeTool={activeTool}
        onToolComplete={onToolComplete}
        clearTrigger={clearTrigger}
        removeSelectedTrigger={removeSelectedTrigger}
        isLocked={isLocked}
        isHidden={isHidden}
      />
      
      <div ref={dotRef} className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full z-40 pointer-events-none transition-transform duration-75" style={{ display: 'none', boxShadow: '0 0 10px #21ce99' }}>
        <div className="absolute inset-0 rounded-full bg-[#21ce99]" style={{ animation: 'pulseRing 1.5s infinite ease-out' }}></div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-[1000px] border-b border-dashed border-[#21ce99] opacity-30"></div>
      </div>
      
      {/* BOTTOM FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0b0e11] z-[100] border-t border-[#1e232d] flex items-center justify-between px-4">
        
        {/* LEFT: LIVE INDICATOR */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-[#21ce99] rounded-full animate-pulse shadow-[0_0_10px_#21ce99]"></div>
             <span className="text-[10px] text-[#21ce99] font-mono font-bold tracking-widest">LIVE MARKET FEED</span>
          </div>
          <div className="h-3 w-[1px] bg-[#2a2e39]"></div>
          <span className="text-[10px] text-white font-mono font-bold">{currentPrice ? currentPrice.toFixed(2) : '---'}</span>
        </div>

        {/* RIGHT: REAL-TIME CLOCK */}
        <div className="flex items-center gap-2 text-[#5e6673] hover:text-[#8b9bb4] transition-colors cursor-default">
           <Clock size={12} />
           <span className="text-[10px] font-mono font-bold tracking-wide tabular-nums">
             {currentTime}
           </span>
        </div>

      </div>

      {menuState.visible && (
        <ChartContextMenu x={menuState.x} y={menuState.y} price={menuState.price} onClose={() => setMenuState(prev => ({ ...prev, visible: false }))} onAction={handleMenuAction} />
      )}
    </div>
  );
}