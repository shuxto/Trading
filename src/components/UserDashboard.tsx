import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, History, TrendingUp, ShieldAlert } from 'lucide-react';
import type { UserProfile, Trade, Transaction } from '../types';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDashboard({ isOpen, onClose }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'banking' | 'history'>('overview');
  const [amount, setAmount] = useState('');


  // --- FETCH DATA ---
  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen]);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Profile (Balance)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Get Trade History
    const { data: tradeData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 3. Get Transactions (Deposits)
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (profileData) setProfile(profileData);
    if (tradeData) setTrades(tradeData);
    if (txData) setTransactions(txData);
  }

  // --- HANDLE DEPOSIT ---
  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !profile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create a "Pending" transaction
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: val,
      status: 'pending' // Admin must approve this!
    });

    if (!error) {
      alert('Deposit request sent! Waiting for Admin approval.');
      setAmount('');
      fetchData(); // Refresh list
    } else {
      alert('Error processing deposit.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0e11]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#151a21] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2e39] bg-[#1e232d]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#21ce99]/20 flex items-center justify-center text-[#21ce99]">
               <Wallet size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Client Portal</h2>
               <p className="text-xs text-[#5e6673] font-mono">{profile?.email}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-[#5e6673] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* SIDEBAR + CONTENT LAYOUT */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* SIDEBAR MENU */}
          <div className="w-48 bg-[#191f2e] border-r border-[#2a2e39] p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-[#21ce99] text-black' : 'text-[#8b9bb4] hover:bg-white/5'}`}
            >
              <TrendingUp size={16} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('banking')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'banking' ? 'bg-[#21ce99] text-black' : 'text-[#8b9bb4] hover:bg-white/5'}`}
            >
              <ArrowUpRight size={16} /> Banking
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-[#21ce99] text-black' : 'text-[#8b9bb4] hover:bg-white/5'}`}
            >
              <History size={16} /> Trade History
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#0b0e11]">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                 {/* Balance Card */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1e232d] to-[#151a21] border border-[#2a2e39]">
                       <span className="text-[#8b9bb4] text-xs font-bold uppercase tracking-wider">Total Balance</span>
                       <div className="text-3xl font-mono font-bold text-white mt-2">
                         ${profile?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                       </div>
                       <div className="mt-4 flex items-center gap-2 text-xs text-[#21ce99] bg-[#21ce99]/10 w-fit px-2 py-1 rounded">
                          <ShieldAlert size={12} /> Live Account Active
                       </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#151a21] border border-[#2a2e39] flex flex-col justify-center">
                       <span className="text-[#8b9bb4] text-xs font-bold uppercase tracking-wider">Total Trades</span>
                       <div className="text-3xl font-mono font-bold text-white mt-2">{trades.length}</div>
                    </div>
                 </div>
              </div>
            )}

            {/* 2. BANKING TAB */}
            {activeTab === 'banking' && (
               <div className="max-w-md mx-auto space-y-6">
                  <div className="text-center">
                     <h3 className="text-xl font-bold text-white">Fund Your Account</h3>
                     <p className="text-[#5e6673] text-sm mt-1">Secure deposit via Crypto or Bank Wire</p>
                  </div>

                  <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39]">
                     <label className="text-xs text-[#8b9bb4] font-bold uppercase">Amount (USD)</label>
                     <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                        <input 
                           type="number" 
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-8 pr-4 text-white font-mono focus:border-[#21ce99] outline-none transition-all"
                           placeholder="0.00"
                        />
                     </div>
                     <button 
                        onClick={handleDeposit}
                        className="w-full mt-4 bg-[#21ce99] hover:bg-[#1db586] text-[#0b0e11] font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(33,206,153,0.2)]"
                     >
                        DEPOSIT REQUEST
                     </button>
                  </div>

                  {/* Transaction History Mini-Table */}
                  <div>
                     <h4 className="text-white font-bold text-sm mb-3">Recent Transactions</h4>
                     <div className="space-y-2">
                        {transactions.map(tx => (
                           <div key={tx.id} className="flex items-center justify-between p-3 bg-[#1e232d] rounded-lg border border-[#2a2e39]">
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'}`}>
                                    {tx.type === 'deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-white text-xs font-bold uppercase">{tx.type}</span>
                                    <span className="text-[10px] text-[#5e6673]">{new Date(tx.created_at).toLocaleDateString()}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-white font-mono text-sm font-bold">${tx.amount}</div>
                                 <span className={`text-[10px] font-bold uppercase ${
                                    tx.status === 'approved' ? 'text-[#21ce99]' : 
                                    tx.status === 'rejected' ? 'text-[#f23645]' : 'text-yellow-500'
                                 }`}>
                                    {tx.status}
                                 </span>
                              </div>
                           </div>
                        ))}
                        {transactions.length === 0 && <div className="text-[#5e6673] text-center text-xs py-2">No transactions yet</div>}
                     </div>
                  </div>
               </div>
            )}

            {/* 3. HISTORY TAB */}
            {activeTab === 'history' && (
              <div>
                 <h3 className="text-white font-bold mb-4">Trade History</h3>
                 <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-[#151a21] text-[#8b9bb4]">
                          <tr>
                             <th className="p-3 font-medium text-xs uppercase">Symbol</th>
                             <th className="p-3 font-medium text-xs uppercase">Type</th>
                             <th className="p-3 font-medium text-xs uppercase">Size</th>
                             <th className="p-3 font-medium text-xs uppercase">Entry Price</th>
                             <th className="p-3 font-medium text-xs uppercase text-right">PnL</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#2a2e39]">
                          {trades.map(trade => (
                             <tr key={trade.id} className="hover:bg-[#252a36] transition-colors">
                                <td className="p-3 text-white font-bold">{trade.symbol}</td>
                                <td className={`p-3 font-bold uppercase ${trade.type === 'buy' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                                   {trade.type}
                                </td>
                                <td className="p-3 text-[#5e6673]">${trade.size}</td>
                                <td className="p-3 text-[#5e6673] font-mono">{trade.entry_price}</td>
                                <td className={`p-3 font-mono font-bold text-right ${trade.pnl && trade.pnl >= 0 ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                                   {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '--'}
                                </td>
                             </tr>
                          ))}
                          {trades.length === 0 && (
                             <tr><td colSpan={5} className="p-8 text-center text-[#5e6673]">No trades found</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}