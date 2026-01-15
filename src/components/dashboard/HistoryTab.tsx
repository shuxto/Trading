import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Clock, 
  Activity,
  History as HistoryIcon,
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';

export default function HistoryTab() {
  const [view, setView] = useState<'open' | 'history'>('open');
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [historyTrades, setHistoryTrades] = useState<any[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<number, string>>({}); // ✅ Store Account Names
  const [loading, setLoading] = useState(false);

  // PAGINATION STATE
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [view, page]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Fetch Account Names (To show "Main Account" instead of "ID: 1")
      const { data: accounts } = await supabase
        .from('trading_accounts')
        .select('id, name')
        .eq('user_id', user.id);

      if (accounts) {
        const map: Record<number, string> = {};
        accounts.forEach(acc => { map[acc.id] = acc.name; });
        setAccountsMap(map);
      }

      // 2. Fetch Trades
      if (view === 'open') {
        const { data } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        if (data) setOpenTrades(data);
      } else {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        
        const { data } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'closed')
          .order('closed_at', { ascending: false })
          .range(from, to);
          
        if (data) setHistoryTrades(data);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e232d] rounded-2xl border border-[#2a2e39] overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-[#2a2e39] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {view === 'open' ? <Activity className="text-[#21ce99]" size={20}/> : <HistoryIcon className="text-[#8b9bb4]" size={20}/>}
          {view === 'open' ? 'Active Positions' : 'Trade History'}
        </h2>

        <div className="flex bg-[#151a21] p-1 rounded-lg">
           <button 
             onClick={() => setView('open')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'open' ? 'bg-[#2a2e39] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
           >
             OPEN POSITIONS
           </button>
           <button 
             onClick={() => setView('history')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'history' ? 'bg-[#2a2e39] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
           >
             HISTORY
           </button>
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
         {loading ? (
             <div className="h-40 flex items-center justify-center text-gray-500 animate-pulse">Loading data...</div>
         ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-[#151a21] text-[#8b9bb4] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4">Time</th>
                    <th className="p-4">Account</th> {/* ✅ NEW COLUMN */}
                    <th className="p-4">Symbol</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right">Size</th>
                    <th className="p-4 text-right">Entry</th>
                    {view === 'history' && <th className="p-4 text-right">Exit</th>}
                    <th className="p-4 text-right">{view === 'open' ? 'Current PnL' : 'Realized PnL'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]">
                  {(view === 'open' ? openTrades : historyTrades).length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-gray-600 italic">No records found.</td></tr>
                  ) : (
                    (view === 'open' ? openTrades : historyTrades).map(trade => {
                      const isProfit = (trade.pnl || 0) >= 0;
                      
                      return (
                        <tr key={trade.id} className="hover:bg-[#252a36] transition-colors">
                          <td className="p-4 text-[#5e6673] whitespace-nowrap text-xs">
                             <div className="flex items-center gap-2">
                                <Clock size={12} />
                                {new Date(trade.created_at).toLocaleDateString()}
                             </div>
                          </td>
                          {/* ✅ ACCOUNT NAME DISPLAY */}
                          <td className="p-4">
                             <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 bg-[#151a21] px-2 py-1 rounded-md w-fit">
                                <User size={10} />
                                {accountsMap[trade.account_id] || 'Unknown Acc'}
                             </div>
                          </td>
                          <td className="p-4 font-bold text-white">
                             {trade.symbol} <span className="text-[#8b9bb4] text-[10px] ml-1">{trade.leverage}x</span>
                          </td>
                          <td className="p-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${trade.type === 'buy' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'}`}>
                                {trade.type}
                             </span>
                          </td>
                          <td className="p-4 text-right font-mono text-gray-300">${trade.size.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-gray-400">{trade.entry_price.toFixed(2)}</td>
                          {view === 'history' && (
                             <td className="p-4 text-right font-mono text-gray-400">{trade.exit_price?.toFixed(2)}</td>
                          )}
                          <td className={`p-4 text-right font-mono font-bold ${isProfit ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                             {view === 'open' ? (
                                <span className="text-gray-500 text-xs">LIVE</span> 
                             ) : (
                                <span>{isProfit ? '+' : ''}{trade.pnl?.toFixed(2)}</span>
                             )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
             </table>
         )}
      </div>

      {/* --- PAGINATION --- */}
      {view === 'history' && (
        <div className="p-4 border-t border-[#2a2e39] bg-[#151a21] flex justify-between items-center">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-[#2a2e39] rounded text-xs hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-gray-500 font-mono">Page {page}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={historyTrades.length < itemsPerPage}
              className="px-3 py-1 bg-[#2a2e39] rounded text-xs hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
        </div>
      )}
    </div>
  );
}