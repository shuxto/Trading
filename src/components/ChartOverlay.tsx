import { useEffect, useState } from 'react';
// FIX IS HERE: Added "type" keyword
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
  
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!chart) return;
    const handleResize = () => setTick(t => t + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [chart]);

  const handleClick = (e: React.MouseEvent) => {
    if (!chart || !series || !activeTool || activeTool === 'crosshair') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price === null || time === null) return;

    const timeNum = time as number;

    if (!currentDrawing) {
      setCurrentDrawing({
        id: Date.now(),
        type: 'trend',
        p1: { time: timeNum, price },
        p2: { time: timeNum, price }
      });
    } else {
      setDrawings([...drawings, { ...currentDrawing, p2: { time: timeNum, price } }]);
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
      setCurrentDrawing({ 
        ...currentDrawing, 
        p2: { time: time as number, price } 
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
      className="absolute inset-0 z-10 w-full h-full cursor-crosshair overflow-visible pointer-events-auto"
      onMouseDown={handleClick}
      onMouseMove={handleMouseMove}
      style={{ pointerEvents: activeTool && activeTool !== 'crosshair' ? 'auto' : 'none' }}
    >
      {drawings.map(d => {
        const c1 = getCoords(d.p1);
        const c2 = d.p2 ? getCoords(d.p2) : null;
        if (!c1 || !c2) return null;
        return (
          <g key={d.id}>
             <line x1={c1.x ?? 0} y1={c1.y ?? 0} x2={c2.x ?? 0} y2={c2.y ?? 0} stroke="#21ce99" strokeWidth="2" />
             <circle cx={c1.x ?? 0} cy={c1.y ?? 0} r="3" fill="#fff" />
             <circle cx={c2.x ?? 0} cy={c2.y ?? 0} r="3" fill="#fff" />
          </g>
        );
      })}
      {currentDrawing && (() => {
          const c1 = getCoords(currentDrawing.p1);
          const c2 = currentDrawing.p2 ? getCoords(currentDrawing.p2) : null;
          if (!c1 || !c2) return null;
          return <line x1={c1.x ?? 0} y1={c1.y ?? 0} x2={c2.x ?? 0} y2={c2.y ?? 0} stroke="#fff" strokeWidth="1" strokeDasharray="5,5" />;
      })()}
    </svg>
  );
}