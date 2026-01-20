import { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  AreaSeries, 
  CandlestickSeries, 
  BarSeries, 
  LineSeries, 
  HistogramSeries, 
  BaselineSeries, 
  type ISeriesApi, 
  type IChartApi, 
  CrosshairMode, 
  type Time, 
  type LineWidth,
  TickMarkType 
} from 'lightweight-charts';
import { TIMEFRAMES, RANGES } from '../constants/chartConfig';
import ChartContextMenu from './ChartContextMenu';
import ChartOverlay from './ChartOverlay';
import { Lock, Loader2, AlertTriangle, X, Check, BarChart3 } from 'lucide-react';
import type { Order, ChartStyle, CandleData } from '../types';

interface ChartProps {
  candles: CandleData[]; 
  currentPrice: number | null;
  lastCandleTime: Time | null;
  isLoading: boolean;
  activeTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  chartStyle: ChartStyle;
  activeOrders: Order[];
  onTrade: (order: Order) => void;
  onCloseOrder: (id: number) => void;
  activeTool: string | null;     
  onToolComplete: () => void; 
  clearTrigger: number; 
  removeSelectedTrigger: number; 
  isLocked: boolean;
  isHidden: boolean;
  symbol: string;
  displaySymbol: string;
  onTriggerPremium: () => void;
  activeAccountId: number; 
}

