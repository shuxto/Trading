import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronUp, ChevronDown, Loader2 } from "lucide-react"; 
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
  const [isProcessing, setIsProcessing] = useState(false);

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

  // ✅ THE DIRECTIONAL OBSERVER: Forces inputs to flip logic
  const forceDirectionUpdate = (side: 'buy' | 'sell') => {
    if (price <= 0) return;
    
    // Calculate 5% offsets based on the target side
    const suggestedTp = side === 'buy' ? price * 1.05 : price * 0.95;
    const suggestedSl = side === 'buy' ? price * 0.95 : price * 1.05;

    // We only update the state if the user HAS NOT typed something manual 
    // or if the current value is invalid for the side they just clicked.
    setTpPrice(suggestedTp.toFixed(2));
    setSlPrice(suggestedSl.toFixed(2));
  };

  // Standard ghost prices for initialization
  useEffect(() => {
    if (price > 0 && !tpPrice && !slPrice) {
      forceDirectionUpdate('buy'); 
    }
  }, [price]);

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

  const handleTrade = useCallback(async (side: 'buy' | 'sell') => { 
    if (price <= 0) return;

    // Use current input values if enabled, otherwise calculate default
    let finalTp = tpEnabled && tpPrice ? parseFloat(tpPrice) : (side === 'buy' ? price * 1.05 : price * 0.95);
    let finalSl = slEnabled && slPrice ? parseFloat(slPrice) : (side === 'buy' ? price * 0.95 : price * 1.05);

    if (tradingMode === 'futures') {
        if (side === 'buy') {
            if (finalTp <= price) { alert("⚠️ Long TP must be HIGHER than entry."); return; }
            if (finalSl >= price) { alert("⚠️ Long SL must be LOWER than entry."); return; }
        } else {
            // SHORT DIRECTION: TP must be LOWER, SL must be HIGHER
            if (finalTp >= price) { alert("⚠️ Short TP must be LOWER than entry."); return; }
            if (finalSl <= price) { alert("⚠️ Short SL must be HIGHER than entry."); return; }
        }
    }

    playClick();
    setIsProcessing(true); 

    if (tradingMode === 'spot') {
        finalTp = side === 'buy' ? price * 1.20 : price * 0.80;
        finalSl = side === 'buy' ? price * 0.90 : price * 1.10;
    }

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
      takeProfit: finalTp, 
      stopLoss: finalSl,   
    };

    try {
        await onTrade(newOrder);
    } finally {
        setIsProcessing(false); 
    }
  }, [price, tradingMode, tpEnabled, tpPrice, slEnabled, slPrice, activeAccountId, activeSymbol, margin, effectiveLeverage, buyingPower, liqPriceLong, liqPriceShort, onTrade, playClick]);

  useEffect(() => {
    const handleRemoteTrade = (e: CustomEvent) => {
        if (e.detail && (e.detail.side === 'buy' || e.detail.side === 'sell')) {
            handleTrade(e.detail.side);
        }
    };
    window.addEventListener('trigger-trade' as any, handleRemoteTrade as any);
    return () => window.removeEventListener('trigger-trade' as any, handleRemoteTrade as any);
  }, [handleTrade]);

  return (
    <aside 
      style={{ backgroundColor: 'rgb(21, 26, 33)' }} 
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/5 shadow-2xl transition-all duration-300 ease-in-out ${isMobileExpanded ? 'h-[520px]' : 'h-auto'} md:static md:w-[260px] md:h-full`}>
      
      <div className="flex md:hidden items-center justify-center py-2 cursor-pointer" onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
        <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        <div className="absolute right-4 text-gray-500">{isMobileExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 ${isMobileExpanded ? 'block' : 'hidden'} md:block`}>
        {/* TABS */}
        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
          <button onClick={() => { playClick(); setTradingMode('spot'); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all relative z-10 ${tradingMode === 'spot' ? 'text-white' : 'text-gray-500'}`}>
            SPOT {tradingMode === 'spot' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg -z-10 border border-white/10" />}
          </button>
          <button onClick={() => { playClick(); setTradingMode('futures'); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all relative z-10 flex items-center justify-center gap-1 ${tradingMode === 'futures' ? 'text-[#F0B90B]' : 'text-gray-500'}`}>
            FUTURES {tradingMode === 'futures' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg -z-10 border border-[#F0B90B]/20" />}
          </button>
        </div>

        {/* LEVERAGE */}
        <AnimatePresence>
          {tradingMode === 'futures' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Leverage</span>
                <span className="text-xs font-black text-[#F0B90B]">{leverage}x</span>
              </div>
              <input type="range" min="1" max="125" step="1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#F0B90B]" />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-[#21ce99]/10 border border-[#21ce99]/20 rounded-xl text-center">
                <span className="text-[10px] font-bold text-[#21ce99] uppercase">Pro Spot Mode Active</span>
                <p className="text-[9px] text-gray-400 mt-1">Auto-Protect enabled. <br/>TP: +20% | SL: -10%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MARGIN */}
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

        {/* TP/SL SECTION */}
        <AnimatePresence>
          {tradingMode === 'futures' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <div className="space-y-2">
                <div className="flex justify-between">
                   <div className="flex gap-2 items-center">
                      <input type="checkbox" checked={tpEnabled} onChange={(e) => setTpEnabled(e.target.checked)} className="accent-[#21ce99]" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Take Profit</span>
                   </div>
                   <span className={`text-[9px] font-mono ${tpEnabled ? 'text-[#21ce99]' : 'text-gray-600 opacity-50'}`}>{getDiff(tpPrice)}%</span>
                </div>
                <div className={`relative transition-opacity ${!tpEnabled && 'opacity-40'}`}>
                   <input type="number" disabled={!tpEnabled} value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} className="bg-black/40 w-full text-right text-[#21ce99] font-bold text-xs p-2 rounded border border-white/10 outline-none" />
                   {!tpEnabled && <div className="absolute inset-0 flex items-center pl-2 text-[8px] text-gray-500 font-bold uppercase pointer-events-none">Auto Protect</div>}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                   <div className="flex gap-2 items-center">
                      <input type="checkbox" checked={slEnabled} onChange={(e) => setSlEnabled(e.target.checked)} className="accent-[#f23645]" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Stop Loss</span>
                   </div>
                   <span className={`text-[9px] font-mono ${slEnabled ? 'text-[#f23645]' : 'text-gray-600 opacity-50'}`}>{getDiff(slPrice)}%</span>
                </div>
                <div className={`relative transition-opacity ${!slEnabled && 'opacity-40'}`}>
                   <input type="number" disabled={!slEnabled} value={slPrice} onChange={(e) => setSlPrice(e.target.value)} className="bg-black/40 w-full text-right text-[#f23645] font-bold text-xs p-2 rounded border border-white/10 outline-none" />
                   {!slEnabled && <div className="absolute inset-0 flex items-center pl-2 text-[8px] text-gray-500 font-bold uppercase pointer-events-none">Auto Protect</div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INFO BOX */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Size</span><span className="text-white">${buyingPower.toLocaleString()}</span></div>
          <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Quantity</span><span className="text-white">{qty.toFixed(4)}</span></div>
          {tradingMode === 'futures' && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <div><p className="text-[8px] text-gray-400 font-bold mb-1 uppercase tracking-tighter">Liq. Long</p><p className="text-xs font-black text-[#21ce99]">${liqPriceLong.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
              <div className="text-right"><p className="text-[8px] text-gray-400 font-bold mb-1 uppercase tracking-tighter">Liq. Short</p><p className="text-xs font-black text-[#f23645]">${liqPriceShort.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS: Now forces the flip logic before trade */}
      <div className="p-4 grid grid-cols-2 gap-4 bg-black/40 border-t border-white/5">
        <motion.button 
          whileHover={{ scale: 1.02, filter: "brightness(1.2)" }} 
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => { if (tpEnabled || slEnabled) forceDirectionUpdate('buy'); }} 
          onClick={() => handleTrade('buy')}
          disabled={isProcessing} 
          className="bg-gradient-to-b from-[#21ce99] to-[#00b07c] text-[#0b0e11] py-3 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(33,206,153,0.3)] border-b-4 border-[#17a075] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
             <>
               <span className="text-sm font-black tracking-tighter uppercase">Buy</span>
               <span className="text-[8px] font-black opacity-60 uppercase tracking-widest">Long</span>
             </>
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02, filter: "brightness(1.2)" }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => { if (tpEnabled || slEnabled) forceDirectionUpdate('sell'); }} 
          onClick={() => handleTrade('sell')}
          disabled={isProcessing} 
          className="bg-gradient-to-b from-[#f23645] to-[#c71d2b] text-white py-3 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(242,54,69,0.3)] border-b-4 border-[#a61a26] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
             <>
               <span className="text-sm font-black tracking-tighter uppercase">Sell</span>
               <span className="text-[8px] font-black opacity-60 uppercase tracking-widest">Short</span>
             </>
          )}
        </motion.button>
      </div>
    </aside>
  );
}