import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, X, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useClock } from '../hooks/useClock';
import type { Order } from "../types";

interface PositionsPanelProps {
  orders: Order[];
  currentPrice: number | null;
  onCloseOrder: (id: number) => void;
  // ✅ NEW: Trigger to auto-open
  lastOrderTime?: number;
}

export default function PositionsPanel({ orders, currentPrice, onCloseOrder, lastOrderTime }: PositionsPanelProps) {
  // ✅ CLOSED by default
  const [isOpen, setIsOpen] = useState(false);
  const currentTime = useClock();

  // ✅ Auto-open when a new trade happens (Buy/Sell/Close)
  useEffect(() => {
    if (lastOrderTime && lastOrderTime > 0) {
        setIsOpen(true);
    }
  }, [lastOrderTime]);

  return (
    <motion.div 
      initial={{ height: 40 }}
      animate={{ height: isOpen ? 250 : 40 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#151a21] border-t border-[#2a2e39] flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
    >
      {/* --- HEADER (STATUS BAR) --- */}
      <div 
        className="h-10 flex items-center px-4 bg-[#191f2e] border-b border-[#2a2e39] cursor-pointer hover:bg-[#1e232d] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* LEFT: TABS */}
        <div className="flex items-center gap-4">
            <button className={`text-xs font-bold px-2 py-1 rounded transition-colors ${isOpen ? 'text-[#F0B90B] bg-[#F0B90B]/10' : 'text-gray-400'}`}>
                Positions ({orders.length})
            </button>
            <button className="text-xs font-bold text-gray-500 hover:text-gray-300">Open Orders (0)</button>
            <button className="text-xs font-bold text-gray-500 hover:text-gray-300">History</button>
        </div>
        
        {/* RIGHT: LIVE STATUS + PRICE + CLOCK */}
        <div className="ml-auto flex items-center gap-6">
            
            {/* 1. LIVE INDICATOR */}
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#21ce99] rounded-full animate-pulse shadow-[0_0_10px_#21ce99]"></div>
                <span className="text-[10px] text-[#21ce99] font-mono font-bold tracking-widest">LIVE</span>
            </div>

            <div className="h-3 w-[1px] bg-[#2a2e39]"></div>

            {/* 2. CURRENT PRICE */}
            <span className={`text-[11px] font-mono font-bold transition-colors ${currentPrice ? 'text-white' : 'text-gray-500'}`}>
                {currentPrice ? currentPrice.toFixed(2) : '---'}
            </span>

            <div className="h-3 w-[1px] bg-[#2a2e39]"></div>

            {/* 3. CLOCK */}
            <div className="flex items-center gap-2 text-[#5e6673]">
                <Clock size={12} />
                <span className="text-[10px] font-mono font-bold tabular-nums">{currentTime}</span>
            </div>

            {/* CHEVRON */}
            <div className="pl-4 text-gray-500">
                {isOpen ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
            </div>
        </div>
      </div>

      {/* --- CONTENT (Table) --- */}
      <div className="flex-1 overflow-auto bg-[#151a21] custom-scrollbar">
         <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#151a21] z-10 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
               <tr>
                  <th className="px-4 py-2 border-b border-[#2a2e39]">Symbol</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39]">Side</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39] text-right">Size</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39] text-right">Entry Price</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39] text-right">Mark Price</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39] text-right">Liq. Price</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39] text-right">PnL (ROE%)</th>
                  <th className="px-4 py-2 border-b border-[#2a2e39] text-center">Close</th>
               </tr>
            </thead>
            <tbody className="text-xs font-mono font-medium text-gray-300">
               {orders.length === 0 ? (
                  <tr>
                     <td colSpan={8} className="text-center py-10 text-gray-600 italic">No open positions</td>
                  </tr>
               ) : (
                  orders.map(order => {
                      const price = currentPrice || 0;
                      const diff = price - order.entryPrice;
                      const pnlPercent = diff / order.entryPrice * 100 * (order.type === 'buy' ? 1 : -1) * order.leverage;
                      const pnlValue = (order.margin * pnlPercent / 100);
                      const isProfit = pnlValue >= 0;

                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors border-b border-[#2a2e39]/50">
                           <td className="px-4 py-2 flex items-center gap-2">
                              <span className="font-bold text-white">{order.symbol}</span>
                              <span className="px-1 py-0.5 rounded bg-gray-800 text-[9px] text-gray-400">{order.leverage}x</span>
                           </td>
                           <td className={`px-4 py-2 font-bold ${order.type === 'buy' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                              {order.type.toUpperCase()}
                           </td>
                           <td className="px-4 py-2 text-right">${order.size.toLocaleString()}</td>
                           <td className="px-4 py-2 text-right">{order.entryPrice.toFixed(2)}</td>
                           <td className="px-4 py-2 text-right">{price.toFixed(2)}</td>
                           <td className="px-4 py-2 text-right text-[#F0B90B]">{order.liquidationPrice.toFixed(2)}</td>
                           <td className={`px-4 py-2 text-right font-bold ${isProfit ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                              {pnlValue > 0 ? '+' : ''}{pnlValue.toFixed(2)} <span className="text-[10px] opacity-70">({pnlPercent.toFixed(2)}%)</span>
                           </td>
                           <td className="px-4 py-2 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onCloseOrder(order.id); }}
                                className="p-1 hover:bg-[#2a2e39] rounded text-gray-500 hover:text-white transition-colors"
                              >
                                  <X size={14} />
                              </button>
                           </td>
                        </tr>
                      );
                  })
               )}
            </tbody>
         </table>
      </div>
    </motion.div>
  );
}