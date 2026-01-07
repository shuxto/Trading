import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Copy, RefreshCcw } from 'lucide-react';

interface ChartContextMenuProps {
  x: number;
  y: number;
  price: number;
  onClose: () => void;
  onAction: (action: string, price: number) => void;
}

export default function ChartContextMenu({ x, y, price, onClose, onAction }: ChartContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close if clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.1 }}
        style={{ top: y, left: x }}
        className="fixed z-[999] min-w-[180px] bg-[#151a21]/95 backdrop-blur-xl border border-[#2a2e39] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col py-1"
      >
        
        {/* PRICE HEADER */}
        <div className="px-3 py-2 text-[10px] text-[#5e6673] font-mono border-b border-[#2a2e39] mb-1">
          PRICE: <span className="text-white font-bold">${price.toFixed(2)}</span>
        </div>

        {/* MENU ITEMS */}
        <button 
          onClick={() => onAction('buy', price)}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#21ce99] hover:bg-[#21ce99]/10 transition-colors text-left"
        >
          <TrendingUp size={16} /> 
          <span className="font-bold">Buy Limit</span>
        </button>

        <button 
          onClick={() => onAction('sell', price)}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#f4553b] hover:bg-[#f4553b]/10 transition-colors text-left"
        >
          <TrendingDown size={16} /> 
          <span className="font-bold">Sell Limit</span>
        </button>

        <div className="h-[1px] bg-[#2a2e39] my-1 mx-2"></div>

        <button 
          onClick={() => {
            navigator.clipboard.writeText(price.toString());
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#8b9bb4] hover:bg-[#2a303c] transition-colors text-left"
        >
          <Copy size={16} /> 
          <span>Copy Price</span>
        </button>

        <button 
          onClick={() => onAction('reset', 0)}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#8b9bb4] hover:bg-[#2a303c] transition-colors text-left"
        >
          <RefreshCcw size={16} /> 
          <span>Reset View</span>
        </button>

      </motion.div>
    </AnimatePresence>
  );
}