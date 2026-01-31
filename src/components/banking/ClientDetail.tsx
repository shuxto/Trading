import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    ArrowLeft, Wallet, ArrowDownLeft, Gift, History, CheckCircle, XCircle, 
    Loader2, UserCog, Shield, CreditCard, Hash, Globe, Copy, Check, ArrowUpRight,
    Landmark, Bitcoin, CreditCard as CardIcon, HelpCircle, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientDetailProps {
  user: any;
  transactions: any[];
  onBack: () => void;
  // Updated type to include 'remove'
  onManageFunds: (userId: string, amount: number, type: 'deposit' | 'withdrawal' | 'bonus' | 'remove', transactionId?: number, method?: string) => Promise<void>;
  currentUserRole?: string;
}

export default function ClientDetail({ user, transactions = [], onBack, onManageFunds, currentUserRole }: ClientDetailProps) {
  const [actionAmount, setActionAmount] = useState('');
  // Added 'remove' to allowed actions
  const [activeAction, setActiveAction] = useState<'deposit' | 'bonus' | 'withdrawal' | 'remove' | null>(null);
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [totalEquity, setTotalEquity] = useState<number>(user.balance || 0);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const history = safeTransactions.filter(t => t.user_id === user.id);

  const ALLOWED_ROLES = ['admin', 'compliance', 'manager', 'retention'];
  const canViewStaff = ALLOWED_ROLES.includes(currentUserRole || '');

  // 1. FETCH TOTAL EQUITY
  useEffect(() => {
    const fetchEquity = async () => {
        const { data: accounts } = await supabase
            .from('trading_accounts')
            .select('balance')
            .eq('user_id', user.id);
        
        const tradingBalance = accounts?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;
        setTotalEquity((user.balance || 0) + tradingBalance);
    };
    fetchEquity();
  }, [user.id, user.balance, transactions]);

  const handleExecute = async () => {
      if (!actionAmount || !activeAction) return;
      
      // Require Method ONLY for Deposits
      const methodToUse = activeAction === 'deposit' ? selectedMethod : 'System Adjustment';
      if (activeAction === 'deposit' && !methodToUse) return;

      setLoading(true);
      try {
        await onManageFunds(user.id, parseFloat(actionAmount), activeAction, undefined, methodToUse || 'Manual');
        // Reset only on success (or let AdminPanel handle error)
        setActionAmount('');
        setActiveAction(null);
        setSelectedMethod(null);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
  };

  const handleCopy = (text: string, txId: number) => {
      navigator.clipboard.writeText(text);
      setCopiedId(txId); 
      setTimeout(() => setCopiedId(null), 2000); 
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] text-white animate-in slide-in-from-right-4 duration-300 font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-14 shrink-0 bg-[#151a21] border-b border-[#2a2e39] flex items-center gap-4 px-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-[#1e232d] text-gray-400 hover:text-white hover:bg-[#2a2e39] border border-[#2a2e39] transition-colors">
              <ArrowLeft size={16} />
          </button>
          <div>
              <h1 className="text-sm font-bold text-white">{user.email}</h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase">
                  <span>{user.id}</span> <span className="text-[#2a2e39]">|</span> <span className="text-[#F0B90B]">{user.tier || 'STANDARD'}</span>
              </div>
          </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 min-h-0">
          
          {/* ACTION ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* BALANCE CARD */}
              <div className="lg:col-span-7 bg-[#151a21] rounded-xl p-4 border border-[#2a2e39] flex justify-between items-center shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                          <CreditCard size={12}/> Total Equity
                      </div>
                      <div className="text-3xl font-mono font-bold text-white tracking-tight">
                          ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono mt-1">
                          Main: <span className="text-[#21ce99]">${(user.balance || 0).toLocaleString()}</span> • Trading: ${(totalEquity - (user.balance || 0)).toLocaleString()}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 relative z-10 w-fit">
                      <button 
                          onClick={() => { setActiveAction('deposit'); setSelectedMethod(null); }} 
                          className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${activeAction === 'deposit' ? 'bg-[#21ce99] text-[#0b0e11] border-[#21ce99]' : 'bg-[#1e232d] text-[#21ce99] border-[#21ce99]/20 hover:bg-[#21ce99]/10'}`}
                      >
                          <ArrowDownLeft size={12} /> Deposit
                      </button>

                      <button 
                          onClick={() => { setActiveAction('bonus'); setSelectedMethod(null); }} 
                          className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${activeAction === 'bonus' ? 'bg-[#F0B90B] text-[#0b0e11] border-[#F0B90B]' : 'bg-[#1e232d] text-[#F0B90B] border-[#F0B90B]/20 hover:bg-[#F0B90B]/10'}`}
                      >
                          <Gift size={12} /> Bonus
                      </button>

                      <button 
                          onClick={() => { setActiveAction('withdrawal'); setSelectedMethod(null); }} 
                          className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${activeAction === 'withdrawal' ? 'bg-[#f23645] text-white border-[#f23645]' : 'bg-[#1e232d] text-[#f23645] border-[#f23645]/20 hover:bg-[#f23645]/10'}`}
                      >
                          <ArrowUpRight size={12} /> Withdraw
                      </button>

                      {/* FORCE REMOVE BUTTON */}
                      <button 
                          onClick={() => { setActiveAction('remove'); setSelectedMethod(null); }} 
                          className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${activeAction === 'remove' ? 'bg-red-900 text-white border-red-500' : 'bg-[#1e232d] text-red-500 border-red-900/30 hover:bg-red-900/20'}`}
                          title="Force Remove (Allows Negative)"
                      >
                          <AlertOctagon size={12} /> Force Rem
                      </button>
                  </div>
              </div>

              {/* INPUT AREA (Dynamic) */}
              <div className="lg:col-span-5 bg-[#151a21] rounded-xl border border-[#2a2e39] flex flex-col justify-center min-h-[100px] relative overflow-hidden">
                  <AnimatePresence mode="wait">
                      
                      {/* STATE 1: DEPOSIT METHOD SELECTION */}
                      {activeAction === 'deposit' && !selectedMethod ? (
                          <motion.div 
                              key="methods"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-3"
                          >
                              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2 text-center">Select Deposit Method</div>
                              <div className="grid grid-cols-2 gap-2">
                                  {['Bank Card', 'Wire Transfer', 'Crypto', 'Other'].map(method => (
                                      <button 
                                          key={method}
                                          onClick={() => setSelectedMethod(method)}
                                          className="p-2 bg-[#0b0e11] border border-[#2a2e39] rounded hover:border-[#21ce99] hover:text-[#21ce99] text-gray-400 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                                      >
                                          {method === 'Bank Card' && <CardIcon size={10} />}
                                          {method === 'Wire Transfer' && <Landmark size={10} />}
                                          {method === 'Crypto' && <Bitcoin size={10} />}
                                          {method === 'Other' && <HelpCircle size={10} />}
                                          {method}
                                      </button>
                                  ))}
                              </div>
                          </motion.div>
                      ) : activeAction ? (
                          
                          /* STATE 2: AMOUNT INPUT */
                          <motion.div 
                              key="input" 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              exit={{ opacity: 0 }} 
                              className="px-4 py-3 flex flex-col gap-2"
                          >
                              {/* Headers for different actions */}
                              <div className="flex justify-between items-center">
                                  {activeAction === 'deposit' && (
                                      <div onClick={() => setSelectedMethod(null)} className="text-[9px] text-[#21ce99] font-bold uppercase tracking-widest cursor-pointer hover:underline flex items-center gap-1">
                                          <ArrowLeft size={8} /> Method: {selectedMethod}
                                      </div>
                                  )}
                                  {activeAction === 'remove' && (
                                      <div className="text-[9px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                          <AlertOctagon size={8} /> DANGER: FORCE REMOVAL
                                      </div>
                                  )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                  <div className="flex-1 relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">$</span>
                                      <input 
                                          type="number" 
                                          value={actionAmount} 
                                          onChange={(e) => setActionAmount(e.target.value)} 
                                          autoFocus 
                                          placeholder="0.00" 
                                          className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-lg py-2 pl-6 pr-2 text-white font-mono text-sm font-bold focus:border-[#21ce99] outline-none" 
                                      />
                                  </div>
                                  <button 
                                      onClick={handleExecute} 
                                      disabled={loading || !actionAmount} 
                                      className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:brightness-110 disabled:opacity-50 ${
                                          activeAction === 'withdrawal' ? 'bg-[#f23645] text-white' : 
                                          activeAction === 'remove' ? 'bg-red-600 text-white' :
                                          'bg-[#21ce99] text-[#0b0e11]'
                                      }`}
                                  >
                                      {loading ? <Loader2 className="animate-spin" size={14} /> : 'CONFIRM'}
                                  </button>
                                  <button onClick={() => { setActiveAction(null); setSelectedMethod(null); }} className="p-2 text-gray-500 hover:text-white"><XCircle size={16}/></button>
                              </div>
                          </motion.div>
                      ) : (
                          
                          /* STATE 0: IDLE */
                          <div className="flex items-center justify-center gap-2 text-gray-600 text-[10px] font-bold uppercase tracking-widest h-full">
                              <Wallet size={16} /> Select Action
                          </div>
                      )}
                  </AnimatePresence>
              </div>
          </div>

          {/* LEDGER */}
          <div className="bg-[#151a21] rounded-xl border border-[#2a2e39] overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-[#2a2e39] bg-[#191f2e]/50 flex items-center gap-2"><History size={14} className="text-[#21ce99]"/><h3 className="text-[10px] font-black text-white uppercase tracking-widest">Transaction History</h3></div>
              <div className="overflow-auto custom-scrollbar flex-1">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b0e11] text-gray-500 uppercase font-bold text-[9px] tracking-widest sticky top-0 z-10">
                          <tr>
                              <th className="p-3 pl-4">TX ID</th>
                              <th className="p-3">Time</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Method</th> 
                              {canViewStaff && <th className="p-3">Staff / Performer</th>} 
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2e39]">
                          {history.map(tx => (
                              <tr key={tx.id} className="hover:bg-[#2a2e39]/30 transition-colors">
                                  {/* TX ID */}
                                  <td className="p-3 pl-4 text-gray-500 font-mono text-[10px]"><div className="flex items-center gap-1"><Hash size={10} />{tx.id}</div></td>
                                  
                                  {/* TIME */}
                                  <td className="p-3 text-gray-400 font-mono text-[10px]">{new Date(tx.created_at).toLocaleString()}</td>
                                  
                                  {/* TYPE */}
                                  <td className="p-3">
                                      <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded border ${
                                          tx.type === 'bonus' ? 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20' : 
                                          ['withdraw', 'withdrawal', 'remove'].includes(tx.type) ? 'bg-[#f23645]/10 text-[#f23645] border-[#f23645]/20' : 
                                          'bg-[#21ce99]/10 text-[#21ce99] border-[#21ce99]/20'
                                      }`}>
                                          {tx.type.replace('external_', '')}
                                      </span>
                                  </td>
                                  
                                  {/* METHOD */}
                                  <td className="p-3">
                                      <div className="flex items-center gap-1.5 text-[10px]">
                                          <Globe size={12} className="text-blue-400" />
                                          <span className="text-gray-300 font-bold uppercase">{tx.method || 'System / Wire'}</span>
                                      </div>
                                  </td>

                                  {/* STAFF (Restricted) */}
                                  {canViewStaff && (
                                      <td className="p-3">
                                          <div className="flex items-center gap-1.5 text-[10px]">
                                              {tx.performed_by ? (
                                                  <div className="flex items-center gap-2 group cursor-pointer relative" onClick={() => handleCopy(tx.performed_by, tx.id)}>
                                                      <UserCog size={12} className="text-[#F0B90B]" />
                                                      <div className="flex flex-col">
                                                          <span className="text-white font-bold hover:text-[#21ce99] transition-colors">
                                                              {tx.performed_by_email || `ID: ${tx.performed_by.slice(0,8)}...`}
                                                          </span>
                                                      </div>
                                                      <Copy size={10} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                      <AnimatePresence>
                                                          {copiedId === tx.id && (
                                                              <motion.span 
                                                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                                  className="absolute left-full ml-2 bg-[#21ce99] text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 whitespace-nowrap z-50"
                                                              >
                                                                  <Check size={8} /> COPIED ID
                                                              </motion.span>
                                                          )}
                                                      </AnimatePresence>
                                                  </div>
                                              ) : (
                                                  <>
                                                      <Shield size={12} className="text-gray-600" />
                                                      <span className="text-gray-600 font-bold uppercase">System Auto</span>
                                                  </>
                                              )}
                                          </div>
                                      </td>
                                  )}

                                  {/* AMOUNT */}
                                  <td className={`p-3 text-right font-mono font-bold ${['deposit', 'bonus', 'external_deposit'].includes(tx.type) ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>{['deposit', 'bonus', 'external_deposit'].includes(tx.type) ? '+' : '-'}${tx.amount.toLocaleString()}</td>
                                  
                                  {/* STATUS */}
                                  <td className="p-3 text-center">{tx.status === 'approved' ? <CheckCircle size={14} className="text-[#21ce99] mx-auto" /> : tx.status === 'pending' ? <Loader2 size={14} className="text-[#F0B90B] animate-spin mx-auto" /> : <XCircle size={14} className="text-[#f23645] mx-auto" />}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {history.length === 0 && <div className="p-8 text-center text-gray-600 font-mono text-[10px] uppercase tracking-widest">No records found</div>}
              </div>
          </div>
      </div>
    </div>
  );
}