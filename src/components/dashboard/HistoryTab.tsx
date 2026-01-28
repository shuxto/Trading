import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Calendar, 
  ArrowUpRight, ArrowDownLeft, Database
} from 'lucide-react';

export default function HistoryTab() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id) 
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

      if (!error && data) {
        setTrades(data);
      }
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = 
      trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || trade.type === filterType;

    return matchesSearch && matchesType;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTrades.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in font-sans pb-10">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-end bg-[#151a21] p-6 rounded-[20px] border border-white/10 shadow-xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#21ce99]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-[#21ce99]/10 rounded-lg text-[#21ce99]">
                <Database size={20} />
             </div>
             <h2 className="text-2xl font-black text-white uppercase tracking-wide">Trade Logs</h2>
          </div>
          <p className="text-xs text-[#8b9bb4] font-mono max-w-md">ARCHIVED PERFORMANCE DATA & REALIZED PNL</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:flex-none group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#21ce99] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH SYMBOL..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white focus:border-[#21ce99] focus:shadow-[0_0_15px_rgba(33,206,153,0.1)] outline-none uppercase placeholder-gray-700 transition-all"
            />
          </div>
          
          <div className="relative group">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#F0B90B] transition-colors" size={16} />
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-10 pr-8 text-xs font-bold text-white appearance-none outline-none focus:border-[#F0B90B] uppercase cursor-pointer transition-all hover:border-gray-600"
             >
               <option value="all">ALL SIDES</option>
               <option value="buy">LONG (BUY)</option>
               <option value="sell">SHORT (SELL)</option>
             </select>
          </div>
        </div>
      </div>

      {/* DATA TERMINAL TABLE */}
      <div className="bg-[#151a21] border border-white/10 rounded-[22px] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Scanline Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #fff 25%, #fff 26%, transparent 27%, transparent 74%, #fff 75%, #fff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #fff 25%, #fff 26%, transparent 27%, transparent 74%, #fff 75%, #fff 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }} />

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0b0e11] text-gray-500 border-b border-white/5">
              <tr>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest">Asset</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-center">Direction</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-right">Size</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-right">Entry</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-right">Exit</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-right">Realized PnL</th>
                <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500 font-mono text-xs animate-pulse">Initializing Data Stream...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-600 font-mono text-xs">NO CLOSED POSITIONS FOUND</td></tr>
              ) : (
                currentItems.map((trade) => {
                  const isProfit = trade.pnl >= 0;
                  return (
                    <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#2a303c] border border-white/5 flex items-center justify-center text-white font-black shadow-inner">
                             {trade.symbol.substring(0, 1)}
                          </div>
                          <div>
                              <div className="font-bold text-white text-xs tracking-wide">{trade.symbol}</div>
                              <div className="text-[9px] text-[#21ce99] font-mono">{trade.leverage}X LEV</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5 shadow-lg ${
                          trade.type === 'buy' ? 'bg-[#21ce99]/10 text-[#21ce99] border border-[#21ce99]/20' : 'bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/20'
                        }`}>
                          {trade.type === 'buy' ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownLeft size={10} strokeWidth={3} />}
                          {trade.type === 'buy' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="p-5 text-right font-mono text-gray-300 font-bold text-xs">
                        ${trade.size.toLocaleString()}
                      </td>
                      <td className="p-5 text-right font-mono text-gray-400 text-xs">
                        {Number(trade.entry_price).toFixed(2)}
                      </td>
                      <td className="p-5 text-right font-mono text-gray-400 text-xs">
                        {Number(trade.exit_price).toFixed(2)}
                      </td>
                      <td className={`p-5 text-right font-mono font-black text-xs tracking-tight ${isProfit ? 'text-[#21ce99] drop-shadow-[0_0_8px_rgba(33,206,153,0.3)]' : 'text-[#f23645] drop-shadow-[0_0_8px_rgba(242,54,69,0.3)]'}`}>
                         {isProfit ? '+' : ''}{Number(trade.pnl).toFixed(2)}
                      </td>
                      <td className="p-5 text-right text-gray-500 font-mono text-[10px]">
                         <div className="flex items-center justify-end gap-2">
                            <span>{new Date(trade.closed_at).toLocaleDateString()}</span>
                            <Calendar size={12} className="opacity-30"/>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 bg-[#0b0e11] flex justify-between items-center relative z-10">
             <button 
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               disabled={currentPage === 1}
               className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white disabled:opacity-30 uppercase tracking-widest transition-colors"
             >
               <ChevronLeft size={12} /> Prev
             </button>
             
             <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                            currentPage === page 
                            ? 'bg-[#21ce99] text-[#0b0e11]' 
                            : 'bg-[#1e232d] text-gray-500 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {page}
                    </button>
                ))}
             </div>

             <button 
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               disabled={currentPage === totalPages}
               className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white disabled:opacity-30 uppercase tracking-widest transition-colors"
             >
               Next <ChevronRight size={12} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}