import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Wallet, 
  ArrowRightLeft, 
  ArrowDownLeft, 
  ArrowUpRight,
  ChevronDown, 
  Briefcase, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function BankingTab() {
  const [mainBalance, setMainBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // UI State
  const [activeSection, setActiveSection] = useState<'transfer' | 'deposit' | 'withdrawal'>('transfer');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [amount, setAmount] = useState('');
  
  // 🟢 FIX 1: Use the exact words the Database expects ('deposit' or 'withdraw')
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Main Wallet
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
    if (profile) setMainBalance(profile.balance);

    // 2. Get Rooms
    const { data: rooms } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).order('created_at');
    if (rooms) {
        setAccounts(rooms);
        // If we have accounts but none selected, select the first one
        if (!selectedAccount && rooms.length > 0) setSelectedAccount(rooms[0]);
        // If we already had one selected, make sure to update its balance from the fresh data
        else if (selectedAccount) {
            const updated = rooms.find(r => r.id === selectedAccount.id);
            if (updated) setSelectedAccount(updated);
        }
    }

    // 3. Get Transaction History
    const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    if (txs) setTransactions(txs);
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // --- INTERNAL TRANSFER ---
  const handleInternalTransfer = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (!selectedAccount) return;

    setLoading(true);
    try {
        // 🟢 FIX 2: Send the 'direction' (deposit/withdraw) correctly
        const { error } = await supabase.rpc('transfer_funds', {
            p_room_id: selectedAccount.id,
            p_amount: val,
            p_direction: direction 
        });

        if (error) throw error;
        
        setAmount('');
        await fetchData(); // Refresh data to show new balance immediately
        alert("Transfer Successful! 🚀");
    } catch (err: any) {
        alert("Transfer Failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- EXTERNAL REQUEST ---
  const handleExternalRequest = async () => {
      const val = parseFloat(amount);
      if (!val || val <= 0) return;
      
      if (activeSection === 'withdrawal' && val > mainBalance) {
          alert("Insufficient funds in Main Wallet.");
          return;
      }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
          const { error } = await supabase.from('transactions').insert({
              user_id: user.id,
              type: activeSection,
              amount: val,
              status: 'pending'
          });

          if (!error) {
            setAmount('');
            setActiveSection('transfer');
            fetchData();
          }
      }
      setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- LEFT: MAIN WALLET --- */}
        <div className="bg-[#1e232d] border border-[#2a2e39] rounded-2xl p-6 flex flex-col relative overflow-hidden h-[320px]">
          <div className="absolute top-0 right-0 p-6 opacity-5">
              <Wallet size={120} />
          </div>

          <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#21ce99]/10 rounded-xl text-[#21ce99]">
                  <Wallet size={24} />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-white">Main Wallet</h2>
                  <p className="text-xs text-[#8b9bb4]">Central Hub</p>
              </div>
          </div>

          <div className="mb-auto">
              <div className="text-xs text-[#8b9bb4] uppercase font-bold tracking-wider mb-2">Available Balance</div>
              <div className="text-4xl font-mono font-bold text-white">
                  ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                  onClick={() => { setActiveSection('deposit'); setAmount(''); }}
                  className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${activeSection === 'deposit' ? 'bg-[#21ce99] text-black shadow-lg shadow-[#21ce99]/20' : 'bg-[#2a303c] text-white hover:bg-[#363c4a]'}`}
              >
                  <ArrowDownLeft size={18} /> Deposit
              </button>
              <button 
                  onClick={() => { setActiveSection('withdrawal'); setAmount(''); }}
                  className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${activeSection === 'withdrawal' ? 'bg-[#f23645] text-white shadow-lg shadow-[#f23645]/20' : 'bg-[#2a303c] text-white hover:bg-[#363c4a]'}`}
              >
                  <ArrowUpRight size={18} /> Withdraw
              </button>
          </div>
        </div>

        {/* --- RIGHT: DYNAMIC ACTION PANEL --- */}
        <div className="bg-[#1e232d] border border-[#2a2e39] rounded-2xl p-6 flex flex-col h-[320px]">
          
          {activeSection !== 'transfer' ? (
              <div className="flex flex-col h-full animate-in slide-in-from-right-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {activeSection === 'deposit' ? <ArrowDownLeft className="text-[#21ce99]" /> : <ArrowUpRight className="text-[#f23645]" />}
                        {activeSection === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                      </h3>
                      <button onClick={() => { setActiveSection('transfer'); setAmount(''); }} className="text-xs text-[#8b9bb4] hover:text-white underline">
                        Cancel & Return
                      </button>
                  </div>

                  <div className="mb-4">
                      <p className="text-xs text-[#8b9bb4] mb-4 leading-relaxed">
                        {activeSection === 'deposit' 
                          ? "Enter the amount you wish to deposit. Your request will be reviewed by our financial team."
                          : "Enter the amount to withdraw. Funds will be deducted from your Main Wallet upon approval."}
                      </p>
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount (USD)" 
                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl p-4 text-white font-mono font-bold focus:border-[#21ce99] outline-none"
                      />
                  </div>

                  <button 
                    onClick={handleExternalRequest} 
                    disabled={loading || !amount} 
                    className={`w-full font-bold py-3 rounded-xl mt-auto transition-all disabled:opacity-50 ${
                      activeSection === 'deposit' 
                        ? 'bg-[#21ce99] text-[#0b0e11] hover:bg-[#1db586]' 
                        : 'bg-[#f23645] text-white hover:bg-[#d12c39]'
                    }`}
                  >
                      {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : `Submit ${activeSection === 'deposit' ? 'Deposit' : 'Withdrawal'} Request`}
                  </button>
              </div>
          ) : (
              // INTERNAL TRANSFER FORM
              <div className="flex flex-col h-full animate-in slide-in-from-left-4">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-[#F0B90B]/10 rounded-xl text-[#F0B90B]">
                          <ArrowRightLeft size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white">Internal Transfer</h2>
                          <p className="text-xs text-[#8b9bb4]">Move funds to trading rooms</p>
                      </div>
                  </div>

                  {/* 🟢 FIX 3: Update Buttons to set 'deposit' or 'withdraw' */}
                  <div className="flex items-center justify-between bg-[#151a21] p-1 rounded-xl mb-3">
                      <button 
                          onClick={() => setDirection('deposit')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${direction === 'deposit' ? 'bg-[#21ce99] text-[#0b0e11]' : 'text-[#5e6673] hover:text-white'}`}
                      >
                          Main ➔ Room
                      </button>
                      <button 
                          onClick={() => setDirection('withdraw')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${direction === 'withdraw' ? 'bg-[#F0B90B] text-[#0b0e11]' : 'text-[#5e6673] hover:text-white'}`}
                      >
                          Room ➔ Main
                      </button>
                  </div>

                  <div className="relative mb-3">
                      <button 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full bg-[#0b0e11] border border-[#2a2e39] p-3 rounded-xl flex items-center justify-between hover:border-[#5e6673] transition-all"
                      >
                          <div className="flex items-center gap-2">
                             <Briefcase size={16} className="text-[#5e6673]" />
                             <span className="text-sm font-bold text-white">{selectedAccount?.name || 'Select Room'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-mono text-[#21ce99]">${selectedAccount?.balance?.toLocaleString() || '0.00'}</span>
                             <ChevronDown size={16} className={`text-[#5e6673] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                      </button>

                      {isDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-xl z-20 overflow-hidden max-h-40 overflow-y-auto">
                              {accounts.map(acc => (
                                  <button
                                      key={acc.id}
                                      onClick={() => { setSelectedAccount(acc); setIsDropdownOpen(false); }}
                                      className="w-full text-left p-3 hover:bg-[#2a303c] flex items-center justify-between border-b border-[#2a2e39] last:border-0"
                                  >
                                      <span className="text-sm font-bold text-gray-300">{acc.name || 'Trading Room ' + acc.id.slice(0,4)}</span>
                                      <span className="text-xs font-mono text-[#21ce99]">${acc.balance?.toLocaleString()}</span>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

                  <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl p-3 text-white font-mono font-bold focus:border-[#21ce99] outline-none mb-3"
                  />

                  <button 
                      onClick={handleInternalTransfer}
                      disabled={loading || !selectedAccount}
                      className="mt-auto w-full bg-[#2a303c] hover:bg-[#363c4a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Transfer'}
                  </button>
              </div>
          )}
        </div>
      </div>

      {/* --- BOTTOM: PAGINATED HISTORY --- */}
      <div className="bg-[#1e232d] border border-[#2a2e39] rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2a2e39] flex items-center justify-between bg-[#151a21]">
           <div className="flex items-center gap-2">
             <History size={18} className="text-[#8b9bb4]" />
             <h3 className="font-bold text-white text-sm">Transaction History</h3>
           </div>
           {/* Page Info */}
           <div className="text-[10px] text-[#5e6673] font-bold uppercase tracking-wider">
              Page {currentPage} of {totalPages || 1}
           </div>
        </div>

        <div>
           <table className="w-full text-left text-sm">
             <thead className="bg-[#151a21] text-[#8b9bb4]">
               <tr>
                 <th className="p-4 font-bold text-xs uppercase">Type</th>
                 <th className="p-4 font-bold text-xs uppercase text-right">Amount</th>
                 <th className="p-4 font-bold text-xs uppercase text-center">Status</th>
                 <th className="p-4 font-bold text-xs uppercase text-right">Date</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#2a2e39]">
               {currentTransactions.length === 0 ? (
                 <tr><td colSpan={4} className="p-10 text-center text-gray-500 italic">No transactions found</td></tr>
               ) : (
                 currentTransactions.map(tx => (
                   <tr key={tx.id} className="hover:bg-[#252a36] transition-colors">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            tx.type === 'deposit' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'
                           }`}>
                             {tx.type === 'deposit' ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                           </div>
                           <span className="font-bold capitalize text-white text-xs">{tx.type}</span>
                        </div>
                     </td>
                     <td className={`p-4 text-right font-mono font-bold text-xs ${tx.type === 'deposit' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                     </td>
                     <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5 ${
                          tx.status === 'approved' ? 'bg-[#21ce99]/10 text-[#21ce99] border border-[#21ce99]/20' :
                          tx.status === 'rejected' ? 'bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/20' :
                          'bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/20'
                        }`}>
                          {tx.status === 'approved' && <CheckCircle size={10} />}
                          {tx.status === 'rejected' && <XCircle size={10} />}
                          {tx.status === 'pending' && <Clock size={10} />}
                          {tx.status === 'pending' ? 'Pending Approval' : tx.status}
                        </span>
                     </td>
                     <td className="p-4 text-right text-[10px] text-[#5e6673] font-mono">
                       {new Date(tx.created_at).toLocaleDateString()}
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-[#2a2e39] bg-[#151a21] flex justify-between items-center">
                <button 
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 text-xs font-bold text-[#8b9bb4] hover:text-white disabled:opacity-30 disabled:hover:text-[#8b9bb4]"
                >
                    <ChevronLeft size={14} /> Previous
                </button>
                
                <div className="flex gap-1">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                       <button
                         key={page}
                         onClick={() => setCurrentPage(page)}
                         className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                             currentPage === page 
                             ? 'bg-[#21ce99] text-[#0b0e11]' 
                             : 'bg-[#2a303c] text-[#8b9bb4] hover:bg-[#363c4a]'
                         }`}
                       >
                         {page}
                       </button>
                   ))}
                </div>

                <button 
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 text-xs font-bold text-[#8b9bb4] hover:text-white disabled:opacity-30 disabled:hover:text-[#8b9bb4]"
                >
                    Next <ChevronRight size={14} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
}