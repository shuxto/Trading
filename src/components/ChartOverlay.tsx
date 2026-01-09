import { useEffect, useState } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

interface Drawing {
  id: number;
  type: 'trend' | 'horizontal' | 'fib' | 'rect' | 'brush' | 'highlighter' | 'text' | 'comment' | 'price_label' | 'measure';
  p1: { time: number; price: number };
  p2?: { time: number; price: number };
  points?: { time: number; price: number }[];
  text?: string;
}

interface OverlayProps {
  chart: IChartApi | null;
  series: ISeriesApi<"Area"> | null;
  activeTool: string | null;
  onToolComplete: () => void;
  clearTrigger: number;
  removeSelectedTrigger: number;
}

const FIB_LEVELS = [
  { level: 0, color: '#787b86' },
  { level: 0.236, color: '#f23645' },
  { level: 0.382, color: '#ff9800' },
  { level: 0.5, color: '#4caf50' },
  { level: 0.618, color: '#089981' },
  { level: 0.786, color: '#2962ff' },
  { level: 1, color: '#787b86' },
];

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

  // --- INTERACTION LOGIC ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chart || !series || !activeTool || activeTool === 'crosshair') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price === null || time === null) return;
    const timeNum = time as number;
    const point = { time: timeNum, price };

    // 1. INSTANT TEXT TOOLS (Browser Prompt)
    if (activeTool === 'text' || activeTool === 'comment' || activeTool === 'price_label') {
        let content = '';
        if (activeTool === 'price_label') {
            content = price.toFixed(2);
        } else {
            const userInput = window.prompt("Enter text:", "");
            if (!userInput) return;
            content = userInput;
        }

        const newDrawing: Drawing = {
            id: Date.now(),
            type: activeTool as any,
            p1: point,
            text: content
        };
        setDrawings([...drawings, newDrawing]);
        onToolComplete();
        return;
    }

    // 2. FREEHAND TOOLS
    if (activeTool === 'brush' || activeTool === 'highlighter') {
        setCurrentDrawing({
            id: Date.now(),
            type: activeTool,
            p1: point, 
            points: [point] 
        });
        setSelectedId(null);
        return;
    }

    // 3. CLICK-TO-CLICK TOOLS (Line, Fib, Rect, MEASURE)
    if (!currentDrawing) {
      let drawingType: Drawing['type'] = 'trend';
      if (activeTool === 'horizontal') drawingType = 'horizontal';
      if (activeTool === 'fib') drawingType = 'fib';
      if (activeTool === 'rect') drawingType = 'rect';
      if (activeTool === 'measure') drawingType = 'measure'; // Added Measure

      setCurrentDrawing({
        id: Date.now(),
        type: drawingType,
        p1: point,
        p2: point
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
      const timeNum = time as number;

      if (currentDrawing.type === 'brush' || currentDrawing.type === 'highlighter') {
        const newPoints = currentDrawing.points ? [...currentDrawing.points, { time: timeNum, price }] : [{ time: timeNum, price }];
        setCurrentDrawing({ ...currentDrawing, points: newPoints });
        return;
      }

      const nextPrice = currentDrawing.type === 'horizontal' ? currentDrawing.p1.price : price;
      setCurrentDrawing({ ...currentDrawing, p2: { time: timeNum, price: nextPrice } });
    }
  };

  const handleMouseUp = () => {
    if (currentDrawing && (currentDrawing.type === 'brush' || currentDrawing.type === 'highlighter')) {
        setDrawings([...drawings, currentDrawing]);
        setCurrentDrawing(null);
    }
  };

  const getCoords = (p: { time: number; price: number }) => {
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(p.time as Time);
    const y = series.priceToCoordinate(p.price);
    return { x, y };
  };

  const renderLine = (d: Drawing, isPreview = false) => {
    const isSelected = selectedId === d.id;
    const strokeColor = isSelected ? '#F07000' : '#21ce99';

    const handleLineMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (!isPreview) setSelectedId(d.id);
    };

    const commonProps = {
      key: d.id || 'preview',
      onMouseDown: handleLineMouseDown,
      style: { cursor: 'pointer', pointerEvents: 'auto' as const }
    };

    const c1 = getCoords(d.p1);
    
    // TEXT TOOLS
    if (d.type === 'text') {
        if (!c1 || !c1.x || !c1.y) return null;
        return (<g {...commonProps}><text x={c1.x} y={c1.y} fill={isSelected ? '#F07000' : '#ffffff'} fontSize="14" fontWeight="bold" style={{ userSelect: 'none' }}>{d.text}</text></g>);
    }
    if (d.type === 'price_label') {
        if (!c1 || !c1.x || !c1.y) return null;
        return (<g {...commonProps}><rect x={c1.x} y={c1.y - 12} width="80" height="24" rx="4" fill="#2a2e39" stroke={strokeColor} strokeWidth={isSelected ? 2 : 1} /><path d={`M ${c1.x} ${c1.y} L ${c1.x - 6} ${c1.y - 4} L ${c1.x - 6} ${c1.y + 4} Z`} fill={strokeColor} /><text x={c1.x + 10} y={c1.y + 4} fill="#fff" fontSize="12" fontFamily="monospace" style={{ userSelect: 'none' }}>{d.text}</text></g>);
    }
    if (d.type === 'comment') {
        if (!c1 || !c1.x || !c1.y) return null;
        return (<g {...commonProps}><circle cx={c1.x} cy={c1.y} r="4" fill={strokeColor} /><line x1={c1.x} y1={c1.y} x2={c1.x + 20} y2={c1.y - 30} stroke={strokeColor} strokeWidth="1" /><rect x={c1.x + 20} y={c1.y - 50} width="120" height="40" rx="8" fill="#1e222d" stroke={strokeColor} strokeWidth={isSelected ? 2 : 1} /><text x={c1.x + 30} y={c1.y - 25} fill="#fff" fontSize="12" style={{ userSelect: 'none' }}>{d.text}</text></g>);
    }
    // FREEHAND
    if (d.type === 'brush' || d.type === 'highlighter') {
        if (!d.points || d.points.length < 2) return null;
        const pathData = d.points.map((p, i) => { const c = getCoords(p); return (!c || c.x === null || c.y === null) ? '' : `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`; }).join(' ');
        const isHighlighter = d.type === 'highlighter';
        return (<g {...commonProps}><path d={pathData} fill="none" stroke={isHighlighter ? "#FFFF00" : strokeColor} strokeWidth={isHighlighter ? "20" : "2"} strokeLinecap="round" strokeLinejoin="round" opacity={isHighlighter ? 0.4 : 1} />{!isHighlighter && <path d={pathData} fill="none" stroke="transparent" strokeWidth="15" />}</g>)
    }

    const c2 = d.p2 ? getCoords(d.p2) : null;
    if (!c1 || !c1.x || !c1.y) return null;
    const x1 = c1.x; const y1 = c1.y;
    const x2 = c2 ? (c2.x ?? x1) : x1; 
    const y2 = c2 ? (c2.y ?? y1) : y1;

    // MEASURE TOOL
    if (d.type === 'measure') {
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const width = Math.abs(x1 - x2);
        const height = Math.abs(y1 - y2);
        
        const priceDiff = (d.p2?.price ?? d.p1.price) - d.p1.price;
        const percentDiff = (priceDiff / d.p1.price) * 100;
        // Simple approx time calc in minutes (assuming 1 unit = 1 sec if not proper timestamp, but good enough for visual)
        const timeDiff = Math.abs((d.p2?.time ?? d.p1.time) - d.p1.time) / 60; 
        const isPositive = priceDiff >= 0;
        const bg = '#2196f3'; // Measure Blue
        
        return (
             <g {...commonProps}>
                <rect x={left} y={top} width={width} height={height} fill={bg} fillOpacity="0.2" stroke={bg} strokeWidth="1" />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={bg} strokeWidth="2" strokeDasharray="4,4" />
                {/* Badge */}
                <rect x={left + (width/2) - 60} y={top + (height/2) - 20} width="120" height="40" rx="4" fill="#131722" stroke={bg} strokeWidth="1" />
                <text x={left + (width/2)} y={top + (height/2) - 4} textAnchor="middle" fill={isPositive ? '#4caf50' : '#f23645'} fontSize="11" fontWeight="bold">
                    {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(2)} ({percentDiff.toFixed(2)}%)
                </text>
                <text x={left + (width/2)} y={top + (height/2) + 12} textAnchor="middle" fill="#8b9bb4" fontSize="10">
                    {Math.round(timeDiff)} min
                </text>
             </g>
        )
    }

    // SHAPES
    if (d.type === 'rect') {
        const left = Math.min(x1, x2); const top = Math.min(y1, y2);
        return (<g {...commonProps}><rect x={left} y={top} width={Math.abs(x1 - x2)} height={Math.abs(y1 - y2)} stroke={strokeColor} strokeWidth="2" fill={strokeColor} fillOpacity="0.1" />{!isPreview && (<><circle cx={x1} cy={y1} r="3" fill="#fff" /><circle cx={x2} cy={y2} r="3" fill="#fff" /></>)}</g>)
    }
    if (d.type === 'horizontal') {
      return (<g {...commonProps}><line x1="0" y1={y1} x2="100%" y2={y1} stroke="transparent" strokeWidth="15" /><line x1="0" y1={y1} x2="100%" y2={y1} stroke={isPreview ? "#ffffff" : strokeColor} strokeWidth={isSelected ? "3" : "2"} strokeDasharray={isPreview ? "5,5" : ""} /></g>);
    } 
    // FIB
    if (d.type === 'fib') {
      if (!d.p2) return null; const diffPrice = d.p2.price - d.p1.price; const leftX = Math.min(x1, x2); const width = Math.abs(x1 - x2);
      return (<g {...commonProps}>{FIB_LEVELS.map((fib, i) => { if (i === FIB_LEVELS.length - 1) return null; const nextFib = FIB_LEVELS[i + 1]; const lvl1 = d.p1.price + (diffPrice * fib.level); const lvl2 = d.p1.price + (diffPrice * nextFib.level); const y1_px = series?.priceToCoordinate(lvl1) ?? 0; const y2_px = series?.priceToCoordinate(lvl2) ?? 0; return (<rect key={`bg-${i}`} x={leftX} y={Math.min(y1_px, y2_px)} width={width} height={Math.abs(y1_px - y2_px)} fill={fib.color} opacity={0.12} />); })}<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />{FIB_LEVELS.map((fib) => { const levelPrice = d.p1.price + (diffPrice * fib.level); const levelY = series?.priceToCoordinate(levelPrice) ?? 0; return (<g key={fib.level}><line x1={leftX} y1={levelY} x2={Math.max(x1, x2)} y2={levelY} stroke={isSelected ? '#F07000' : fib.color} strokeWidth={isSelected ? 2 : 1} opacity={0.8} />{width > 30 && (<text x={leftX + 4} y={levelY - 4} fill={fib.color} fontSize="10" fontFamily="monospace" fontWeight="bold">{fib.level}</text>)}</g>); })}<rect x={leftX} y={Math.min(y1, y2)} width={width} height={Math.abs(y1 - y2)} fill="transparent" /></g>);
    }
    
    // TREND LINE
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ 
        pointerEvents: activeTool && activeTool !== 'crosshair' ? 'auto' : 'none', 
        cursor: activeTool === 'crosshair' ? 'default' : 'crosshair' 
      }}
    >
      {selectedId !== null && (
        <rect width="100%" height="100%" fill="transparent" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(null); }} />
      )}
      
      {drawings.map(d => renderLine(d))}
      {currentDrawing && renderLine(currentDrawing, true)}
    </svg>
  );
}