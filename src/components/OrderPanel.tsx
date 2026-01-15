import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronUp, ChevronDown } from "lucide-react";
import { useClickSound } from '../hooks/useClickSound';
import type { Order } from '../types';

interface OrderPanelProps {
  currentPrice: number | null; 
  activeSymbol: string;
  onTrade: (order: Order) => void;
  activeAccountId: number; 
}

export default function OrderPanel({ currentPrice, activeSymbol, onTrade, activeAccountId }: OrderPanelProps) {
  const playClick = useClickSound();
  
  // --- STATE ---
  const [tradingMode, setTradingMode] = useState<'spot' | 'futures'>('spot');
  const [orderType, setOrderType] = useState<'market'>('market'); // Remove | 'limit'
  const [leverage, setLeverage] = useState<number>(20);
  const [margin, setMargin] = useState<number>(100);

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // TP/SL State
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  
  // --- CALCULATIONS ---
  const price = currentPrice && currentPrice > 0 ? currentPrice : 0;
  const effectiveLeverage = tradingMode === 'spot' ? 1 : leverage;
  const buyingPower = margin * effectiveLeverage;
  const qty = price > 0 ? buyingPower / price : 0;
  const liqPriceLong = price > 0 ? price * (1 - (1 / effectiveLeverage)) : 0;
  const liqPriceShort = price > 0 ? price * (1 + (1 / effectiveLeverage)) : 0;

  // Auto-fill TP/SL defaults when toggled
  useEffect(() => {
    if (tpEnabled && !tpPrice && price > 0) setTpPrice((price * 1.05).toFixed(2));
    if (slEnabled && !slPrice && price > 0) setSlPrice((price * 0.95).toFixed(2));
  }, [tpEnabled, slEnabled, price]);

  useEffect(() => {
    if (tradingMode === 'spot') {
      setTpEnabled(false);
      setSlEnabled(false);
    }
  }, [tradingMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileExpanded(true); 
      } else {
        setIsMobileExpanded(false); 
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDiff = (targetPrice: string) => {
    if (!price || !targetPrice) return '0.00';
    const val = parseFloat(targetPrice);
    if (isNaN(val)) return '0.00';
    const diff = ((val - price) / price) * 100;
    return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
  };

  const handleTrade = (side: 'buy' | 'sell') => {
    if (price <= 0) return;

    // --- 🛡️ KILLER BUG FIX: VALIDATION START ---
    
    // 1. Check Take Profit Logic
    if (tpEnabled && tpPrice) {
      const tp = parseFloat(tpPrice);
      if (side === 'buy' && tp <= price) {
        alert("⚠️ INVALID LONG: Take Profit must be HIGHER than current price.");
        return;
      }
      if (side === 'sell' && tp >= price) {
        alert("⚠️ INVALID SHORT: Take Profit must be LOWER than current price.");
        return;
      }
    }

    // 2. Check Stop Loss Logic
    if (slEnabled && slPrice) {
      const sl = parseFloat(slPrice);
      if (side === 'buy' && sl >= price) {
        alert("⚠️ INVALID LONG: Stop Loss must be LOWER than current price.");
        return;
      }
      if (side === 'sell' && sl <= price) {
        alert("⚠️ INVALID SHORT: Stop Loss must be HIGHER than current price.");
        return;
      }
    }
    // --- 🛡️ KILLER BUG FIX: VALIDATION END ---

    playClick();

    const newOrder: Order = {
      id: Date.now(),
      account_id: activeAccountId, 
      type: side,
      symbol: activeSymbol,
      entryPrice: price,
      margin: margin,
      leverage: effectiveLeverage,
      size: buyingPower,
      liquidationPrice: side === 'buy' ? liqPriceLong : liqPriceShort,
      status: 'active',
      takeProfit: tpEnabled && tpPrice ? parseFloat(tpPrice) : undefined,
      stopLoss: slEnabled && slPrice ? parseFloat(slPrice) : undefined,
    };

    onTrade(newOrder);
  };

  return (
    <aside className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col 
      bg-[#151a21]/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
      transition-all duration-300 ease-in-out
      ${isMobileExpanded ? 'h-[500px]' : 'h-auto'} 
      md:static md:w-[250px] md:h-full md:bg-[#151a21]/80`}>
      
      {/* MOBILE TOGGLE HANDLE */}
      <div 
        className="flex md:hidden items-center justify-center py-2 cursor-pointer active:bg-white/5"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
      >
        <div className="w-12 h-1 bg-gray-600 rounded-full mb-1"></div>
        <div className="absolute right-4 text-gray-500">
           {isMobileExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 
        ${isMobileExpanded ? 'block' : 'hidden'} md:block`}>
        
        {/* HEADER TABS */}
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 relative">
          <button 
            onClick={() => { playClick(); setTradingMode('spot'); }}
            className={`flex-1 py-2 text-[11px] font-bold tracking-wider rounded-lg transition-all relative z-10 ${
              tradingMode === 'spot' ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            SPOT
            {tradingMode === 'spot' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg -z-10 shadow-inner border border-white/10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </button>

          <button 
            onClick={() => { playClick(); setTradingMode('futures'); }}
            className={`flex-1 py-2 text-[11px] font-bold tracking-wider rounded-lg transition-all relative z-10 flex items-center justify-center gap-1 ${
              tradingMode === 'futures' ? 'text-[#F0B90B] shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            FUTURES
            <span className={`text-[8px] px-1 rounded-sm font-black ${tradingMode === 'futures' ? 'bg-[#F0B90B] text-black' : 'bg-gray-700 text-gray-400'}`}>PRO</span>
            {tradingMode === 'futures' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg -z-10 shadow-inner border border-[#F0B90B]/20" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </button>
        </div>
        
        {/* ORDER TYPE */}
        {/* ORDER TYPE */}
        <div className="flex gap-2">
          {['market'].map((type) => ( // <--- NEW (Just 'market')
            <button
                key={type}
                onClick={() => setOrderType(type as any)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                orderType === type 
                    ? 'bg-[#21ce99]/10 border-[#21ce99]/30 text-[#21ce99]' 
                    : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                }`}
            >
                {type}
            </button>
            ))}
        </div>

        {/* LEVERAGE */}
        <AnimatePresence>
            {tradingMode === 'futures' && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-3"
            >
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        LEVERAGE <span className="text-[#F0B90B] text-[9px] bg-[#F0B90B]/10 px-1 rounded">ISOLATED</span>
                    </span>
                    <span className="text-sm font-black text-[#F0B90B] font-mono shadow-[#F0B90B]/20 drop-shadow-sm">{leverage}x</span>
                </div>
                <div className="relative h-6 flex items-center px-1">
                    <input type="range" min="1" max="125" step="1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#F0B90B]" />
                </div>
            </motion.div>
            )}
        </AnimatePresence>

        {/* MARGIN INPUT */}
        <div className="space-y-1.5">
           <div className="flex justify-between px-1">
              <span className="text-[10px] font-bold text-gray-400">AMOUNT (USDT)</span>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Wallet size={10} />
                <span>Available: $10,000</span>
              </div>
           </div>
           <div className="bg-[#0b0e11]/60 border border-white/10 rounded-xl flex items-center px-4 py-3 focus-within:border-[#F0B90B]/50 focus-within:bg-[#0b0e11] transition-all relative group shadow-inner">
              <span className="text-white/40 font-mono mr-2 select-none">$</span>
              <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="bg-transparent w-full text-right text-white font-bold font-mono outline-none placeholder-white/20" />
           </div>
        </div>

        {/* TP / SL SECTION */}
        <AnimatePresence>
          {tradingMode === 'futures' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white/[0.03] rounded-xl p-3 border border-white/5 space-y-3 overflow-hidden">
              {/* TAKE PROFIT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={tpEnabled} onChange={(e) => setTpEnabled(e.target.checked)} className="sr-only peer" />
                      <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#21ce99]"></div>
                    </label>
                    <span className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${tpEnabled ? 'text-[#21ce99]' : 'text-gray-500'}`}>TAKE PROFIT</span>
                  </div>
                  {tpEnabled && <span className="text-[9px] font-mono text-[#21ce99] bg-[#21ce99]/10 px-1.5 rounded-sm">{getDiff(tpPrice)}%</span>}
                </div>
                <AnimatePresence>
                {tpEnabled && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center bg-black/30 rounded-lg px-3 py-2 border border-white/10 focus-within:border-[#21ce99]/50 transition-colors">
                    <span className="text-[10px] text-gray-500 mr-2">Price</span>
                    <input type="number" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} className="bg-transparent w-full text-right text-[#21ce99] font-bold font-mono text-xs outline-none" />
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
              <div className="h-[1px] bg-white/5 w-full"></div>
              {/* STOP LOSS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={slEnabled} onChange={(e) => setSlEnabled(e.target.checked)} className="sr-only peer" />
                      <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#f23645]"></div>
                    </label>
                    <span className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${slEnabled ? 'text-[#f23645]' : 'text-gray-500'}`}>STOP LOSS</span>
                  </div>
                  {slEnabled && <span className="text-[9px] font-mono text-[#f23645] bg-[#f23645]/10 px-1.5 rounded-sm">{getDiff(slPrice)}%</span>}
                </div>
                <AnimatePresence>
                {slEnabled && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center bg-black/30 rounded-lg px-3 py-2 border border-white/10 focus-within:border-[#f23645]/50 transition-colors">
                    <span className="text-[10px] text-gray-500 mr-2">Price</span>
                    <input type="number" value={slPrice} onChange={(e) => setSlPrice(e.target.value)} className="bg-transparent w-full text-right text-[#f23645] font-bold font-mono text-xs outline-none" />
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MATH SUMMARY */}
        <div className="bg-black/20 rounded-xl p-4 space-y-3 border border-white/5 shadow-inner">
           <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-500">Position Size</span>
              <span className="text-white font-mono font-bold tracking-tight">${buyingPower.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-500">Qty ({activeSymbol.replace('USDT', '')})</span>
              <span className="text-white font-mono">{qty.toFixed(4)}</span>
           </div>
           {tradingMode === 'futures' && (
             <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-white/5">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[9px] text-gray-500 uppercase tracking-wider">Liq. Long</span>
                   <span className="font-mono text-[#21ce99] text-xs font-bold">${liqPriceLong.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex flex-col gap-0.5 items-end">
                   <span className="text-[9px] text-gray-500 uppercase tracking-wider">Liq. Short</span>
                   <span className="font-mono text-[#f23645] text-xs font-bold">${liqPriceShort.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3 mt-auto bg-black/20 backdrop-blur-md border-t border-white/5">
        <motion.button 
          whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleTrade('buy')}
          disabled={price <= 0}
          className="relative overflow-hidden group bg-gradient-to-br from-[#21ce99] to-[#17a075] disabled:opacity-50 disabled:grayscale text-[#0b0e11] rounded-xl py-3.5 shadow-[0_0_20px_rgba(33,206,153,0.2)]"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="flex flex-col items-center justify-center relative z-10">
             <span className="font-black text-sm tracking-wide">LONG</span>
             <span className="text-[9px] font-bold opacity-70">BUY</span>
          </div>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleTrade('sell')}
          disabled={price <= 0}
          className="relative overflow-hidden group bg-gradient-to-br from-[#f23645] to-[#a61a26] disabled:opacity-50 disabled:grayscale text-white rounded-xl py-3.5 shadow-[0_0_20px_rgba(242,54,69,0.2)]"
        >
           <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
           <div className="flex flex-col items-center justify-center relative z-10">
             <span className="font-black text-sm tracking-wide">SHORT</span>
             <span className="text-[9px] font-bold opacity-80">SELL</span>
          </div>
        </motion.button>
      </div>
    </aside>
  );
}