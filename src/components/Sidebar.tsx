import React, { useState, useRef, useEffect } from 'react'; 
import { 
  TrendingUp, 
  Target, 
  Hash, 
  Pencil, 
  Type, 
  Ruler, 
  ZoomIn,
  Lock, 
  Eye, 
  EyeOff, 
  Trash2, 
  Minus, 
  XSquare,
  BarChart2,
  Square,       
  Brush,
  Highlighter,
  MessageSquare, 
  Tag,
  LineChart,
  Activity,
  BarChart,
} from 'lucide-react';
import { type ChartStyle } from '../types';

interface SidebarProps {
  activeTool: string | null;
  onToolSelect: (tool: string | null) => void;
  onClear: () => void;
  onRemoveSelected: () => void;
  
  isLocked: boolean;
  onToggleLock: () => void;
  isHidden: boolean;
  onToggleHide: () => void;
  
  // CHART STYLE PROPS
  chartStyle: ChartStyle;
  onChartStyleChange: (style: ChartStyle) => void;
}

export default function Sidebar({ 
  activeTool, 
  onToolSelect, 
  onClear, 
  onRemoveSelected,
  isLocked,
  onToggleLock,
  isHidden,
  onToggleHide,
  chartStyle,
  onChartStyleChange
}: SidebarProps) {
  
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Helper to get the active icon
  const getStyleIcon = (style: ChartStyle) => {
    switch (style) {
      case 'candles': return <BarChart2 size={20} />;
      case 'bars': return <BarChart size={20} className="rotate-90" />;
      case 'line': return <LineChart size={20} />;
      case 'area': return <TrendingUp size={20} />;
      case 'stepline': return <Activity size={20} />; 
      case 'baseline': return <Minus size={20} />;
      default: return <BarChart2 size={20} />;
    }
  };

  const styleOptions: { id: ChartStyle; label: string; icon: React.ReactNode }[] = [
    { id: 'candles', label: 'Candles', icon: <BarChart2 size={16} /> },
    { id: 'bars', label: 'Bars', icon: <BarChart size={16} className="rotate-90" /> },
    { id: 'line', label: 'Line', icon: <LineChart size={16} /> },
    { id: 'area', label: 'Area', icon: <TrendingUp size={16} /> },
    { id: 'stepline', label: 'Step Line', icon: <Activity size={16} /> },
    { id: 'baseline', label: 'High-Low', icon: <Minus size={16} /> },
  ];

  // TOP TOOLS
  const toolGroups = [
    { id: 'crosshair', icon: <Target size={20} />, label: 'Crosshair', action: 'toggle' },
    
    // --- CHART STYLE SELECTOR ---
    { 
      id: 'style', 
      icon: getStyleIcon(chartStyle), 
      label: 'Chart Style', 
      items: styleOptions.map(opt => ({
        id: opt.id,
        label: opt.label,
        icon: opt.icon,
        action: () => onChartStyleChange(opt.id)
      }))
    },

    { id: 'lines', icon: <TrendingUp size={20} />, label: 'Line Tools', items: [
        { id: 'trend', label: 'Trend Line', icon: <TrendingUp size={16} /> },
        { id: 'horizontal', label: 'Horizontal Line', icon: <Minus size={16} /> },
      ]
    },
    { id: 'fib', icon: <Hash size={20} />, label: 'Gann & Fibonacci', items: [
        { id: 'fib', label: 'Fib Retracement', icon: <Hash size={16} /> },
        { id: 'fib_trend', label: 'Trend-Based Fib Ext', icon: <BarChart2 size={16} /> } 
      ] 
    },
    { id: 'shapes', icon: <Pencil size={20} />, label: 'Geometric Shapes', items: [
        { id: 'brush', label: 'Brush', icon: <Brush size={16} /> },
        { id: 'highlighter', label: 'Highlighter', icon: <Highlighter size={16} /> },
        { id: 'rect', label: 'Rectangle', icon: <Square size={16} /> }
      ]
    },
    { id: 'text', icon: <Type size={20} />, label: 'Text Tools', items: [
        { id: 'text', label: 'Text', icon: <Type size={16} /> },
        { id: 'comment', label: 'Comment', icon: <MessageSquare size={16} /> },
        { id: 'price_label', label: 'Price Label', icon: <Tag size={16} /> }
      ]
    },
    { id: 'measure', icon: <Ruler size={20} />, label: 'Measure' },
    { id: 'zoom', icon: <ZoomIn size={20} />, label: 'Zoom' }, 
  ];

  // Moved 'delete' (Remove) to be part of the main toolGroups list at the end so it's not at the very bottom
  // But strictly based on "bottomTools" array:
  const bottomTools = [
    { 
      id: 'delete', 
      icon: <Trash2 size={20} />, 
      label: 'Remove',
      items: [
        { id: 'remove_selected', label: 'Remove Selected', icon: <XSquare size={16} />, action: onRemoveSelected },
        { id: 'clear_drawings', label: 'Remove All Drawings', icon: <Trash2 size={16} />, action: onClear },
      ]
    },
    { 
      id: 'lock', 
      icon: <Lock size={20} />, 
      label: isLocked ? 'Unlock All' : 'Lock All',
      action: 'custom',
      isActive: isLocked,
      onClick: onToggleLock 
    },
    { 
      id: 'hide', 
      icon: isHidden ? <EyeOff size={20} /> : <Eye size={20} />, 
      label: isHidden ? 'Show All' : 'Hide All',
      action: 'custom',
      isActive: isHidden,
      onClick: onToggleHide 
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openGroupId && !(event.target as Element).closest('.sidebar-menu-item')) {
        setOpenGroupId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openGroupId]);

  const handleGroupClick = (group: any) => {
    // 1. FIX TOGGLE LOGIC
    if (group.action === 'toggle') {
      if (activeTool === group.id) {
         onToolSelect(null); // Turn off if already active
      } else {
         onToolSelect(group.id);
      }
      setOpenGroupId(null);
      return;
    }

    if (group.items) {
      if (openGroupId === group.id) {
        setOpenGroupId(null);
      } else {
        // 2. CALCULATE FIXED POSITION
        const btn = buttonRefs.current[group.id];
        if (btn) {
          const rect = btn.getBoundingClientRect();
          // Position to the right of the sidebar button
          setMenuPosition({ top: rect.top, left: rect.right + 10 });
        }
        setOpenGroupId(group.id);
      }
    } else {
      if (group.action === 'custom' && group.onClick) {
        group.onClick();
      } else {
        // Simple tool select logic
        if (activeTool === group.id) onToolSelect(null);
        else onToolSelect(group.id);
      }
      setOpenGroupId(null);
    }
  };

  const handleSubItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else {
      onToolSelect(item.id);
    }
    setOpenGroupId(null);
  };

  const renderToolButton = (group: any) => {
    const isGroupActive = group.isActive 
      ? true 
      : group.items 
        ? group.items.some((item: any) => item.id === activeTool)
        : activeTool === group.id;

    return (
      <div key={group.id} className="relative flex items-center justify-center w-full sidebar-menu-item">
        <button
          ref={(el) => {
            buttonRefs.current[group.id] = el;
          }}
          onClick={() => handleGroupClick(group)}
          className={`p-2 rounded-lg transition-all relative flex items-center justify-center w-full
            ${isGroupActive 
              ? 'text-[#21ce99] bg-[#21ce99]/10' 
              : 'text-[#8b9bb4] hover:bg-[#2a303c] hover:text-white'
            }`}
          title={group.label}
        >
          {group.icon}
          {group.items && (
            <span className="absolute bottom-1 right-1 opacity-50 text-[8px]">◢</span>
          )}
        </button>
      </div>
    );
  };

  // 3. RENDER SUBMENU AS FIXED PORTAL-LIKE ELEMENT
  const renderSubMenu = () => {
    if (!openGroupId || !menuPosition) return null;
    
    // Find the active group
    const group = [...toolGroups, ...bottomTools].find(g => g.id === openGroupId);
    if (!group || !group.items) return null;

    return (
      <div 
        className="fixed z-[9999] bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl p-1 min-w-[160px] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 sidebar-menu-item"
        style={{ top: menuPosition.top, left: menuPosition.left }}
      >
          {group.items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleSubItemClick(item)}
              className={`flex items-center gap-3 px-3 py-2 text-xs rounded hover:bg-[#2a303c] w-full text-left font-medium
                ${activeTool === item.id ? 'text-[#21ce99] bg-[#21ce99]/10' : 'text-[#8b9bb4]'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
      </div>
    );
  };

  return (
    <>
      <div className="w-14 bg-[#151a21] border-r border-[#2a2e39] flex flex-col items-center py-4 gap-4 z-40 relative">
        <div className="flex flex-col gap-2 w-full px-2">
          {toolGroups.map(renderToolButton)}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-2 w-full px-2">
          {bottomTools.map(renderToolButton)}
        </div>
      </div>
      
      {/* Render the submenu OUTSIDE the sidebar hierarchy */}
      {renderSubMenu()}
    </>
  );
}