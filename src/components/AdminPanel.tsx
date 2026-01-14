import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, DollarSign, LogOut, Check, X, Shield } from 'lucide-react';

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'trades' | 'deposits'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
    }
    if (activeTab === 'trades') {
      const { data } = await supabase.from('trades').select('*, profiles(email)').eq('status', 'open');
      if (data) setTrades(data);
    }
    if (activeTab === 'deposits') {
      const { data } = await supabase.from('transactions').select('*, profiles(email)').eq('status', 'pending');
      if (data) setDeposits(data);
    }
    setLoading(false);
  };

  // --- ACTIONS ---
  
  const updateUserBalance = async (userId: string, currentBalance: number) => {
    const newAmount = prompt("Enter new balance:", currentBalance.toString());
    if (newAmount === null) return;
    
    const { error } = await supabase.from('profiles').update({ balance: parseFloat(newAmount) }).eq('id', userId);
    if (!error) {
        alert("Balance Updated");
        fetchData();
    }
  };

  const approveDeposit = async (txId: number, userId: string, amount: number) => {
    // 1. Update Transaction Status
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);
    
    // 2. Add Money to User
    // (In a real app, use a Postgres function. Here we fetch -> add -> update for simplicity)
    const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (user) {
        await supabase.from('profiles').update({ balance: user.balance + amount }).eq('id', userId);
    }
    alert("Deposit Approved & Balance Updated");
    fetchData();
  };

  const closeUserTrade = async (tradeId: number) => {
    if(!confirm("Are you sure you want to force close this user's trade?")) return;
    await supabase.from('trades').delete().eq('id', tradeId);
    alert("Trade Closed");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans">
      {/* Admin Header */}
      <div className="h-16 bg-[#151a21] border-b border-[#2a2e39] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#f23645] text-white p-2 rounded-lg"><Shield size={20} /></div>
          <h1 className="font-bold text-xl tracking-wide">ADMIN<span className="text-[#f23645]">PANEL</span></h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-[#5e6673] hover:text-white">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-64 bg-[#151a21] border-r border-[#2a2e39] p-4 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#21ce99] text-black' : 'text-[#8b9bb4] hover:bg-white/5'}`}>
            <Users size={18} /> Users
          </button>
          <button onClick={() => setActiveTab('trades')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'trades' ? 'bg-[#21ce99] text-black' : 'text-[#8b9bb4] hover:bg-white/5'}`}>
            <TrendingUp size={18} /> Active Trades
          </button>
          <button onClick={() => setActiveTab('deposits')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'deposits' ? 'bg-[#21ce99] text-black' : 'text-[#8b9bb4] hover:bg-white/5'}`}>
            <DollarSign size={18} /> Deposits
            {deposits.length > 0 && <span className="bg-[#f23645] text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">{deposits.length}</span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 capitalize">{activeTab} Management</h2>

          {loading ? <div className="text-[#5e6673]">Loading data...</div> : (
            <div className="bg-[#151a21] border border-[#2a2e39] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#1e232d] text-[#8b9bb4] text-xs uppercase">
                  <tr>
                    {activeTab === 'users' && <><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Balance</th><th className="p-4 text-right">Actions</th></>}
                    {activeTab === 'trades' && <><th className="p-4">User</th><th className="p-4">Symbol</th><th className="p-4">Type</th><th className="p-4">Size</th><th className="p-4 text-right">Actions</th></>}
                    {activeTab === 'deposits' && <><th className="p-4">User</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39] text-sm">
                  
                  {/* USERS LIST */}
                  {activeTab === 'users' && users.map(user => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="p-4 font-bold">{user.email}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-[#f23645]/20 text-[#f23645]' : 'bg-[#21ce99]/20 text-[#21ce99]'}`}>{user.role}</span></td>
                      <td className="p-4 font-mono">${user.balance.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => updateUserBalance(user.id, user.balance)} className="text-[#21ce99] hover:underline text-xs font-bold">Edit Balance</button>
                      </td>
                    </tr>
                  ))}

                  {/* TRADES LIST */}
                  {activeTab === 'trades' && trades.map(trade => (
                    <tr key={trade.id} className="hover:bg-white/5">
                      <td className="p-4 text-[#8b9bb4]">{trade.profiles?.email}</td>
                      <td className="p-4 font-bold text-white">{trade.symbol}</td>
                      <td className={`p-4 font-bold uppercase ${trade.type === 'buy' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>{trade.type}</td>
                      <td className="p-4">${trade.size}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => closeUserTrade(trade.id)} className="bg-[#f23645]/10 text-[#f23645] hover:bg-[#f23645] hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all">Force Close</button>
                      </td>
                    </tr>
                  ))}

                  {/* DEPOSITS LIST */}
                  {activeTab === 'deposits' && deposits.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-4 text-[#8b9bb4]">{tx.profiles?.email}</td>
                      <td className="p-4 font-bold text-white font-mono">${tx.amount}</td>
                      <td className="p-4 text-yellow-500 font-bold uppercase text-xs">{tx.status}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                         <button onClick={() => approveDeposit(tx.id, tx.user_id, tx.amount)} className="p-2 bg-[#21ce99]/10 text-[#21ce99] hover:bg-[#21ce99] hover:text-black rounded-lg"><Check size={14} /></button>
                         <button className="p-2 bg-[#f23645]/10 text-[#f23645] hover:bg-[#f23645] hover:text-white rounded-lg"><X size={14} /></button>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
              {activeTab === 'users' && users.length === 0 && <div className="p-8 text-center text-[#5e6673]">No users found</div>}
              {activeTab === 'trades' && trades.length === 0 && <div className="p-8 text-center text-[#5e6673]">No active trades</div>}
              {activeTab === 'deposits' && deposits.length === 0 && <div className="p-8 text-center text-[#5e6673]">No pending deposits</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}