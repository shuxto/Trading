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
  ChevronRight,
  CreditCard,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // Logic Fix: Use exact database enum values
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
        if (!selectedAccount && rooms.length > 0) setSelectedAccount(rooms[0]);
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
        const { error } = await supabase.rpc('transfer_funds', {
            p_room_id: selectedAccount.id,
            p_amount: val,
            p_direction: direction 
        });

        if (error) throw error;
        
        setAmount('');
        await fetchData(); 
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
    <div className="space-y-8 animate-in fade-in pb-10 font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LEFT: HOLOGRAPHIC MAIN WALLET --- */}
        <div className="relative group h-[340px]">
            {/* Animated Glow Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#21ce99] to-[#21ce99]/20 rounded-[22px] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            
            <div className="relative h-full bg-[#151a21] rounded-[20px] p-8 flex flex-col overflow-hidden border border-white/10 shadow-2xl">
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#21ce99]/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 opacity-10 text-white pointer-events-none">
                    <Wallet size={200} strokeWidth={0.5} />
                </div>

                {/* Card Header */}
                <div className="flex items-center justify-between mb-8 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#21ce99]/10 rounded-xl border border-[#21ce99]/20 text-[#21ce99] shadow-[0_0_15px_rgba(33,206,153,0.3)]">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-wide uppercase">Main Vault</h2>
                            <div className="flex items-center gap-1 text-[10px] text-[#21ce99] font-mono font-bold tracking-widest">
                                <Shield size={10} /> SECURE CORE
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-gray-400 font-mono">
                        ID: {mainBalance > 0 ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                </div>

                {/* Balance */}
                <div className="mb-auto z-10">
                    <div className="text-[10px] text-[#8b9bb4] uppercase font-bold tracking-widest mb-1">Available Equity</div>
                    <div className="text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4 mt-6 z-10">
                    <button 
                        onClick={() => { setActiveSection('deposit'); setAmount(''); }}
                        className={`relative overflow-hidden group/btn font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border ${activeSection === 'deposit' ? 'bg-[#21ce99] border-[#21ce99] text-[#0b0e11]' : 'bg-[#1e232d] border-white/10 text-white hover:border-[#21ce99]/50'}`}
                    >
                        <div className="absolute inset-0 bg-[#21ce99]/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        <ArrowDownLeft size={18} className={activeSection === 'deposit' ? 'text-black' : 'text-[#21ce99]'} /> 
                        <span className="uppercase tracking-wider text-xs">Deposit</span>
                    </button>
                    <button 
                        onClick={() => { setActiveSection('withdrawal'); setAmount(''); }}
                        className={`relative overflow-hidden group/btn font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border ${activeSection === 'withdrawal' ? 'bg-[#f23645] border-[#f23645] text-white' : 'bg-[#1e232d] border-white/10 text-white hover:border-[#f23645]/50'}`}
                    >
                        <div className="absolute inset-0 bg-[#f23645]/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        <ArrowUpRight size={18} className={activeSection === 'withdrawal' ? 'text-white' : 'text-[#f23645]'} /> 
                        <span className="uppercase tracking-wider text-xs">Withdraw</span>
                    </button>
                </div>
            </div>
        </div>

        {/* --- RIGHT: DYNAMIC ACTION PANEL --- */}
        <div className="bg-[#151a21] border border-white/10 rounded-[20px] p-1 flex flex-col h-[340px] shadow-2xl relative overflow-hidden">
          {/* Scanline Effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(33, 206, 153, .3) 25%, rgba(33, 206, 153, .3) 26%, transparent 27%, transparent 74%, rgba(33, 206, 153, .3) 75%, rgba(33, 206, 153, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(33, 206, 153, .3) 25%, rgba(33, 206, 153, .3) 26%, transparent 27%, transparent 74%, rgba(33, 206, 153, .3) 75%, rgba(33, 206, 153, .3) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }} />

          <div className="bg-[#1e232d]/50 backdrop-blur-sm h-full rounded-[18px] p-6 flex flex-col relative z-10">
            {activeSection !== 'transfer' ? (
                // --- DEPOSIT / WITHDRAW FORM ---
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-white uppercase tracking-wider flex items-center gap-2 text-lg">
                          {activeSection === 'deposit' ? <ArrowDownLeft className="text-[#21ce99]" /> : <ArrowUpRight className="text-[#f23645]" />}
                          {activeSection === 'deposit' ? 'Incoming Transfer' : 'Outgoing Transfer'}
                        </h3>
                        <button onClick={() => { setActiveSection('transfer'); setAmount(''); }} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded text-gray-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
                          Cancel
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-xs text-[#8b9bb4] mb-4 leading-relaxed font-mono">
                          {activeSection === 'deposit' 
                            ? "> INITIATE SECURE DEPOSIT PROTOCOL. FUNDS WILL BE HELD IN ESCROW UNTIL VERIFIED."
                            : "> INITIATE WITHDRAWAL SEQUENCE. REQUEST SUBJECT TO ADMIN APPROVAL."}
                        </p>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-lg">$</span>
                            <input 
                              type="number" 
                              value={amount} 
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00" 
                              className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-4 pl-8 pr-4 text-white font-mono text-xl font-bold focus:border-[#21ce99] focus:shadow-[0_0_20px_rgba(33,206,153,0.1)] outline-none transition-all placeholder-gray-700"
                              autoFocus
                            />
                        </div>
                    </div>

                    <button 
                      onClick={handleExternalRequest} 
                      disabled={loading || !amount} 
                      className={`w-full font-black py-4 rounded-xl mt-auto transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
                        activeSection === 'deposit' 
                          ? 'bg-gradient-to-r from-[#21ce99] to-[#1db586] text-[#0b0e11] hover:shadow-[0_0_20px_rgba(33,206,153,0.3)]' 
                          : 'bg-gradient-to-r from-[#f23645] to-[#d12c39] text-white hover:shadow-[0_0_20px_rgba(242,54,69,0.3)]'
                      }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : `CONFIRM ${activeSection === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'}`}
                    </button>
                </motion.div>
            ) : (
                // --- INTERNAL TRANSFER FORM ---
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#F0B90B]/10 rounded-lg text-[#F0B90B]">
                            <ArrowRightLeft size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">Internal Relay</h2>
                            <p className="text-[10px] text-[#8b9bb4] font-mono">MOVE FUNDS BETWEEN UNITS</p>
                        </div>
                    </div>

                    {/* Logic Fix: Buttons correctly set the direction state */}
                    <div className="bg-[#0b0e11] p-1 rounded-xl mb-4 grid grid-cols-2 gap-1 border border-white/5">
                        <button 
                            onClick={() => setDirection('deposit')}
                            className={`py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${direction === 'deposit' ? 'bg-[#21ce99] text-[#0b0e11] shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Main <span className="opacity-50">➔</span> Room
                        </button>
                        <button 
                            onClick={() => setDirection('withdraw')}
                            className={`py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${direction === 'withdraw' ? 'bg-[#F0B90B] text-[#0b0e11] shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Room <span className="opacity-50">➔</span> Main
                        </button>
                    </div>

                    <div className="space-y-3 flex-1">
                        <div className="relative">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full bg-[#0b0e11] border border-[#2a2e39] px-4 py-3 rounded-xl flex items-center justify-between hover:border-[#21ce99]/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                   <div className={`p-1.5 rounded-md ${selectedAccount ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-gray-800 text-gray-500'}`}>
                                      <Briefcase size={14} />
                                   </div>
                                   <span className="text-xs font-bold text-white uppercase tracking-wide">{selectedAccount?.name || 'Select Target Room'}</span>
                                </div>
                                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#151a21] border border-[#2a2e39] rounded-xl shadow-2xl z-30 overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
                                        {accounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => { setSelectedAccount(acc); setIsDropdownOpen(false); }}
                                                className="w-full text-left px-4 py-3 hover:bg-[#21ce99]/10 flex items-center justify-between border-b border-white/5 last:border-0 group"
                                            >
                                                <span className="text-xs font-bold text-gray-400 group-hover:text-white">{acc.name}</span>
                                                <span className="text-[10px] font-mono text-[#21ce99]">${acc.balance?.toLocaleString()}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00" 
                                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-8 pr-4 text-white font-mono font-bold focus:border-[#F0B90B] focus:shadow-[0_0_15px_rgba(240,185,11,0.1)] outline-none transition-all placeholder-gray-700"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleInternalTransfer}
                        disabled={loading || !selectedAccount}
                        className="mt-auto w-full bg-gradient-to-r from-[#2a303c] to-[#1e232d] hover:from-[#363c4a] hover:to-[#2a303c] border border-white/5 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase tracking-widest text-xs hover:shadow-lg hover:border-white/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Execute Transfer'}
                    </button>
                </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM: TECH HISTORY GRID --- */}
      <div className="bg-[#151a21] border border-white/10 rounded-[22px] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#191f2e]">
           <div className="flex items-center gap-2">
             <History size={16} className="text-[#21ce99]" />
             <h3 className="font-black text-white text-xs uppercase tracking-widest">Transaction Log</h3>
           </div>
           <div className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] text-gray-500 font-mono">
              PAGE {currentPage} / {totalPages || 1}
           </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-[#0b0e11] text-gray-500 text-[10px] uppercase font-bold tracking-wider">
               <tr>
                 <th className="px-6 py-3">Type</th>
                 <th className="px-6 py-3 text-right">Amount</th>
                 <th className="px-6 py-3 text-center">Status</th>
                 <th className="px-6 py-3 text-right">Timestamp</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5 text-sm">
               {currentTransactions.length === 0 ? (
                 <tr><td colSpan={4} className="p-10 text-center text-gray-600 font-mono text-xs">NO DATA LOGGED</td></tr>
               ) : (
                 currentTransactions.map(tx => (
                   <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                            tx.type === 'deposit' ? 'bg-[#21ce99]/10 border-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/10 border-[#f23645]/20 text-[#f23645]'
                           }`}>
                             {tx.type === 'deposit' ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                           </div>
                           <span className="font-bold uppercase text-white text-xs tracking-wide">{tx.type}</span>
                        </div>
                     </td>
                     <td className={`px-6 py-4 text-right font-mono font-bold ${tx.type === 'deposit' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5 ${
                          tx.status === 'approved' ? 'bg-[#21ce99]/10 text-[#21ce99] border border-[#21ce99]/20' :
                          tx.status === 'rejected' ? 'bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/20' :
                          'bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/20'
                        }`}>
                          {tx.status === 'approved' && <CheckCircle size={10} />}
                          {tx.status === 'rejected' && <XCircle size={10} />}
                          {tx.status === 'pending' && <Clock size={10} />}
                          {tx.status === 'pending' ? 'PROCESSING' : tx.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-mono">
                       {new Date(tx.created_at).toLocaleDateString()} <span className="opacity-50 text-[8px]">{new Date(tx.created_at).toLocaleTimeString()}</span>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>

        {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-white/5 bg-[#151a21] flex justify-between items-center">
                <button 
                  onClick={prevPage}
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
                             : 'bg-[#0b0e11] text-gray-500 hover:text-white hover:bg-white/10'
                         }`}
                       >
                         {page}
                       </button>
                   ))}
                </div>

                <button 
                  onClick={nextPage}
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