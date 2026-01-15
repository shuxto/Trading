import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

// ✅ ADDED INTERFACE
interface BankingTabProps {
  currentBalance: number;
}

export default function BankingTab({ currentBalance }: BankingTabProps) { // ✅ ACCEPT PROP
  const [mode, setMode] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState<string>('');
  // Use the prop instead of local state for balance display if you want live updates from parent
  // But we can keep local balance if we want to fetch fresh data. 
  // For now, let's use the prop as the initial display value.
  const [transactions, setTransactions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // loading removed to fix warning
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (txs) setTransactions(txs);
    }
  };

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (mode === 'withdrawal' && val > currentBalance) {
      alert("❌ Insufficient Funds! You cannot withdraw more than your balance.");
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: mode,
          amount: val,
          status: 'pending'
        }]);

      if (error) {
        alert("Error creating request: " + error.message);
      } else {
        alert("✅ Request submitted! Waiting for Admin approval.");
        setAmount('');
        fetchData(); 
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* LEFT: ACTION CARD */}
      <div className="lg:col-span-1 bg-[#1e232d] border border-[#2a2e39] rounded-2xl p-6 flex flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-1">Banking Center</h2>
          <p className="text-xs text-[#8b9bb4]">Manage your funds securely.</p>
        </div>

        {/* BALANCE CARD */}
        <div className="bg-[#151a21] rounded-xl p-4 mb-6 border border-[#2a2e39] flex items-center justify-between">
           <div>
              <div className="text-[10px] text-[#8b9bb4] font-bold uppercase tracking-wider">Available Balance</div>
              {/* ✅ USING PROP */}
              <div className="text-2xl font-mono font-bold text-white">${currentBalance.toLocaleString()}</div>
           </div>
           <div className="h-10 w-10 bg-[#21ce99]/20 rounded-full flex items-center justify-center text-[#21ce99]">
              <Wallet size={20} />
           </div>
        </div>

        {/* TOGGLE SWITCH */}
        <div className="flex bg-[#151a21] p-1 rounded-xl mb-6">
           <button 
             onClick={() => setMode('deposit')}
             className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'deposit' ? 'bg-[#21ce99] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
           >
             <ArrowDownLeft size={16} /> DEPOSIT
           </button>
           <button 
             onClick={() => setMode('withdrawal')}
             className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'withdrawal' ? 'bg-[#f23645] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
           >
             <ArrowUpRight size={16} /> WITHDRAW
           </button>
        </div>

        {/* INPUT FORM */}
        <div className="space-y-4">
           <div className="space-y-2">
              <label className="text-xs font-bold text-[#8b9bb4] uppercase">Amount (USD)</label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-lg">$</span>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-8 pr-4 text-white font-mono font-bold focus:border-[#F0B90B] outline-none transition-colors"
                 />
              </div>
           </div>

           {mode === 'withdrawal' && (
             <div className="text-[10px] text-[#f23645] bg-[#f23645]/10 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>Withdrawals are processed manually within 24 hours. Ensure your details are correct.</span>
             </div>
           )}

           <button 
             onClick={handleSubmit}
             disabled={submitting || !amount}
             className={`w-full py-4 rounded-xl font-black tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
               mode === 'deposit' 
               ? 'bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] shadow-[0_0_20px_rgba(33,206,153,0.2)]' 
               : 'bg-[#f23645] hover:bg-[#d12c39] text-white shadow-[0_0_20px_rgba(242,54,69,0.2)]'
             }`}
           >
             {submitting ? 'PROCESSING...' : `CONFIRM ${mode.toUpperCase()}`}
           </button>
        </div>
      </div>

      {/* RIGHT: HISTORY LIST */}
      <div className="lg:col-span-2 bg-[#1e232d] border border-[#2a2e39] rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2a2e39] flex items-center gap-2">
           <History size={18} className="text-[#8b9bb4]" />
           <h3 className="font-bold text-white text-sm">Transaction History</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <table className="w-full text-left text-sm">
             <thead className="bg-[#151a21] text-[#8b9bb4] sticky top-0">
               <tr>
                 <th className="p-4 font-bold text-xs uppercase">Type</th>
                 <th className="p-4 font-bold text-xs uppercase text-right">Amount</th>
                 <th className="p-4 font-bold text-xs uppercase text-center">Status</th>
                 <th className="p-4 font-bold text-xs uppercase text-right">Date</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#2a2e39]">
               {transactions.length === 0 ? (
                 <tr><td colSpan={4} className="p-10 text-center text-gray-500 italic">No transactions found</td></tr>
               ) : (
                 transactions.map(tx => (
                   <tr key={tx.id} className="hover:bg-[#252a36] transition-colors">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                             tx.type === 'deposit' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'
                           }`}>
                             {tx.type === 'deposit' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                           </div>
                           <span className="font-bold capitalize text-white">{tx.type}</span>
                        </div>
                     </td>
                     <td className={`p-4 text-right font-mono font-bold ${tx.type === 'deposit' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                     </td>
                     <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          tx.status === 'approved' ? 'bg-[#21ce99]/20 text-[#21ce99]' :
                          tx.status === 'rejected' ? 'bg-[#f23645]/20 text-[#f23645]' :
                          'bg-[#F0B90B]/20 text-[#F0B90B]'
                        }`}>
                          {tx.status === 'approved' && <CheckCircle size={10} />}
                          {tx.status === 'rejected' && <XCircle size={10} />}
                          {tx.status === 'pending' && <Clock size={10} />}
                          {tx.status}
                        </span>
                     </td>
                     <td className="p-4 text-right text-xs text-[#5e6673] font-mono">
                       {new Date(tx.created_at).toLocaleDateString()}
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}