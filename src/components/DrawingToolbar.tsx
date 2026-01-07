import { useState } from 'react';
import { 
  Crosshair, 
  TrendingUp, 
  MousePointer2, 
  Type, 
  Hash, 
  Smile, 
  Ruler, 
  Search, 
  Magnet, 
  Lock, 
  Eye, 
  Trash2,
  MoreHorizontal,
  PenTool
} from 'lucide-react';

export default function DrawingToolbar() {
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');

  const tools = [
    { id: 'crosshair', icon: Crosshair, label: 'Crosshair' },
    { id: 'trend', icon: TrendingUp, label: 'Trend Line' }, // Represents the Line tool
    { id: 'fib', icon: Hash, label: 'Fib Retracement' },    // Represents the Pitchfork/Fib tool
    { id: 'brush', icon: PenTool, label: 'Brush' },         // Represents the Brush
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'pattern', icon: MousePointer2, label: 'Patterns' }, // Represents the Head & Shoulders icon
    { id: 'sticker', icon: Smile, label: 'Icons' },
    { id: 'measure', icon: Ruler, label: 'Measure' },
    { id: 'zoom', icon: Search, label: 'Zoom In' },
  ];

  const bottomTools = [
    { id: 'magnet', icon: Magnet, label: 'Weak Magnet' },
    { id: 'lock', icon: Lock, label: 'Lock All Drawings' },
    { id: 'hide', icon: Eye, label: 'Hide Drawings' },
    { id: 'remove', icon: Trash2, label: 'Remove Objects' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[50px] border-r border-[#2a2e39] bg-[#151a21] z-20 items-center py-4 gap-4">
      
      {/* TOP GROUP: Main Drawing Tools */}
      <div className="flex flex-col gap-1 w-full px-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`
              w-full aspect-square rounded flex items-center justify-center transition-all group relative
              ${activeTool === tool.id 
                ? 'bg-[#21ce99]/10 text-[#21ce99] shadow-[0_0_10px_rgba(33,206,153,0.2)]' 
                : 'text-[#8b9bb4] hover:bg-[#2a303c] hover:text-white'}
            `}
          >
            <tool.icon size={18} strokeWidth={1.5} />
            
            {/* HOVER TOOLTIP (Like TradingView) */}
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#0b0e11] border border-[#2a2e39] text-[10px] text-white whitespace-nowrap rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      {/* DIVIDER */}
      <div className="w-4 h-[1px] bg-[#2a2e39]"></div>

      {/* BOTTOM GROUP: Utility Tools */}
      <div className="flex flex-col gap-1 w-full px-2 mt-auto">
        {bottomTools.map((tool) => (
          <button
            key={tool.id}
            className="w-full aspect-square rounded flex items-center justify-center text-[#8b9bb4] hover:bg-[#2a303c] hover:text-white transition-all group relative"
          >
            <tool.icon size={18} strokeWidth={1.5} />
             <span className="absolute left-full ml-3 px-2 py-1 bg-[#0b0e11] border border-[#2a2e39] text-[10px] text-white whitespace-nowrap rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

    </aside>
  );
}