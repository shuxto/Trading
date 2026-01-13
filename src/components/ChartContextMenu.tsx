import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCcw, Bell } from 'lucide-react';

interface ChartContextMenuProps {
  x: number;
  y: number;
  price: number;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
}

export default function ChartContextMenu({ x, y, price, onClose, onAction }: ChartContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu from going off-screen
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.05 }}
        className="fixed z-[1000] w-56 bg-[#1e222d] border border-[#2a2e39] shadow-2xl rounded-lg overflow-hidden py-1 text-sm font-sans select-none"
        style={{ left: adjustedX, top: adjustedY }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <div className="px-3 py-2 border-b border-[#2a2e39] flex justify-between items-center bg-[#2a2e39]/30">
           <span className="text-[#8b9bb4] text-[10px] font-bold uppercase tracking-wider">Trading</span>
           <span className="font-mono text-white font-bold text-xs">${price.toFixed(2)}</span>
        </div>

        {/* ACTIONS */}
        <div className="py-1">
          <button 
            onClick={() => onAction('buy_limit', { price })}
            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[#2a2e39] text-[#b2b5be] hover:text-[#21ce99] transition-colors group"
          >
            <TrendingUp size={14} className="group-hover:text-[#21ce99]" />
            <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-white">Buy Limit</span>
                <span className="text-[9px] opacity-60">Execute Long here</span>
            </div>
          </button>
          
          <button 
            onClick={() => onAction('sell_limit', { price })}
            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[#2a2e39] text-[#b2b5be] hover:text-[#f23645] transition-colors group"
          >
            <TrendingDown size={14} className="group-hover:text-[#f23645]" />
            <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-white">Sell Limit</span>
                <span className="text-[9px] opacity-60">Execute Short here</span>
            </div>
          </button>
        </div>

        <div className="h-[1px] bg-[#2a2e39] my-1" />

        {/* UTILITIES */}
        <div className="py-1">
          <button onClick={() => onAction('reset')} className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[#2a2e39] text-[#b2b5be] hover:text-white transition-colors">
            <RefreshCcw size={14} />
            <span className="text-xs">Reset View</span>
          </button>
          <button onClick={() => onAction('alert')} className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[#2a2e39] text-[#b2b5be] hover:text-white transition-colors">
            <Bell size={14} />
            <span className="text-xs">Add Alert</span>
          </button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}