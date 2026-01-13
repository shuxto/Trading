import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, type ISeriesApi, type IChartApi, CrosshairMode, type Time } from 'lightweight-charts';
import { useClock } from '../hooks/useClock';
import { TIMEFRAMES, RANGES } from '../constants/chartConfig';
import ChartContextMenu from './ChartContextMenu';
import ChartOverlay from './ChartOverlay';
import { Lock, Loader2, Clock, AlertTriangle, X, Check } from 'lucide-react';
import type { Order } from '../types';

interface ChartProps {
  // Data
  candles: { time: Time; value: number }[];
  currentPrice: number | null;
  lastCandleTime: Time | null;
  isLoading: boolean;
  
  // Controls
  activeTimeframe: string;
  onTimeframeChange: (tf: string) => void;

  // Trading Interactions
  activeOrders: Order[];
  onTrade: (order: Order) => void;
  onCloseOrder: (id: number) => void;

  // Tools & UI
  activeTool: string | null;     
  onToolComplete: () => void; 
  clearTrigger: number; 
  removeSelectedTrigger: number; 
  isLocked: boolean;
  isHidden: boolean;
  symbol: string;
  displaySymbol: string;
  onTriggerPremium: () => void;
}

export default function Chart({ 
  candles, currentPrice, lastCandleTime, isLoading, 
  activeTimeframe, onTimeframeChange,
  activeOrders, onTrade, onCloseOrder,
  activeTool, onToolComplete, clearTrigger, removeSelectedTrigger, 
  isLocked, isHidden, displaySymbol, onTriggerPremium 
}: ChartProps) {
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null); 
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const currentTime = useClock();

  // Context Menu State
  const [menuState, setMenuState] = useState<{ visible: boolean; x: number; y: number; price: number }>({
    visible: false, x: 0, y: 0, price: 0
  });

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{ type: 'buy' | 'sell'; price: number } | null>(null);

  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [seriesApi, setSeriesApi] = useState<ISeriesApi<"Area"> | null>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const currentAnimatedPriceRef = useRef<number | null>(null);

  // --- HANDLERS ---
  const handleTimeframeClick = (tf: typeof TIMEFRAMES[0]) => {
    if (tf.locked) { onTriggerPremium(); return; }
    onTimeframeChange(tf.value); 
    setActiveRange(null);
  };

  const handleRangeClick = (range: typeof RANGES[0]) => {
    setActiveRange(range.label);
    onTimeframeChange(range.resolution); 
    if (chartRef.current) chartRef.current.timeScale().fitContent();
  };

  // ✅ FIX: Renamed 'payload' to '_payload' to silence the linter error
  const handleMenuAction = (action: string, _payload?: any) => {
    if (action === 'reset' && chartRef.current) {
       chartRef.current.timeScale().fitContent();
    }
    
    if (action === 'buy_limit' || action === 'sell_limit') {
       const type = action === 'buy_limit' ? 'buy' : 'sell';
       const executionPrice = currentPrice || 0; 

       if (executionPrice <= 0) {
         console.warn("Waiting for market data...");
         setMenuState(prev => ({ ...prev, visible: false }));
         return;
       }

       // OPEN THE CUSTOM MODAL
       setConfirmAction({ type, price: executionPrice });
    }
    
    setMenuState(prev => ({ ...prev, visible: false }));
  };

  const executeTrade = () => {
    if (!confirmAction) return;

    const { type, price } = confirmAction;

    const newOrder: Order = {
      id: Date.now(),
      type: type,
      symbol: displaySymbol,
      entryPrice: price,
      margin: 100,
      leverage: 20,
      size: 2000,
      liquidationPrice: price * (type === 'buy' ? 0.95 : 1.05),
      status: 'active'
    };
    
    onTrade(newOrder);
    setConfirmAction(null); // Close modal
  };

  // --- CHART INIT ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af', attributionLogo: false },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.08)', style: 1 }, horzLines: { color: 'rgba(255, 255, 255, 0.08)', style: 1 } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#2a2e39', rightOffset: 12, barSpacing: 6 },
      rightPriceScale: { borderColor: 'transparent' },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#ffffff', topColor: 'rgba(255, 255, 255, 0.1)', bottomColor: 'rgba(255, 255, 255, 0.1)', lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;
    setChartApi(chart);
    setSeriesApi(areaSeries);

    const handleRightClick = (event: MouseEvent) => {
        event.preventDefault(); 
        if (!chartRef.current || !seriesRef.current) return;
        
        const price = seriesRef.current.coordinateToPrice(event.offsetY);
        
        if (price) {
             setMenuState({ 
                visible: true, 
                x: event.clientX, 
                y: event.clientY, 
                price: price 
             });
        }
    };

    chartContainerRef.current.addEventListener('contextmenu', handleRightClick);

    const handleResize = () => { if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight }); };
    window.addEventListener('resize', handleResize);
    
    chart.subscribeClick(() => setMenuState(prev => ({ ...prev, visible: false })));

    return () => {
      if (chartContainerRef.current) chartContainerRef.current.removeEventListener('contextmenu', handleRightClick);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); 

  // --- DATA UPDATE ---
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles);
      const lastPrice = candles[candles.length - 1].value;
      currentAnimatedPriceRef.current = lastPrice;
    }
  }, [candles]);

  // --- ANIMATION ---
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (currentPrice && lastCandleTime && seriesRef.current && chartRef.current) {
        if (currentAnimatedPriceRef.current === null) currentAnimatedPriceRef.current = currentPrice;
        
        const diff = currentPrice - currentAnimatedPriceRef.current;
        if (Math.abs(diff) > 0.005) currentAnimatedPriceRef.current += diff * 0.1;
        else currentAnimatedPriceRef.current = currentPrice;

        seriesRef.current.update({ time: lastCandleTime, value: currentAnimatedPriceRef.current });
        
        const y = seriesRef.current.priceToCoordinate(currentAnimatedPriceRef.current);
        const x = chartRef.current.timeScale().timeToCoordinate(lastCandleTime);
        
        if (dotRef.current && y !== null && x !== null && x !== undefined) {
            dotRef.current.style.display = 'block';
            dotRef.current.style.transform = `translate(${x - 6}px, ${y - 6}px)`;
        }
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [currentPrice, lastCandleTime]);

  return (
    <div className="w-full h-full relative group bg-transparent overflow-hidden">
      <style>{`#tv-attr-logo, .tv-lightweight-charts-attribution { display: none !important; }`}</style>

      {/* TIMEFRAMES */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-[#151a21]/90 backdrop-blur-md p-1 rounded-lg border border-[#2a2e39] shadow-xl">
        {TIMEFRAMES.map((tf) => (
            <button 
              key={tf.label} 
              onClick={() => handleTimeframeClick(tf)} 
              className={`relative px-3 py-1 text-[10px] font-bold rounded transition-all flex items-center gap-1 ${activeTimeframe === tf.value ? 'bg-[#21ce99] text-[#0b0e11] shadow' : 'text-[#5e6673] hover:text-white'}`}
            >
                {tf.locked && <Lock size={8} />}
                {tf.label}
            </button>
        ))}
      </div>

      <div className="absolute top-6 left-6 z-20 pointer-events-none mix-blend-difference">
        <h1 className="text-4xl font-black text-[#5e6673] select-none tracking-tighter opacity-20">{displaySymbol}</h1>
      </div>

      <div ref={chartContainerRef} className={`absolute top-0 left-0 right-0 bottom-8 ${activeTool === 'crosshair' ? 'cursor-crosshair' : 'cursor-default'}`} />

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#191f2e]/50 backdrop-blur-sm animate-in fade-in">
            <Loader2 className="w-10 h-10 text-[#21ce99] animate-spin mb-3" />
        </div>
      )}
      
      {/* GLASSMORPHIC CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
           <div className="w-[320px] bg-[#151a21]/90 backdrop-blur-xl border border-[#2a2e39] p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-4 transform transition-all scale-100">
              
              {/* Header Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                 confirmAction.type === 'buy' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'
              }`}>
                 <AlertTriangle size={24} />
              </div>

              {/* Text Info */}
              <div className="text-center space-y-1">
                 <h3 className="text-white font-bold text-lg">Confirm Transaction</h3>
                 <p className="text-[#9ca3af] text-xs">
                    Are you sure you want to 
                    <span className={`font-black uppercase mx-1 ${confirmAction.type === 'buy' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                      {confirmAction.type}
                    </span>
                    at <span className="text-white font-mono">${confirmAction.price.toFixed(2)}</span>?
                 </p>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full gap-3 mt-2">
                 <button 
                   onClick={() => setConfirmAction(null)}
                   className="flex-1 py-2.5 rounded-lg bg-[#2a2e39] text-[#9ca3af] font-bold text-xs hover:bg-[#363c4a] hover:text-white transition-all flex items-center justify-center gap-2"
                 >
                    <X size={14} /> CANCEL
                 </button>
                 
                 <button 
                   onClick={executeTrade}
                   className={`flex-1 py-2.5 rounded-lg font-bold text-xs text-[#0b0e11] transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2 ${
                     confirmAction.type === 'buy' ? 'bg-[#21ce99] shadow-[#21ce99]/20' : 'bg-[#f23645] text-white shadow-[#f23645]/20'
                   }`}
                 >
                    <Check size={14} /> CONFIRM
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* RANGES */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-[#0b0e11]/80 backdrop-blur-sm p-1.5 rounded-full border border-[#2a2e39] opacity-50 hover:opacity-100 transition-opacity">
        {RANGES.map((r) => (
            <button key={r.label} onClick={() => handleRangeClick(r)} className={`text-[9px] font-bold px-3 py-1 rounded-full transition-all ${activeRange === r.label ? 'bg-[#21ce99] text-[#0b0e11]' : 'text-[#5e6673] hover:text-white'}`}>
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
        activeOrders={activeOrders}
        currentPrice={currentPrice}
        onCloseOrder={onCloseOrder}
      />
      
      <div ref={dotRef} className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full z-40 pointer-events-none transition-transform duration-75" style={{ display: 'none', boxShadow: '0 0 10px #21ce99' }}></div>
      
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0b0e11] z-[100] border-t border-[#1e232d] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-[#21ce99] rounded-full animate-pulse shadow-[0_0_10px_#21ce99]"></div>
             <span className="text-[10px] text-[#21ce99] font-mono font-bold tracking-widest">LIVE</span>
          </div>
          <div className="h-3 w-[1px] bg-[#2a2e39]"></div>
          <span className="text-[10px] text-white font-mono font-bold">{currentPrice ? currentPrice.toFixed(2) : '---'}</span>
        </div>
        <div className="flex items-center gap-2 text-[#5e6673]">
           <Clock size={12} />
           <span className="text-[10px] font-mono font-bold tabular-nums">{currentTime}</span>
        </div>
      </div>

      {menuState.visible && (
        <ChartContextMenu 
            x={menuState.x} 
            y={menuState.y} 
            price={menuState.price} 
            onClose={() => setMenuState(prev => ({ ...prev, visible: false }))} 
            onAction={handleMenuAction} 
        />
      )}
    </div>
  );
}