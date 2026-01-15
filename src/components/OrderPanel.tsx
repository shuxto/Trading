import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronUp, ChevronDown, Loader2 } from "lucide-react"; // ✅ Added Loader2
import { useClickSound } from '../hooks/useClickSound';
import type { Order } from '../types';

interface OrderPanelProps {
  currentPrice: number | null; 
  activeSymbol: string;
  onTrade: (order: Order) => void;
  activeAccountId: number; 
  balance: number; 
}

const MMR = 0.005; 

export default function OrderPanel({ currentPrice, activeSymbol, onTrade, activeAccountId, balance }: OrderPanelProps) {
  const playClick = useClickSound();
  
  const [tradingMode, setTradingMode] = useState<'spot' | 'futures'>('spot');
  const [leverage, setLeverage] = useState<number>(20);
  const [margin, setMargin] = useState<number>(100);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // ✅ Added Loading State

  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  
  const price = currentPrice && currentPrice > 0 ? currentPrice : 0;
  const effectiveLeverage = tradingMode === 'spot' ? 1 : leverage;
  const buyingPower = margin * effectiveLeverage;
  const qty = price > 0 ? buyingPower / price : 0;

  const liqPriceLong = price > 0 && effectiveLeverage > 1
    ? (price * (1 - (1 / effectiveLeverage))) / (1 - MMR)
    : 0;

  const liqPriceShort = price > 0 && effectiveLeverage > 1
    ? (price * (1 + (1 / effectiveLeverage))) / (1 + MMR)
    : 0;

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
      if (window.innerWidth >= 768) setIsMobileExpanded(true); 
      else setIsMobileExpanded(false); 
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

  const handleTrade = async (side: 'buy' | 'sell') => { // ✅ Made Async
    if (price <= 0) return;
    if (tpEnabled && tpPrice) {
      const tp = parseFloat(tpPrice);
      if (side === 'buy' && tp <= price) { alert("⚠️ TP must be HIGHER than price."); return; }
      if (side === 'sell' && tp >= price) { alert("⚠️ TP must be LOWER than price."); return; }
    }
    if (slEnabled && slPrice) {
      const sl = parseFloat(slPrice);
      if (side === 'buy' && sl >= price) { alert("⚠️ SL must be LOWER than price."); return; }
      if (side === 'sell' && sl <= price) { alert("⚠️ SL must be HIGHER than price."); return; }
    }

    playClick();
    setIsProcessing(true); // ✅ Start Loading

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

    try {
        // ✅ Wait for the parent to finish the secure trade
        await onTrade(newOrder);
    } finally {
        setIsProcessing(false); // ✅ Stop Loading
    }
  };

  return (
    <aside 
      style={{ backgroundColor: 'rgb(21, 26, 33)' }} 
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col 
      backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/5 shadow-2xl
      transition-all duration-300 ease-in-out
      ${isMobileExpanded ? 'h-[520px]' : 'h-auto'} 
      md:static md:w-[260px] md:h-full`}>
      
      <div className="flex md:hidden items-center justify-center py-2 cursor-pointer" onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
        <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        <div className="absolute right-4 text-gray-500">{isMobileExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 ${isMobileExpanded ? 'block' : 'hidden'} md:block`}>
        {/* TAB SWITCHER */}
        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
          <button onClick={() => { playClick(); setTradingMode('spot'); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all relative z-10 ${tradingMode === 'spot' ? 'text-white' : 'text-gray-500'}`}>
            SPOT {tradingMode === 'spot' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg -z-10 border border-white/10" />}
          </button>
          <button onClick={() => { playClick(); setTradingMode('futures'); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all relative z-10 flex items-center justify-center gap-1 ${tradingMode === 'futures' ? 'text-[#F0B90B]' : 'text-gray-500'}`}>
            FUTURES {tradingMode === 'futures' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg -z-10 border border-[#F0B90B]/20" />}
          </button>
        </div>

        {/* LEVERAGE SLIDER */}
        <AnimatePresence>
          {tradingMode === 'futures' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Leverage</span>
                <span className="text-xs font-black text-[#F0B90B]">{leverage}x</span>
              </div>
              <input type="range" min="1" max="125" step="1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#F0B90B]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* MARGIN INPUT */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Amount (USDT)</span>
            <div className="flex items-center gap-1 text-[10px] text-[#21ce99] font-bold">
              <Wallet size={10} />
              <span>${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl flex items-center px-4 py-3 focus-within:border-[#F0B90B]/50 transition-all">
            <span className="text-gray-600 font-mono mr-2">$</span>
            <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="bg-transparent w-full text-right text-white font-black font-mono outline-none" />
          </div>
        </div>

        {/* TP / SL SECTION */}
        <AnimatePresence>
          {tradingMode === 'futures' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <div className="space-y-2">
                <div className="flex justify-between"><div className="flex gap-2 items-center"><input type="checkbox" checked={tpEnabled} onChange={(e) => setTpEnabled(e.target.checked)} className="accent-[#21ce99]" /><span className="text-[9px] font-bold text-gray-400">TAKE PROFIT</span></div>{tpEnabled && <span className="text-[9px] font-mono text-[#21ce99]">{getDiff(tpPrice)}%</span>}</div>
                {tpEnabled && <input type="number" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} className="bg-black/40 w-full text-right text-[#21ce99] font-bold text-xs p-2 rounded border border-white/10 outline-none" />}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><div className="flex gap-2 items-center"><input type="checkbox" checked={slEnabled} onChange={(e) => setSlEnabled(e.target.checked)} className="accent-[#f23645]" /><span className="text-[9px] font-bold text-gray-400">STOP LOSS</span></div>{slEnabled && <span className="text-[9px] font-mono text-[#f23645]">{getDiff(slPrice)}%</span>}</div>
                {slEnabled && <input type="number" value={slPrice} onChange={(e) => setSlPrice(e.target.value)} className="bg-black/40 w-full text-right text-[#f23645] font-bold text-xs p-2 rounded border border-white/10 outline-none" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIQUIDATION BOX */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Size</span><span className="text-white">${buyingPower.toLocaleString()}</span></div>
          <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Quantity</span><span className="text-white">{qty.toFixed(4)}</span></div>
          {tradingMode === 'futures' && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <div><p className="text-[8px] text-gray-400 font-bold mb-1">LIQ. LONG</p><p className="text-xs font-black text-[#21ce99]">${liqPriceLong.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
              <div className="text-right"><p className="text-[8px] text-gray-400 font-bold mb-1">LIQ. SHORT</p><p className="text-xs font-black text-[#f23645]">${liqPriceShort.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* COOL NEON BUTTONS */}
      <div className="p-4 grid grid-cols-2 gap-4 bg-black/40 border-t border-white/5">
        <motion.button 
          whileHover={{ scale: 1.02, filter: "brightness(1.2)" }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => handleTrade('buy')}
          disabled={isProcessing} // ✅ Disable while loading
          className="bg-gradient-to-b from-[#21ce99] to-[#00b07c] text-[#0b0e11] py-3 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(33,206,153,0.3)] border-b-4 border-[#17a075] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {isProcessing ? ( // ✅ Show Loader
             <Loader2 className="animate-spin" size={20} /> 
          ) : (
             <>
               <span className="text-sm font-black tracking-tighter uppercase">Buy</span>
               <span className="text-[8px] font-black opacity-60 uppercase">Long</span>
             </>
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02, filter: "brightness(1.2)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleTrade('sell')}
          disabled={isProcessing} // ✅ Disable while loading
          className="bg-gradient-to-b from-[#f23645] to-[#c71d2b] text-white py-3 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(242,54,69,0.3)] border-b-4 border-[#a61a26] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {isProcessing ? ( // ✅ Show Loader
             <Loader2 className="animate-spin" size={20} />
          ) : (
             <>
               <span className="text-sm font-black tracking-tighter uppercase">Sell</span>
               <span className="text-[8px] font-black opacity-60 uppercase">Short</span>
             </>
          )}
        </motion.button>
      </div>
    </aside>
  );
}