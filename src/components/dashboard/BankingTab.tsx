import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'; // <-- Removed DollarSign
import type { Transaction } from '../../types';

export default function BankingTab({ currentBalance }: { currentBalance: number }) {
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
  };

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: val,
      status: 'pending' 
    });
    alert('Deposit request sent!');
    setAmount('');
    fetchTransactions();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white">Banking & Funds</h2>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39]">
          <h3 className="text-[#8b9bb4] font-bold text-sm uppercase">Available Balance</h3>
          <div className="text-3xl font-mono font-bold text-white mt-2">
            ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39]">
           <label className="text-[#8b9bb4] font-bold text-xs uppercase">Deposit Amount (USD)</label>
           <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-lg py-2 pl-6 pr-4 text-white focus:border-[#21ce99] outline-none"
                />
              </div>
              <button 
                onClick={handleDeposit}
                className="bg-[#21ce99] text-[#0b0e11] font-bold px-6 rounded-lg hover:bg-[#1db586]"
              >
                Deposit
              </button>
           </div>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="font-bold text-white mb-4">Transaction History</h3>
        <div className="space-y-2">
          {transactions.map(tx => (
             <div key={tx.id} className="flex items-center justify-between p-4 bg-[#1e232d] rounded-xl border border-[#2a2e39]">
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                   </div>
                   <div>
                      <div className="font-bold text-white capitalize">{tx.type}</div>
                      <div className="text-xs text-[#5e6673]">{new Date(tx.created_at).toLocaleDateString()}</div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="font-mono font-bold text-white">${tx.amount}</div>
                   <div className={`text-xs font-bold uppercase ${
                      tx.status === 'approved' ? 'text-[#21ce99]' : 
                      tx.status === 'rejected' ? 'text-[#f23645]' : 'text-yellow-500'
                   }`}>{tx.status}</div>
                </div>
             </div>
          ))}
          {transactions.length === 0 && <p className="text-[#5e6673]">No transactions found.</p>}
        </div>
      </div>
    </div>
  );
}