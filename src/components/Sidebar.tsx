import { useState } from 'react';
import { 
  MousePointer2, TrendingUp, Target, Hash, Pencil, Type, Smile, Ruler, Search, 
  Magnet, Lock, Eye, Trash2, Minus, Layers, XSquare // NEW ICON
} from 'lucide-react';

interface SidebarProps {
  activeTool: string | null;
  onToolSelect: (tool: string | null) => void;
  onClear: () => void;
  onRemoveSelected: () => void; // NEW PROP
}

export default function Sidebar({ activeTool, onToolSelect, onClear, onRemoveSelected }: SidebarProps) {
  
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  // TOP TOOLS (Unchanged)
  const toolGroups = [
    { id: 'crosshair', icon: <Target size={20} />, label: 'Crosshair', action: 'toggle' },
    { id: 'lines', icon: <TrendingUp size={20} />, label: 'Line Tools', items: [
        { id: 'trend', label: 'Trend Line', icon: <TrendingUp size={16} /> },
        { id: 'horizontal', label: 'Horizontal Line', icon: <Minus size={16} /> },
      ]
    },
    { id: 'fib', icon: <Hash size={20} />, label: 'Gann & Fibonacci', items: [{ id: 'fib', label: 'Fib Retracement', icon: <Hash size={16} /> }] },
    { id: 'shapes', icon: <Pencil size={20} />, label: 'Geometric Shapes', items: [
        { id: 'brush', label: 'Brush', icon: <Pencil size={16} /> },
        { id: 'rect', label: 'Rectangle', icon: <MousePointer2 size={16} /> } 
      ]
    },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'measure', icon: <Ruler size={20} />, label: 'Measure' },
    { id: 'zoom', icon: <Search size={20} />, label: 'Zoom' },
  ];

  // BOTTOM TOOLS (Updated with Remove Selected)
  const bottomTools = [
    { id: 'magnet', icon: <Magnet size={20} />, label: 'Weak Magnet' },
    { id: 'lock', icon: <Lock size={20} />, label: 'Lock All' },
    { id: 'hide', icon: <Eye size={20} />, label: 'Hide All' },
    { 
      id: 'delete', 
      icon: <Trash2 size={20} />, 
      label: 'Remove',
      items: [
        { id: 'remove_selected', label: 'Remove Selected', icon: <XSquare size={16} />, action: onRemoveSelected }, // NEW BUTTON
        { id: 'clear_drawings', label: 'Remove All Drawings', icon: <Trash2 size={16} />, action: onClear },
      ]
    },
  ];

  // ... (Keep handleGroupClick, handleSubItemClick, and renderToolButton exactly as before)
  // ... (If you need me to paste the helper functions again, let me know, but they are the same!)

  const handleGroupClick = (group: any) => {
    if (group.action === 'toggle') {
      if (activeTool === group.id) onToolSelect(null);
      else onToolSelect(group.id);
      setOpenGroupId(null);
      return;
    }
    if (group.items) {
      setOpenGroupId(openGroupId === group.id ? null : group.id);
    } else {
      if (group.action === 'custom' && group.onClick) group.onClick();
      else onToolSelect(group.id);
      setOpenGroupId(null);
    }
  };

  const handleSubItemClick = (item: any) => {
    if (item.action) item.action();
    else onToolSelect(item.id);
    setOpenGroupId(null);
  };

  const renderToolButton = (group: any) => {
    const isGroupActive = group.items ? group.items.some((item: any) => item.id === activeTool) : activeTool === group.id;
    const isOpen = openGroupId === group.id;

    return (
      <div key={group.id} className="relative flex items-center justify-center w-full">
        <button
          onClick={() => handleGroupClick(group)}
          className={`p-2 rounded-lg transition-all relative flex items-center justify-center w-full ${isGroupActive ? 'text-[#21ce99] bg-[#21ce99]/10' : 'text-[#8b9bb4] hover:bg-[#2a303c] hover:text-white'}`}
          title={group.label}
        >
          {group.icon}
          {group.items && <span className="absolute bottom-1 right-1 opacity-50 text-[8px]">◢</span>}
        </button>
        {group.items && isOpen && (
          <div className="absolute left-full bottom-0 ml-2 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl p-1 min-w-[160px] z-50 flex flex-col gap-1">
             {group.items.map((item: any) => (
               <button key={item.id} onClick={() => handleSubItemClick(item)} className={`flex items-center gap-3 px-3 py-2 text-xs rounded hover:bg-[#2a303c] w-full text-left ${activeTool === item.id ? 'text-[#21ce99] bg-[#21ce99]/10' : 'text-[#8b9bb4] text-gray-300'}`}>
                 {item.icon} <span>{item.label}</span>
               </button>
             ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-14 bg-[#151a21] border-r border-[#2a2e39] flex flex-col items-center py-4 gap-4 z-40 relative">
      <div className="flex flex-col gap-2 w-full px-2">{toolGroups.map(renderToolButton)}</div>
      <div className="flex-1" />
      <div className="flex flex-col gap-2 w-full px-2">{bottomTools.map(renderToolButton)}</div>
    </div>
  );
}