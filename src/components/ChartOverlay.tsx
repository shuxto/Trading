import { useEffect, useState } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

interface Drawing {
  id: number;
  type: 'trend' | 'horizontal';
  p1: { time: number; price: number };
  p2?: { time: number; price: number };
}

interface OverlayProps {
  chart: IChartApi | null;
  series: ISeriesApi<"Area"> | null;
  activeTool: string | null;
  onToolComplete: () => void;
}

export default function ChartOverlay({ chart, series, activeTool, onToolComplete }: OverlayProps) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  
  // Used to force re-render when chart scrolls/zooms
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!chart) return;
    const handleResize = () => setTick(t => t + 1);
    
    // Subscribe to chart updates to keep drawings in sync
    chart.timeScale().subscribeVisibleTimeRangeChange(handleResize);
    window.addEventListener('resize', handleResize);
    
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [chart]);

  const handleClick = (e: React.MouseEvent) => {
    // Ignore clicks if no tool is selected or if it's just the crosshair
    if (!chart || !series || !activeTool || activeTool === 'crosshair') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price === null || time === null) return;

    const timeNum = time as number;

    if (!currentDrawing) {
      // START NEW DRAWING
      const drawingType = activeTool === 'horizontal' ? 'horizontal' : 'trend';

      setCurrentDrawing({
        id: Date.now(),
        type: drawingType,
        p1: { time: timeNum, price },
        p2: { time: timeNum, price }
      });
    } else {
      // FINISH DRAWING
      // For horizontal lines, ensure p2 has the exact same price as p1
      const finalPrice = currentDrawing.type === 'horizontal' ? currentDrawing.p1.price : price;

      setDrawings([...drawings, { ...currentDrawing, p2: { time: timeNum, price: finalPrice } }]);
      setCurrentDrawing(null);
      onToolComplete();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentDrawing || !chart || !series) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price && time) {
      // FIX: If drawing horizontal, lock the price to the starting point (p1)
      const nextPrice = currentDrawing.type === 'horizontal' ? currentDrawing.p1.price : price;

      setCurrentDrawing({ 
        ...currentDrawing, 
        p2: { time: time as number, price: nextPrice } 
      });
    }
  };

  const getCoords = (p: { time: number; price: number }) => {
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(p.time as Time);
    const y = series.priceToCoordinate(p.price);
    return { x, y };
  };

  return (
    <svg 
      className="absolute inset-0 z-10 w-full h-full overflow-visible"
      onMouseDown={handleClick}
      onMouseMove={handleMouseMove}
      // Only enable pointer events when a drawing tool is active
      style={{ pointerEvents: activeTool && activeTool !== 'crosshair' ? 'auto' : 'none', cursor: activeTool === 'crosshair' ? 'default' : 'crosshair' }}
    >
      {/* RENDER SAVED DRAWINGS */}
      {drawings.map(d => {
        const c1 = getCoords(d.p1);
        const c2 = d.p2 ? getCoords(d.p2) : null;
        if (!c1 || !c2) return null;
        return (
          <g key={d.id}>
             <line 
               x1={c1.x ?? 0} 
               y1={c1.y ?? 0} 
               x2={c2.x ?? 0} 
               y2={c2.y ?? 0} 
               stroke="#21ce99" 
               strokeWidth="2" 
             />
             <circle cx={c1.x ?? 0} cy={c1.y ?? 0} r="3" fill="#fff" />
             <circle cx={c2.x ?? 0} cy={c2.y ?? 0} r="3" fill="#fff" />
          </g>
        );
      })}

      {/* RENDER CURRENT DRAWING (PREVIEW) */}
      {currentDrawing && (() => {
          const c1 = getCoords(currentDrawing.p1);
          const c2 = currentDrawing.p2 ? getCoords(currentDrawing.p2) : null;
          if (!c1 || !c2) return null;
          return (
            <line 
              x1={c1.x ?? 0} 
              y1={c1.y ?? 0} 
              x2={c2.x ?? 0} 
              y2={c2.y ?? 0} 
              stroke="#fff" 
              strokeWidth="1" 
              strokeDasharray="5,5" 
            />
          );
      })()}
    </svg>
  );
}