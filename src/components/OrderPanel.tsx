import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronUp, ChevronDown, Loader2, Zap, Settings2, Target, Shield, Lock as LockIcon } from "lucide-react";
import { useClickSound } from '../hooks/useClickSound';
import type { Order } from '../types';

interface OrderPanelProps {
  currentPrice: number | null; 
  activeSymbol: string;
  onTrade: (order: Order) => void;
  activeAccountId: number; 
  balance: number; 
  userTier: string; 
}

const MMR = 0.005; 

export default function OrderPanel({ currentPrice, activeSymbol, onTrade, activeAccountId, balance, userTier }: OrderPanelProps) {
  const playClick = useClickSound();
  
  const [tradingMode, setTradingMode] = useState<'spot' | 'futures'>('spot');
  const [leverage, setLeverage] = useState<number>(20);
  const [margin, setMargin] = useState<number>(100);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🟢 TIER LOGIC: CALCULATE MAX LEVERAGE
  const getMaxLeverage = () => {
     if (['Admin', 'Staff', 'Diamond'].includes(userTier)) return 125; // MAX
     if (userTier === 'Platinum') return 50;
     if (userTier === 'Gold') return 30;
     if (userTier === 'Silver') return 10;
     return 1; // Basic = LOCKED
  };

  const maxLeverage = getMaxLeverage();
  const isLeverageLocked = maxLeverage === 1;

  // 🟢 AUTO-CLAMP: If user downgrades or switches, force leverage down
  useEffect(() => {
      if (leverage > maxLeverage) setLeverage(maxLeverage);
  }, [maxLeverage, leverage]);

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

    setTpPrice(suggestedTp.toFixed(2));
    setSlPrice(suggestedSl.toFixed(2));
  };

  // Standard ghost prices for initialization
  useEffect(() => {
    if (price > 0 && !tpPrice && !slPrice) {
      forceDirectionUpdate('buy'); 
    }
  }, [price]);

  // ⬇️⬇️⬇️ THIS IS THE FIX (Logic Preserved) ⬇️⬇️⬇️
  useEffect(() => {
      setTpPrice('');
      setSlPrice('');
  }, [activeSymbol]);
  // ⬆️⬆️⬆️ END OF FIX ⬆️⬆️⬆️

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
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-[#151a21] border-t md:border-t-0 md:border-l border-white/10 shadow-xl transition-all duration-300 ease-in-out ${isMobileExpanded ? 'h-[580px]' : 'h-auto'} md:static md:w-[280px] md:h-full font-sans`}
    >
      
      {/* MOBILE TOGGLE */}
      <div className="flex md:hidden items-center justify-center py-3 cursor-pointer bg-[#191f2e] border-b border-white/5" onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
        <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        <div className="absolute right-4 text-gray-500">{isMobileExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</div>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 ${isMobileExpanded ? 'block' : 'hidden'} md:block`}>
        
        {/* HEADER */}
        <div className="flex items-center gap-2 mb-2">
            <Settings2 size={16} className="text-[#21ce99]" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Configuration</span>
        </div>

        {/* TABS */}
        <div className="flex p-1 bg-[#0b0e11] rounded-xl border border-white/10">
          <button onClick={() => { playClick(); setTradingMode('spot'); }} className={`relative flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors z-10 ${tradingMode === 'spot' ? 'text-black' : 'text-gray-500 hover:text-white'}`}>
            {/* OPTIMIZED: Reduced shadow spread for performance */}
            {tradingMode === 'spot' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#21ce99] rounded-lg shadow-md -z-10" />}
            SPOT
          </button>
          <button onClick={() => { playClick(); setTradingMode('futures'); }} className={`relative flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors z-10 ${tradingMode === 'futures' ? 'text-black' : 'text-gray-500 hover:text-white'}`}>
            {/* OPTIMIZED: Reduced shadow spread for performance */}
            {tradingMode === 'futures' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#F0B90B] rounded-lg shadow-md -z-10" />}
            FUTURES
          </button>
        </div>

        {/* LEVERAGE & MODE DISPLAY */}
        {/* Added min-h to prevent jumping */}
        <div className="min-h-[70px]">
            <AnimatePresence mode="wait">
            {tradingMode === 'futures' ? (
                <motion.div 
                    key="futures"
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }} 
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                >
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Zap size={10} /> Leverage</span>
                    <div className="flex items-center gap-2">
                         {/* 🟢 USE LockIcon HERE */}
                         {isLeverageLocked && <LockIcon size={10} className="text-red-500" />}
                         <span className={`text-xs font-black px-2 py-0.5 rounded border ${isLeverageLocked ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-[#F0B90B] bg-[#F0B90B]/10 border-[#F0B90B]/20'}`}>
                             {leverage}x
                         </span>
                    </div>
                </div>
                
                {/* 🟢 TIER RESTRICTED SLIDER */}
                <input 
                    type="range" 
                    min="1" 
                    max={maxLeverage} 
                    step="1" 
                    value={leverage} 
                    disabled={isLeverageLocked}
                    onChange={(e) => setLeverage(Number(e.target.value))} 
                    className={`w-full h-2 rounded-full appearance-none cursor-pointer border border-white/5 ${isLeverageLocked ? 'bg-red-900/20 accent-red-500' : 'bg-[#0b0e11] accent-[#F0B90B]'}`} 
                />
                
                {/* 🟢 UPGRADE MESSAGE */}
                {maxLeverage < 125 && (
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-wide">
                        <span className="text-gray-600">Max: {maxLeverage}x ({userTier})</span>
                        <span className="text-[#F0B90B] cursor-pointer hover:underline">Upgrade Plan ↗</span>
                    </div>
                )}
                </motion.div>
            ) : (
                <motion.div 
                    key="spot"
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 bg-[#21ce99]/5 border border-[#21ce99]/20 rounded-xl text-center relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <span className="text-[10px] font-bold text-[#21ce99] uppercase tracking-wide relative z-10">Pro Spot Mode Active</span>
                    <p className="text-[9px] text-gray-500 mt-1 relative z-10 leading-relaxed">
                        Auto-Protect enabled.<br/>
                        <span className="text-[#21ce99] opacity-90">TP: +20% | SL: -10%</span>
                    </p>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* MARGIN */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Margin (USDT)</span>
            <div className="flex items-center gap-1 text-[10px] text-white font-mono bg-white/5 px-1.5 py-0.5 rounded">
              <Wallet size={10} className="text-[#21ce99]" />
              <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">$</div>
              {/* OPTIMIZED: Changed transition-all to transition-colors */}
              <input 
                type="number" 
                value={margin} 
                onChange={(e) => setMargin(Number(e.target.value))} 
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-8 pr-4 text-right text-white font-mono font-bold focus:border-[#21ce99] focus:shadow-md outline-none transition-colors" 
             />
          </div>
        </div>

        {/* TP/SL SECTION */}
        <AnimatePresence>
          {tradingMode === 'futures' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4 bg-[#0b0e11] p-4 rounded-xl border border-white/5">
              {/* TP */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <div className="flex gap-2 items-center">
                      <input type="checkbox" checked={tpEnabled} onChange={(e) => setTpEnabled(e.target.checked)} className="accent-[#21ce99] w-3 h-3 cursor-pointer" />
                      <span className="text-[9px] font-bold text-[#21ce99] uppercase tracking-widest flex items-center gap-1"><Target size={10} /> Take Profit</span>
                   </div>
                   <span className={`text-[9px] font-mono ${tpEnabled ? 'text-[#21ce99]' : 'text-gray-600'}`}>{getDiff(tpPrice)}%</span>
                </div>
                <div className="relative">
                   {/* OPTIMIZED: Changed transition-all to transition-colors */}
                   <input 
                      type="number" 
                      disabled={!tpEnabled} 
                      value={tpPrice} 
                      onChange={(e) => setTpPrice(e.target.value)} 
                      className={`w-full bg-[#151a21] border border-white/10 rounded-lg p-2 text-right text-xs font-mono font-bold outline-none transition-colors ${tpEnabled ? 'text-[#21ce99] border-[#21ce99]/30' : 'text-gray-600 opacity-50'}`} 
                   />
                   {!tpEnabled && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] text-gray-500 font-bold uppercase tracking-wider">Auto-Calc</span>}
                </div>
              </div>

              {/* SL */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <div className="flex gap-2 items-center">
                      <input type="checkbox" checked={slEnabled} onChange={(e) => setSlEnabled(e.target.checked)} className="accent-[#f23645] w-3 h-3 cursor-pointer" />
                      <span className="text-[9px] font-bold text-[#f23645] uppercase tracking-widest flex items-center gap-1"><Shield size={10} /> Stop Loss</span>
                   </div>
                   <span className={`text-[9px] font-mono ${slEnabled ? 'text-[#f23645]' : 'text-gray-600'}`}>{getDiff(slPrice)}%</span>
                </div>
                <div className="relative">
                   {/* OPTIMIZED: Changed transition-all to transition-colors */}
                   <input 
                      type="number" 
                      disabled={!slEnabled} 
                      value={slPrice} 
                      onChange={(e) => setSlPrice(e.target.value)} 
                      className={`w-full bg-[#151a21] border border-white/10 rounded-lg p-2 text-right text-xs font-mono font-bold outline-none transition-colors ${slEnabled ? 'text-[#f23645] border-[#f23645]/30' : 'text-gray-600 opacity-50'}`} 
                   />
                   {!slEnabled && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] text-gray-500 font-bold uppercase tracking-wider">Auto-Calc</span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INFO BOX */}
        <div className="bg-[#0b0e11] rounded-xl p-4 border border-white/5 space-y-3 relative overflow-hidden">
          <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase tracking-wider">Position Size</span><span className="text-white font-mono">${buyingPower.toLocaleString()}</span></div>
          <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase tracking-wider">Asset Qty</span><span className="text-white font-mono">{qty.toFixed(4)}</span></div>
          {tradingMode === 'futures' && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 mt-2">
              <div><p className="text-[8px] text-gray-500 font-bold mb-1 uppercase tracking-tighter">Liq. Long</p><p className="text-xs font-black text-[#f23645] font-mono">${liqPriceLong.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
              <div className="text-right"><p className="text-[8px] text-gray-500 font-bold mb-1 uppercase tracking-tighter">Liq. Short</p><p className="text-xs font-black text-[#f23645] font-mono">${liqPriceShort.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {/* OPTIMIZED: Removed heavy filter brightness, reduced shadows, used scale only */}
      <div className="p-5 grid grid-cols-2 gap-3 bg-[#0b0e11] border-t border-white/10 relative z-20">
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => { if (tpEnabled || slEnabled) forceDirectionUpdate('buy'); }} 
          onClick={() => handleTrade('buy')}
          disabled={isProcessing} 
          className="group relative overflow-hidden bg-[#21ce99] text-[#0b0e11] py-4 rounded-xl flex flex-col items-center justify-center shadow-md disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
             <div className="relative z-10 flex flex-col items-center">
               <span className="text-sm font-black tracking-tighter uppercase">Buy / Long</span>
               <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Entry</span>
             </div>
          )}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => { if (tpEnabled || slEnabled) forceDirectionUpdate('sell'); }} 
          onClick={() => handleTrade('sell')}
          disabled={isProcessing} 
          className="group relative overflow-hidden bg-[#f23645] text-white py-4 rounded-xl flex flex-col items-center justify-center shadow-md disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
             <div className="relative z-10 flex flex-col items-center">
               <span className="text-sm font-black tracking-tighter uppercase">Sell / Short</span>
               <span className="text-[8px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Entry</span>
             </div>
          )}
        </motion.button>
      </div>
    </aside>
  );
}