export default function Chart({ 
  candles, currentPrice, lastCandleTime, isLoading, 
  activeTimeframe, onTimeframeChange, chartStyle,
  activeOrders, onCloseOrder,
  activeTool, onToolComplete, clearTrigger, removeSelectedTrigger, 
  isLocked, isHidden, displaySymbol, onTriggerPremium, symbol,
}: ChartProps) {
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null); 
  
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const pendingZoomBars = useRef<number | null>(null);

  const [menuState, setMenuState] = useState<{ visible: boolean; x: number; y: number; price: number }>({
    visible: false, x: 0, y: 0, price: 0
  });

  const [confirmAction, setConfirmAction] = useState<{ type: 'buy' | 'sell'; price: number } | null>(null);

  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null); 
  
  const currentAnimatedPriceRef = useRef<number | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const isNewAsset = useRef(true);
  const prevSymbol = useRef(symbol);

  // --- HANDLERS ---
  const handleTimeframeClick = (tf: typeof TIMEFRAMES[0]) => {
    if (tf.locked) { onTriggerPremium(); return; }
    onTimeframeChange(tf.value); 
    setActiveRange(null);
    pendingZoomBars.current = 100; 
  };

  const handleRangeClick = (range: typeof RANGES[0]) => {
    setActiveRange(range.label);
    onTimeframeChange(range.resolution); 
    pendingZoomBars.current = range.bars;
  };

  const handleMenuAction = (action: string, _payload?: any) => {
    if (action === 'reset' && chartRef.current) {
       chartRef.current.timeScale().fitContent();
    }
    if (action === 'buy_limit' || action === 'sell_limit') {
       const type = action === 'buy_limit' ? 'buy' : 'sell';
       const executionPrice = currentPrice || 0; 
       if (executionPrice <= 0) return;
       setConfirmAction({ type, price: executionPrice });
    }
    setMenuState(prev => ({ ...prev, visible: false }));
  };

  // ✅ UPDATED: NOW SIGNALS ORDER PANEL INSTEAD OF CREATING ORDER DIRECTLY
  const executeTrade = () => {
    if (!confirmAction) return;
    const { type } = confirmAction;
    
    // 🔥 Dispatch Event to OrderPanel
    const event = new CustomEvent('trigger-trade', { detail: { side: type } });
    window.dispatchEvent(event);

    setConfirmAction(null);
  };

  // --- CHART INIT ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: { 
          background: { type: ColorType.Solid, color: 'transparent' }, 
          textColor: '#9ca3af', 
          attributionLogo: false 
        },
        grid: { 
          vertLines: { color: 'rgba(255, 255, 255, 0.08)', style: 1 }, 
          horzLines: { color: 'rgba(255, 255, 255, 0.08)', style: 1 } 
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        
        timeScale: { 
          timeVisible: true, 
          secondsVisible: false, 
          borderColor: '#2a2e39', 
          rightOffset: 12, 
          barSpacing: 6,
          shiftVisibleRangeOnNewBar: true,
          uniformDistribution: true,
          
          tickMarkFormatter: (time: number, tickMarkType: TickMarkType) => {
            const date = new Date(time * 1000);
            switch (tickMarkType) {
              case TickMarkType.Year: return date.getUTCFullYear().toString();
              case TickMarkType.Month: return date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
              case TickMarkType.DayOfMonth: return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
              case TickMarkType.Time: return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
              case TickMarkType.TimeWithSeconds: return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false });
              default: return "";
            }
          },
        },

        localization: {
          locale: 'en-GB',
          timeFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return date.toLocaleString('en-GB', { 
              day: '2-digit', month: 'short',
              hour: '2-digit', minute: '2-digit', 
              timeZone: 'UTC', hour12: false 
            });
          },
        },

        rightPriceScale: { borderColor: 'transparent' },
        crosshair: { mode: CrosshairMode.Normal },
      });

      chartRef.current = chart;
      setChartApi(chart);

      const handleResize = () => { if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight }); };
      window.addEventListener('resize', handleResize);

      const handleRightClick = (event: MouseEvent) => {
          event.preventDefault(); 
          if (!chartRef.current || !seriesRef.current) return;
          const price = seriesRef.current.coordinateToPrice(event.offsetY);
          if (price) {
               setMenuState({ visible: true, x: event.clientX, y: event.clientY, price: price });
          }
      };
      chartContainerRef.current.addEventListener('contextmenu', handleRightClick);
      chart.subscribeClick(() => setMenuState(prev => ({ ...prev, visible: false })));
    }

    const chart = chartRef.current;
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    let newSeries: ISeriesApi<any>;
    const lineOptions = { color: '#21ce99', lineWidth: 2 as LineWidth };
    
    switch (chartStyle) {
      case 'candles':
        newSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#21ce99', downColor: '#f23645', borderVisible: false, wickUpColor: '#21ce99', wickDownColor: '#f23645',
        });
        break;
      case 'bars':
        newSeries = chart.addSeries(BarSeries, {
          upColor: '#21ce99', downColor: '#f23645', thinBars: false,
        });
        break;
      case 'line':
        newSeries = chart.addSeries(LineSeries, lineOptions);
        break;
      case 'area':
        newSeries = chart.addSeries(AreaSeries, {
          lineColor: '#ffffff', topColor: 'rgba(255, 255, 255, 0.1)', bottomColor: 'rgba(255, 255, 255, 0.0)', lineWidth: 2 as LineWidth,
        });
        break;
      case 'stepline':
        newSeries = chart.addSeries(LineSeries, { ...lineOptions, lineType: 1 } as any); 
        break;
      case 'baseline': 
        newSeries = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: currentPrice || 0 },
          topLineColor: '#21ce99', bottomLineColor: '#f23645',
        });
        break;
      default:
        newSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#21ce99', downColor: '#f23645', borderVisible: false, wickUpColor: '#21ce99', wickDownColor: '#f23645',
        });
    }

    seriesRef.current = newSeries;

    if (chartStyle === 'candles' || chartStyle === 'bars') {
       const volSeries = chart.addSeries(HistogramSeries, {
         color: '#26a69a',
         priceFormat: { type: 'volume' },
         priceScaleId: '', 
       });
       volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
       volumeSeriesRef.current = volSeries;
    }

    if (candles.length > 0) {
      if (chartStyle === 'line' || chartStyle === 'area' || chartStyle === 'stepline' || chartStyle === 'baseline') {
         newSeries.setData(candles.map(c => ({ time: c.time, value: c.close })));
      } else {
         newSeries.setData(candles);
      }
      if (volumeSeriesRef.current) {
         volumeSeriesRef.current.setData(candles.map(c => ({
           time: c.time,
           value: c.volume || 0,
           color: (c.close >= c.open) ? 'rgba(33, 206, 153, 0.4)' : 'rgba(242, 54, 69, 0.4)'
         })));
      }
    }

  }, [chartStyle]);

  
  useEffect(() => {
    if (!chartRef.current) return;
    const isDaily = activeTimeframe === '1d' || activeTimeframe === '1w';
    chartRef.current.applyOptions({
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          if (isDaily) {
             return date.toLocaleDateString('en-GB', { 
               day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
             });
          }
          return date.toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', 
            timeZone: 'UTC', hour12: false 
          });
        },
      }
    });
  }, [activeTimeframe]);

  useEffect(() => {
    if (prevSymbol.current !== symbol) {
        isNewAsset.current = true;
        prevSymbol.current = symbol;
        pendingZoomBars.current = 70; 
    }
  }, [symbol]);

  useEffect(() => {
    if (chartRef.current) {
      const mode = activeTool ? CrosshairMode.Normal : CrosshairMode.Hidden;
      chartRef.current.applyOptions({
        crosshair: {
          mode: mode,
          vertLine: { visible: activeTool !== null },
          horzLine: { visible: activeTool !== null },
        }
      });
    }
  }, [activeTool]);

  useEffect(() => {
    if (seriesRef.current) {
      if (chartStyle === 'line' || chartStyle === 'area' || chartStyle === 'stepline' || chartStyle === 'baseline') {
         (seriesRef.current as ISeriesApi<"Line">).setData(candles.map(c => ({ time: c.time, value: c.close })));
      } else {
         (seriesRef.current as ISeriesApi<"Candlestick">).setData(candles);
      }

      if (volumeSeriesRef.current) {
         volumeSeriesRef.current.setData(candles.map(c => ({
           time: c.time,
           value: c.volume || 0,
           color: (c.close >= c.open) ? 'rgba(33, 206, 153, 0.4)' : 'rgba(242, 54, 69, 0.4)'
         })));
      }

      if ((isNewAsset.current || pendingZoomBars.current) && chartRef.current && candles.length > 0) {
          const totalBars = candles.length;
          const visibleBars = pendingZoomBars.current || 100; 

          if (totalBars > visibleBars) {
              chartRef.current.timeScale().setVisibleLogicalRange({
                  from: totalBars - visibleBars,
                  to: totalBars + 5 
              });
          } else {
              chartRef.current.timeScale().fitContent();
          }
          
          isNewAsset.current = false;
          pendingZoomBars.current = null;
      }

      if (candles.length > 0) {
        const lastPrice = candles[candles.length - 1].close;
        currentAnimatedPriceRef.current = lastPrice;
      }
    }
  }, [candles, chartStyle]);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (currentPrice && lastCandleTime && seriesRef.current && chartRef.current) {
        if (currentAnimatedPriceRef.current === null) currentAnimatedPriceRef.current = currentPrice;
        
        const diff = currentPrice - currentAnimatedPriceRef.current;
        if (Math.abs(diff) > 0.005) currentAnimatedPriceRef.current += diff * 0.1;
        else currentAnimatedPriceRef.current = currentPrice;

        const timestamp = lastCandleTime;

        if (chartStyle === 'line' || chartStyle === 'area' || chartStyle === 'stepline' || chartStyle === 'baseline') {
            (seriesRef.current as ISeriesApi<"Line">).update({ time: timestamp, value: currentAnimatedPriceRef.current });
        } 
        
        if (dotRef.current) {
            if (chartStyle === 'area' && seriesRef.current) {
                const y = seriesRef.current.priceToCoordinate(currentAnimatedPriceRef.current);
                const x = chartRef.current.timeScale().timeToCoordinate(timestamp);
                
                if (y !== null && x !== null && x !== undefined) {
                    dotRef.current.style.display = 'block';
                    dotRef.current.style.transform = `translate(${x - 6}px, ${y - 6}px)`;
                } else {
                    dotRef.current.style.display = 'none';
                }
            } else {
                dotRef.current.style.display = 'none';
            }
        }
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [currentPrice, lastCandleTime, chartStyle]);

  if (!symbol) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#151a21] relative z-20 animate-in fade-in">
         <div className="text-center space-y-6 p-10 bg-[#1e232d]/50 backdrop-blur-xl rounded-3xl border border-[#2a2e39] shadow-2xl max-w-md mx-4">
            <div className="w-20 h-20 bg-[#21ce99]/10 rounded-full flex items-center justify-center mx-auto text-[#21ce99] shadow-[0_0_30px_rgba(33,206,153,0.2)] border border-[#21ce99]/20">
                <BarChart3 size={40} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Trading Terminal <span className="text-[#21ce99]">Standby</span></h2>
                <p className="text-[#8b9bb4] text-sm leading-relaxed">
                  The terminal is ready. Select a financial instrument from the menu above to initialize the data feed and begin your analysis.
                </p>
            </div>
            <div className="pt-4">
                <span className="text-[10px] uppercase font-bold text-[#5e6673] tracking-widest">Waiting for input...</span>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group bg-transparent overflow-hidden">
      <style>{`#tv-attr-logo, .tv-lightweight-charts-attribution { display: none !important; }`}</style>

      {/* TIMEFRAMES */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 hidden md:flex gap-1 bg-[#151a21]/90 backdrop-blur-md p-1 rounded-lg border border-[#2a2e39] shadow-xl">
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
      
      {/* CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
           <div className="w-[320px] bg-[#151a21]/90 backdrop-blur-xl border border-[#2a2e39] p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-4 transform transition-all scale-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                 confirmAction.type === 'buy' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'
              }`}>
                 <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1">
                 <h3 className="text-white font-bold text-lg">Confirm Transaction</h3>
                 <p className="text-[#9ca3af] text-xs">
                   Are you sure you want to 
                   <span className={`font-black uppercase mx-1 ${confirmAction.type === 'buy' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                     {confirmAction.type}
                   </span>
                   at <span className="text-white font-mono">${confirmAction.price.toFixed(2)}</span>?
                 </p>
                 <p className="text-[10px] text-[#5e6673] mt-2 font-mono bg-black/30 rounded px-2 py-1 inline-block">Executes Active Panel Settings</p>
              </div>
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
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 hidden md:flex gap-2 bg-[#0b0e11]/80 backdrop-blur-sm p-1.5 rounded-full border border-[#2a2e39] opacity-50 hover:opacity-100 transition-opacity">
        {RANGES.map((r) => (
            <button key={r.label} onClick={() => handleRangeClick(r)} className={`text-[9px] font-bold px-3 py-1 rounded-full transition-all ${activeRange === r.label ? 'bg-[#21ce99] text-[#0b0e11]' : 'text-[#5e6673] hover:text-white'}`}>
                {r.label}
            </button>
        ))}
      </div>

      <ChartOverlay 
        chart={chartApi} 
        series={seriesRef.current as any} 
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