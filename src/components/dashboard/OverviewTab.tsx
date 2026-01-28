import { TrendingUp, Briefcase, Activity, ArrowUpRight, Zap, Server, Globe, Lock, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

// --- TICKER DATA & COMPONENT ---
const TICKER_ITEMS = [
  { symbol: "BTC/USD", price: "64,230.50", change: "+2.4%", up: true },
  { symbol: "ETH/USD", price: "3,450.12", change: "+1.8%", up: true },
  { symbol: "SOL/USD", price: "145.20", change: "+5.4%", up: true },
  { symbol: "SPX", price: "5,210.40", change: "+0.5%", up: true },
  { symbol: "NDX", price: "18,100.20", change: "-0.2%", up: false },
  { symbol: "EUR/USD", price: "1.0845", change: "-0.1%", up: false },
  { symbol: "GBP/USD", price: "1.2650", change: "+0.1%", up: true },
  { symbol: "GOLD", price: "2,350.00", change: "+0.8%", up: true },
  { symbol: "OIL", price: "85.40", change: "+1.2%", up: true },
  { symbol: "AAPL", price: "172.50", change: "-0.5%", up: false },
  { symbol: "TSLA", price: "175.30", change: "+1.1%", up: true },
];

function MarketTicker() {
  return (
    <div className="w-full overflow-hidden border-b border-white/5 bg-[#0b0e11]/50 backdrop-blur-sm rounded-xl mb-6 relative group cursor-default select-none">
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#0b0e11] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0b0e11] to-transparent z-10" />
      <div className="flex py-3 animate-marquee hover:[animation-play-state:paused]">
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-2 mx-6 opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-bold text-white text-xs tracking-wider">{item.symbol}</span>
            <span className={`font-mono text-xs font-bold ${item.up ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
              {item.price}
            </span>
            <span className={`text-[9px] font-bold ${item.up ? 'text-[#21ce99]/60' : 'text-[#f23645]/60'}`}>
              {item.change}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function OverviewTab({ onNavigateToPlatform, isLocked }: { onNavigateToPlatform: () => void, isLocked: boolean }) {
  const [mainBalance, setMainBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [openPositions, setOpenPositions] = useState<any[]>([]); // 🟢 NEW STATE FOR OPEN TRADES
  
  const [utilization, setUtilization] = useState(0); 
  const [activeNodes, setActiveNodes] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
    const { data: accountsData } = await supabase.from('trading_accounts').select('id, name, balance').eq('user_id', user.id);
    
    // 🟢 FETCH OPEN TRADES
    const { data: openTrades } = await supabase.from('trades').select('*').eq('user_id', user.id).eq('status', 'open').order('created_at', { ascending: false });
    if (openTrades) setOpenPositions(openTrades);

    if (profileData) {
        const mBalance = profileData.balance || 0;
        setMainBalance(mBalance);

        let total = mBalance;
        let roomsTotal = 0;
        
        if (accountsData) {
            roomsTotal = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0);
            total += roomsTotal;
            setAccounts(accountsData);
            setActiveNodes(accountsData.length);
        }
        setTotalAssets(total);

        if (total > 0) {
            setUtilization(Math.round((roomsTotal / total) * 100));
        }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 font-sans relative">
      
      <MarketTicker />

      {/* HEADER */}
      <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">System Overview</h2>
            <p className="text-[#8b9bb4] text-xs font-mono mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#21ce99] rounded-full animate-pulse"/>
                REALTIME ASSET MONITORING ACTIVE
            </p>
          </div>
          <div className="hidden md:block text-right">
              <div className="text-[10px] text-[#5e6673] font-bold uppercase tracking-widest">Global Time</div>
              <div className="text-white font-mono text-sm">{new Date().toLocaleTimeString()}</div>
          </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#21ce99] to-blue-600 rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative h-full bg-[#151a21] rounded-[22px] p-8 border border-white/10 overflow-hidden flex flex-col justify-between">
                <div className="absolute right-0 bottom-0 w-2/3 h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 500 150" className="w-full h-full">
                        <motion.path 
                            d="M0,150 Q150,150 250,50 T500,50" 
                            fill="none" 
                            stroke="#21ce99" 
                            strokeWidth="4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                        <path d="M0,150 Q150,150 250,50 T500,50 L500,150 L0,150" fill="url(#grad1)" />
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#21ce99', stopOpacity: 0.5 }} />
                                <stop offset="100%" style={{ stopColor: '#21ce99', stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 text-[#21ce99]">
                        <TrendingUp size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Total Net Liquidity</span>
                    </div>
                    <div className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                        ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="relative z-10 mt-8 flex gap-8">
                    <div>
                        <div className="text-[9px] text-[#8b9bb4] uppercase font-bold tracking-wider mb-1">24h Change</div>
                        <div className="text-white font-mono font-bold flex items-center gap-1">
                            <ArrowUpRight size={14} className="text-[#21ce99]" /> 0.00%
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8b9bb4] uppercase font-bold tracking-wider mb-1">Active Nodes</div>
                        <div className="text-white font-mono font-bold flex items-center gap-1">
                            <Server size={14} className="text-[#F0B90B]" /> {activeNodes} Units
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="md:col-span-4 bg-[#1e232d] rounded-[22px] p-6 border border-[#2a2e39] relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Capital Allocation</span>
                <Activity size={16} className="text-[#F0B90B]" />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-6">
                <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                        <span className="text-gray-400">Idle (Main Vault)</span>
                        <span className="text-white">${mainBalance.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${100 - utilization}%` }} transition={{ duration: 1 }} className="h-full bg-gray-600 rounded-full" />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                        <span className="text-[#21ce99]">Deployed (Trading)</span>
                        <span className="text-[#21ce99]">${(totalAssets - mainBalance).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden shadow-[0_0_10px_rgba(33,206,153,0.2)]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${utilization}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-[#21ce99] rounded-full" />
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-mono">EFFICIENCY RATING</span>
                <span className="text-xl font-black text-white">{utilization}%</span>
            </div>
        </div>
      </div>

      {/* --- ACTION ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => { if (isLocked) alert("🔒 ACCESS DENIED: Complete Verification First."); else onNavigateToPlatform(); }}
            disabled={isLocked}
            className={`group relative h-32 rounded-[22px] overflow-hidden flex items-center justify-between px-8 transition-all hover:scale-[1.01] ${isLocked ? 'bg-gray-800 grayscale cursor-not-allowed opacity-50' : 'bg-[#21ce99] hover:shadow-[0_0_40px_rgba(33,206,153,0.3)]'}`}
          >
              {!isLocked && (
                  <>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </>
              )}
              <div className="relative z-10 text-left">
                  <h3 className="text-2xl font-black text-[#0b0e11] uppercase tracking-tighter flex items-center gap-2">
                      {isLocked && <Lock size={20} />} Launch Terminal
                  </h3>
                  <p className="text-[#0b0e11]/70 font-bold text-xs uppercase tracking-wide mt-1">
                      {isLocked ? "Identity Verification Required" : "Access Live Markets"}
                  </p>
              </div>
              <div className="relative z-10 h-14 w-14 bg-[#0b0e11] rounded-full flex items-center justify-center text-[#21ce99] shadow-xl group-hover:rotate-90 transition-transform duration-300">
                  <Zap size={24} fill="currentColor" />
              </div>
          </button>

          <div className="h-32 bg-[#151a21] border border-white/10 rounded-[22px] p-6 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Globe size={100} /></div>
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Online</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">All Systems Nominal</h3>
                  <p className="text-[#8b9bb4] text-xs mt-1">Data Stream Connected • Low Latency</p>
              </div>
              <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-[#8b9bb4]"><Activity size={24} /></div>
          </div>
      </div>

      {/* 🟢 NEW SECTION: LIVE OPEN POSITIONS */}
      <div>
        <div className="flex items-center gap-3 mb-6">
            <Activity size={20} className="text-[#21ce99]" />
            <h3 className="text-lg font-black text-white uppercase tracking-wide">Live Active Positions</h3>
        </div>

        {openPositions.length === 0 ? (
            <div className="p-8 bg-[#151a21] rounded-[22px] border border-white/5 text-center flex flex-col items-center justify-center min-h-[150px]">
                <Clock size={32} className="text-[#5e6673] mb-3 opacity-50" />
                <h4 className="text-white font-bold text-sm">No Active Trades</h4>
                <p className="text-[#5e6673] text-xs mt-1">Open a position in the trading terminal to see live data here.</p>
            </div>
        ) : (
            <div className="bg-[#151a21] border border-white/10 rounded-[22px] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0b0e11] text-gray-500 text-[10px] uppercase font-bold tracking-wider border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Symbol</th>
                                <th className="px-6 py-4 text-center">Type</th>
                                <th className="px-6 py-4 text-right">Size</th>
                                <th className="px-6 py-4 text-right">Entry Price</th>
                                <th className="px-6 py-4 text-right">Leverage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {openPositions.map((trade) => (
                                <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#21ce99] animate-pulse"></div>
                                        {trade.symbol}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${trade.type === 'buy' ? 'bg-[#21ce99]/10 text-[#21ce99]' : 'bg-[#f23645]/10 text-[#f23645]'}`}>
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-300">${trade.size.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-[#F0B90B]">${Number(trade.entry_price).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">{trade.leverage}x</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* --- BOTTOM SECTION: ROOMS GRID --- */}
      <div>
        <div className="flex items-center gap-3 mb-6 mt-8">
            <Briefcase size={20} className="text-[#F0B90B]" />
            <h3 className="text-lg font-black text-white uppercase tracking-wide">Active Trading Units</h3>
        </div>
        
        {accounts.length === 0 ? (
            <div className="p-12 bg-[#1e232d] rounded-[22px] border border-dashed border-[#2a2e39] text-center">
                <div className="w-16 h-16 bg-[#2a2e39] rounded-full flex items-center justify-center mx-auto mb-4 text-[#5e6673]">
                    <Server size={32} />
                </div>
                <h4 className="text-white font-bold mb-1">No Units Deployed</h4>
                <p className="text-[#5e6673] text-sm">Initialize a new trading room to begin operations.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts.map((acc, i) => (
                    <motion.div 
                        key={acc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#151a21] p-5 rounded-2xl border border-white/5 hover:border-[#21ce99]/50 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-[#2a303c] rounded-lg text-white group-hover:text-[#21ce99] transition-colors">
                                <Server size={18} />
                            </div>
                            <span className="text-[10px] text-[#5e6673] font-mono bg-[#0b0e11] px-2 py-1 rounded border border-white/5">
                                #{String(acc.id).padStart(4, '0')}
                            </span>
                        </div>
                        
                        <div className="mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Equity</span>
                            <div className="text-xl font-mono font-bold text-white group-hover:text-[#21ce99] transition-colors">
                                ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        
                        <div className="text-[10px] text-[#5e6673] font-bold uppercase truncate mt-2 pt-2 border-t border-white/5">
                            {acc.name}
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}