import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { useClickSound } from '../hooks/useClickSound';
import type { Order } from '../types';

interface OrderPanelProps {
  currentPrice: number | null; 
  activeSymbol: string;
  onTrade: (order: Order) => void;
}

export default function OrderPanel({ currentPrice, activeSymbol, onTrade }: OrderPanelProps) {
  const playClick = useClickSound();
  
  // --- STATE ---
  const [tradingMode, setTradingMode] = useState<'spot' | 'futures'>('futures');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [leverage, setLeverage] = useState<number>(20);
  const [margin, setMargin] = useState<number>(100);
  
  // --- CALCULATIONS ---
  const price = currentPrice && currentPrice > 0 ? currentPrice : 0;
  
  // If Spot mode, leverage is always 1x
  const effectiveLeverage = tradingMode === 'spot' ? 1 : leverage;
  const buyingPower = margin * effectiveLeverage;
  
  // ✅ NOW DISPLAYED BELOW
  const qty = price > 0 ? buyingPower / price : 0;

  const liqPriceLong = price > 0 ? price * (1 - (1 / effectiveLeverage)) : 0;
  const liqPriceShort = price > 0 ? price * (1 + (1 / effectiveLeverage)) : 0;

  const handleTrade = (side: 'buy' | 'sell') => {
    if (price <= 0) return;
    playClick();

    const newOrder: Order = {
      id: Date.now(),
      type: side,
      symbol: activeSymbol,
      entryPrice: price,
      margin: margin,
      leverage: effectiveLeverage,
      size: buyingPower,
      liquidationPrice: side === 'buy' ? liqPriceLong : liqPriceShort,
      status: 'active'
    };

    onTrade(newOrder);
  };

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 h-[340px] bg-[#151a21] border-t border-white/10 flex flex-col shadow-[0_-5px_40px_rgba(0,0,0,0.6)] md:static md:w-[280px] md:h-full md:border-l md:border-t-0 md:bg-[#151a21] md:z-20">
      
      {/* TABS (Spot vs Futures) */}
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => { playClick(); setTradingMode('spot'); }}
          className={`flex-1 py-3 text-xs font-bold transition-all ${
            tradingMode === 'spot' 
            ? 'text-white bg-white/5 border-b-2 border-white' 
            : 'text-[#5e6673] hover:text-white'
          }`}
        >
          SPOT
        </button>
        <button 
          onClick={() => { playClick(); setTradingMode('futures'); }}
          className={`flex-1 py-3 text-xs font-bold transition-all ${
            tradingMode === 'futures' 
            ? 'text-[#F0B90B] bg-white/5 border-b-2 border-[#F0B90B]' 
            : 'text-[#5e6673] hover:text-white'
          }`}
        >
          FUTURES
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">

        {/* 1. ORDER TYPE */}
        <div className="flex bg-black/40 p-1 rounded-lg">
          {['market', 'limit'].map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type as any)}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${
                orderType === type ? 'bg-[#2a2e39] text-white shadow' : 'text-[#5e6673] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* 2. LEVERAGE SLIDER (Hidden in Spot) */}
        {tradingMode === 'futures' ? (
          <div className="space-y-3">
             <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-[#8b9bb4]">LEVERAGE</span>
                <span className="text-xl font-black text-[#F0B90B] font-mono">{leverage}x</span>
             </div>
             <div className="relative h-6 flex items-center group">
               <input 
                 type="range" min="1" max="125" step="1"
                 value={leverage} 
                 onChange={(e) => setLeverage(Number(e.target.value))}
                 className="w-full h-1 bg-[#2a2e39] rounded-lg appearance-none cursor-pointer accent-[#F0B90B] z-10"
               />
               <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-50">
                  {[1, 25, 50, 75, 100, 125].map(tick => (
                    <div key={tick} className="w-[1px] h-2 bg-white/10 mt-[-2px]"></div>
                  ))}
               </div>
             </div>
          </div>
        ) : (
          <div className="py-2 px-3 bg-white/5 rounded-lg border border-dashed border-white/10">
            <span className="text-[10px] text-[#5e6673] italic">Leverage is disabled in Spot mode.</span>
          </div>
        )}

        {/* 3. MARGIN INPUT */}
        <div className="space-y-1">
           <div className="flex justify-between">
              <span className="text-[10px] font-bold text-[#8b9bb4]">AMOUNT (USDT)</span>
              <div className="flex items-center gap-1 text-[10px] text-[#5e6673]">
                <Wallet size={10} />
                <span>$10,000</span>
              </div>
           </div>
           <div className="bg-[#0b0e11] border border-white/10 rounded-lg flex items-center px-3 py-3 focus-within:border-[#F0B90B] transition-colors relative">
              <span className="text-white font-mono mr-2">$</span>
              <input 
                 type="number" 
                 value={margin}
                 onChange={(e) => setMargin(Number(e.target.value))}
                 className="bg-transparent w-full text-right text-white font-bold font-mono outline-none"
              />
           </div>
        </div>

        {/* 4. MATH SUMMARY */}
        <div className="bg-white/5 rounded-lg p-3 space-y-2 border border-white/5">
           <div className="flex justify-between items-center text-[10px]">
              <span className="text-[#8b9bb4]">Position Size</span>
              <span className="text-white font-mono font-bold">${buyingPower.toLocaleString()}</span>
           </div>
           
           {/* ✅ Added this row to use the 'qty' variable */}
           <div className="flex justify-between items-center text-[10px]">
              <span className="text-[#8b9bb4]">Quantity</span>
              <span className="text-white font-mono">{qty.toFixed(4)} {activeSymbol.replace('USDT', '')}</span>
           </div>
           
           {tradingMode === 'futures' && (
             <div className="grid grid-cols-2 gap-2 text-[9px] mt-2 pt-2 border-t border-white/5">
                <div className="text-center">
                   <span className="text-[#21ce99] font-bold block">LONG LIQ</span>
                   <span className="font-mono text-white opacity-60">${liqPriceLong.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-center border-l border-white/5">
                   <span className="text-[#f23645] font-bold block">SHORT LIQ</span>
                   <span className="font-mono text-white opacity-60">${liqPriceShort.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* 5. BIG BUTTONS */}
      <div className="p-4 grid grid-cols-2 gap-3 mt-auto bg-[#0b0e11]/50 backdrop-blur-sm">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTrade('buy')}
          disabled={price <= 0}
          className="bg-[#21ce99] hover:bg-[#19b686] disabled:opacity-50 text-[#0b0e11] rounded-lg py-3 font-black text-sm transition-all flex flex-col items-center"
        >
          <span>BUY / LONG</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTrade('sell')}
          disabled={price <= 0}
          className="bg-[#f23645] hover:bg-[#d9303d] disabled:opacity-50 text-white rounded-lg py-3 font-black text-sm transition-all flex flex-col items-center"
        >
          <span>SELL / SHORT</span>
        </motion.button>
      </div>
    </aside>
  );
}