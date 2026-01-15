import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// REMOVED: import type { Trade } from '../../types';

export default function HistoryTab() {
  const [trades, setTrades] = useState<any[]>([]); 

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // REMOVED: error variable from destructuring
    const { data } = await supabase
      .from('trades')
      .select('*, trading_accounts ( name )') 
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setTrades(data);
  };

  return (
    <div className="animate-in fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">Trade History</h2>
      <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
        <table className="w-full text-left text-sm">
           <thead className="bg-[#151a21] text-[#8b9bb4]">
              <tr>
                 <th className="p-4 font-bold">Time</th>
                 <th className="p-4 font-bold">Account</th> 
                 <th className="p-4 font-bold">Symbol</th>
                 <th className="p-4 font-bold">Type</th>
                 <th className="p-4 font-bold">Size</th>
                 <th className="p-4 font-bold">Entry</th>
                 <th className="p-4 font-bold text-right">PnL</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-[#2a2e39]">
              {trades.map(trade => (
                 <tr key={trade.id} className="hover:bg-[#252a36]">
                    <td className="p-4 text-[#5e6673] text-xs">
                        {new Date(trade.created_at).toLocaleString()}
                    </td>
                    
                    <td className="p-4 text-white font-bold text-xs">
                        <span className="bg-[#2a2e39] px-2 py-1 rounded border border-[#5e6673]/30">
                            {trade.trading_accounts?.name || 'Unknown'}
                        </span>
                    </td>

                    <td className="p-4 font-bold text-white">{trade.symbol}</td>
                    <td className={`p-4 font-bold uppercase ${trade.type === 'buy' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                       {trade.type}
                    </td>
                    <td className="p-4 text-[#8b9bb4]">${trade.size}</td>
                    <td className="p-4 font-mono text-[#8b9bb4]">{trade.entry_price}</td>
                    <td className={`p-4 font-mono font-bold text-right ${trade.pnl && trade.pnl >= 0 ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                       {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '--'}
                    </td>
                 </tr>
              ))}
              {trades.length === 0 && (
                 <tr><td colSpan={7} className="p-8 text-center text-[#5e6673]">No trading history available</td></tr>
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
}