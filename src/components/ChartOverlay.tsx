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
  clearTrigger: number;
  removeSelectedTrigger: number;
}

export default function ChartOverlay({ chart, series, activeTool, onToolComplete, clearTrigger, removeSelectedTrigger }: OverlayProps) {
  
  const [drawings, setDrawings] = useState<Drawing[]>(() => {
    const saved = localStorage.getItem('chart_drawings');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem('chart_drawings', JSON.stringify(drawings));
  }, [drawings]);

  useEffect(() => {
    if (clearTrigger > 0) {
      setDrawings([]);
      localStorage.removeItem('chart_drawings');
      setSelectedId(null);
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (removeSelectedTrigger > 0 && selectedId !== null) {
      setDrawings(prev => prev.filter(d => d.id !== selectedId));
      setSelectedId(null);
    }
  }, [removeSelectedTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        setDrawings(prev => prev.filter(d => d.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

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
    // 1. If we clicked a line, selectedId is already set by handleLineMouseDown
    //    and propagation was stopped, so we won't even reach here!
    
    if (!chart || !series || !activeTool || activeTool === 'crosshair') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price === null || time === null) return;
    const timeNum = time as number;

    if (!currentDrawing) {
      const drawingType = activeTool === 'horizontal' ? 'horizontal' : 'trend';
      setCurrentDrawing({
        id: Date.now(),
        type: drawingType,
        p1: { time: timeNum, price },
        p2: { time: timeNum, price }
      });
      setSelectedId(null);
    } else {
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
      const nextPrice = currentDrawing.type === 'horizontal' ? currentDrawing.p1.price : price;
      setCurrentDrawing({ ...currentDrawing, p2: { time: time as number, price: nextPrice } });
    }
  };

  const getCoords = (p: { time: number; price: number }) => {
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(p.time as Time);
    const y = series.priceToCoordinate(p.price);
    return { x, y };
  };

  const renderLine = (d: Drawing, isPreview = false) => {
    const c1 = getCoords(d.p1);
    const c2 = d.p2 ? getCoords(d.p2) : null;
    if (!c1) return null;
    const x1 = c1.x ?? 0;
    const y1 = c1.y ?? 0;
    const x2 = c2 ? (c2.x ?? 0) : x1;
    const y2 = c2 ? (c2.y ?? 0) : y1;

    const isSelected = selectedId === d.id;
    const strokeColor = isSelected ? '#F07000' : '#21ce99';

    // FIX: Use onMouseDown (faster than onClick) and stopPropagation
    const handleLineMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation(); // CRITICAL: Stop the chart from hearing this click!
      if (!isPreview) setSelectedId(d.id);
    };

    // FIX: pointerEvents: 'auto' allows clicking this line even if activeTool is 'crosshair'
    const commonProps = {
      key: d.id || 'preview',
      onMouseDown: handleLineMouseDown,
      style: { cursor: 'pointer', pointerEvents: 'auto' as const }
    };

    if (d.type === 'horizontal') {
      return (
        <g {...commonProps}>
          <line x1="0" y1={y1} x2="100%" y2={y1} stroke="transparent" strokeWidth="15" />
          <line x1="0" y1={y1} x2="100%" y2={y1} stroke={isPreview ? "#ffffff" : strokeColor} strokeWidth={isSelected ? "3" : "2"} strokeDasharray={isPreview ? "5,5" : ""} />
        </g>
      );
    } 
    
    return (
      <g {...commonProps}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="15" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isPreview ? "#ffffff" : strokeColor} strokeWidth={isSelected ? "3" : "2"} strokeDasharray={isPreview ? "5,5" : ""} />
        {!isPreview && (<> <circle cx={x1} cy={y1} r="3" fill="#fff" /> <circle cx={x2} cy={y2} r="3" fill="#fff" /> </>)}
      </g>
    );
  };

  return (
    <svg 
      className="absolute inset-0 z-10 w-full h-full overflow-visible"
      onMouseDown={handleClick}
      onMouseMove={handleMouseMove}
      style={{ 
        // FIX: If we are in Crosshair mode, let clicks pass through (none)
        // BUT the lines inside have 'auto' so they will catch the clicks!
        pointerEvents: activeTool && activeTool !== 'crosshair' ? 'auto' : 'none', 
        cursor: activeTool === 'crosshair' ? 'default' : 'crosshair' 
      }}
    >
      {/* Click background to Deselect */}
      {selectedId !== null && (
        <rect width="100%" height="100%" fill="transparent" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(null); }} />
      )}
      
      {drawings.map(d => renderLine(d))}
      {currentDrawing && renderLine(currentDrawing, true)}
    </svg>
  );
}