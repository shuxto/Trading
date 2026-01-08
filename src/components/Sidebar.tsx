import { 
  MousePointer2, 
  TrendingUp, 
  Target, 
  Hash, 
  Pencil, 
  Type, 
  Smile, 
  Ruler, 
  Search, 
  Magnet, 
  Lock, 
  Eye, 
  Trash2,
  Minus 
} from 'lucide-react';

interface SidebarProps {
  activeTool: string | null;
  onToolSelect: (tool: string | null) => void; // UPDATED: Accepts null now
  onClear: () => void;
}

export default function Sidebar({ activeTool, onToolSelect, onClear }: SidebarProps) {
  
  const tools = [
    { id: 'crosshair', icon: <Target size={20} />, label: 'Crosshair' },
    { id: 'trend', icon: <TrendingUp size={20} />, label: 'Trend Line' },
    { id: 'horizontal', icon: <Minus size={20} />, label: 'Horizontal Line' },
    { id: 'fib', icon: <Hash size={20} />, label: 'Fibonacci' },
    { id: 'brush', icon: <Pencil size={20} />, label: 'Brush' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'pattern', icon: <MousePointer2 size={20} />, label: 'Patterns' },
    { id: 'prediction', icon: <Smile size={20} />, label: 'Prediction' },
    { id: 'measure', icon: <Ruler size={20} />, label: 'Measure' },
    { id: 'zoom', icon: <Search size={20} />, label: 'Zoom' },
  ];

  const bottomTools = [
    { id: 'magnet', icon: <Magnet size={20} />, label: 'Weak Magnet' },
    { id: 'lock', icon: <Lock size={20} />, label: 'Lock All' },
    { id: 'hide', icon: <Eye size={20} />, label: 'Hide All' },
    { id: 'delete', icon: <Trash2 size={20} />, label: 'Delete All', action: onClear },
  ];

  // LOGIC: Handle Toggle for Crosshair
  const handleToolClick = (toolId: string) => {
    if (toolId === 'crosshair' && activeTool === 'crosshair') {
      // If Crosshair is already active, turn it OFF
      onToolSelect(null);
    } else {
      // Otherwise, select the tool normally
      onToolSelect(toolId);
    }
  };

  return (
    <div className="w-14 bg-[#151a21] border-r border-[#2a2e39] flex flex-col items-center py-4 gap-4 z-40">
      
      {/* MAIN TOOLS */}
      <div className="flex flex-col gap-2 w-full px-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`p-2 rounded-lg transition-all group relative flex items-center justify-center
              ${activeTool === tool.id 
                ? 'bg-[#21ce99] text-black shadow-[0_0_10px_rgba(33,206,153,0.4)]' 
                : 'text-[#8b9bb4] hover:bg-[#2a303c] hover:text-white'
              }`}
            title={tool.label}
          >
            {tool.icon}
            
            <span className="absolute left-12 bg-[#0b0e11] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#2a2e39] pointer-events-none z-50">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* BOTTOM TOOLS */}
      <div className="flex flex-col gap-2 w-full px-2">
        {bottomTools.map((tool) => (
          <button
            key={tool.id}
            onClick={tool.action || (() => handleToolClick(tool.id))}
            className="p-2 rounded-lg text-[#8b9bb4] hover:text-red-400 hover:bg-[#2a303c] transition-colors flex items-center justify-center"
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}