import { useState } from 'react';
import { 
    ArrowLeft, 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Gift, 
    History, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    EyeOff, 
    UserCog, 
    Calendar, 
    Shield // <--- This must be here!
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientDetailProps {
  user: any;
  transactions: any[];
  onBack: () => void;
  onManageFunds: (userId: string, amount: number, type: 'deposit' | 'withdrawal' | 'bonus', transactionId?: number) => Promise<void>;
  onIgnoreRequest: (transactionId: number) => Promise<void>;
}

export default function ClientDetail({ user, transactions, onBack, onManageFunds, onIgnoreRequest }: ClientDetailProps) {
  const [actionAmount, setActionAmount] = useState('');
  const [activeAction, setActiveAction] = useState<'deposit' | 'bonus' | 'withdrawal' | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter & Sort
  const history = transactions.filter(t => t.user_id === user.id);
  const pending = history.filter(t => t.status === 'pending');

  // Handle Manual Actions
  const handleExecute = async () => {
      if (!actionAmount || !activeAction) return;
      setLoading(true);
      await onManageFunds(user.id, parseFloat(actionAmount), activeAction);
      setLoading(false);
      setActionAmount('');
      setActiveAction(null);
  };

  // Handle Pending Approvals
  const handleApproveRequest = async (tx: any) => {
      setLoading(true);
      await onManageFunds(user.id, tx.amount, 'withdrawal', tx.id);
      setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] text-white animate-in slide-in-from-right-4 duration-300 overflow-y-auto custom-scrollbar rounded-2xl border border-[#2a2e39]">
      
      {/* --- 1. NAVBAR --- */}
      <div className="sticky top-0 z-20 bg-[#151a21]/95 backdrop-blur-md border-b border-[#2a2e39] p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <button 
                  onClick={onBack}
                  className="p-2 rounded-xl bg-[#1e232d] text-gray-400 hover:text-white hover:bg-[#2a2e39] transition-all border border-[#2a2e39]"
              >
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
                      {user.email}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          user.kyc_status === 'verified' ? 'bg-[#21ce99]/10 text-[#21ce99] border-[#21ce99]/20' : 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20'
                      }`}>
                          {user.kyc_status || 'Pending'}
                      </span>
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                      <span>ID: {user.id.slice(0,8)}</span>
                      <span className="text-gray-600">|</span>
                      <span>Tier: {user.tier || 'Standard'}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* --- 2. HERO STATS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Balance Card */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#1e232d] to-[#151a21] rounded-3xl p-8 border border-[#2a2e39] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Wallet size={180} />
                  </div>
                  <div className="relative z-10">
                      <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Total Equity</div>
                      <div className="text-6xl font-mono font-bold text-white tracking-tighter">
                          ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="mt-6 flex gap-3">
                          <button 
                              onClick={() => setActiveAction('deposit')}
                              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
                                  activeAction === 'deposit' ? 'bg-[#21ce99] text-black shadow-lg shadow-[#21ce99]/20' : 'bg-[#21ce99]/10 text-[#21ce99] hover:bg-[#21ce99] hover:text-black'
                              }`}
                          >
                              <ArrowDownLeft size={16} /> Credit Deposit
                          </button>
                          <button 
                              onClick={() => setActiveAction('bonus')}
                              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
                                  activeAction === 'bonus' ? 'bg-[#F0B90B] text-black shadow-lg shadow-[#F0B90B]/20' : 'bg-[#F0B90B]/10 text-[#F0B90B] hover:bg-[#F0B90B] hover:text-black'
                              }`}
                          >
                              <Gift size={16} /> Add Bonus
                          </button>
                      </div>
                  </div>
              </div>

              {/* Quick Action Input (Dynamic) */}
              <div className="bg-[#1e232d] rounded-3xl p-6 border border-[#2a2e39] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                      {activeAction ? (
                          <motion.div 
                              key="input"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                          >
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                                  {activeAction} Amount
                              </div>
                              <div className="relative mb-4">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xl">$</span>
                                  <input 
                                      type="number" 
                                      value={actionAmount}
                                      onChange={(e) => setActionAmount(e.target.value)}
                                      autoFocus
                                      placeholder="0.00"
                                      className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-4 pl-10 pr-4 text-white font-mono text-2xl font-bold focus:border-[#21ce99] outline-none"
                                  />
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={handleExecute}
                                      disabled={loading || !actionAmount}
                                      className="flex-1 bg-[#21ce99] text-black font-bold py-3 rounded-xl uppercase tracking-widest text-xs hover:brightness-110 disabled:opacity-50"
                                  >
                                      {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm'}
                                  </button>
                                  <button 
                                      onClick={() => setActiveAction(null)}
                                      className="px-4 bg-[#2a2e39] text-white rounded-xl hover:bg-[#363c4a]"
                                  >
                                      <XCircle size={20} />
                                  </button>
                              </div>
                          </motion.div>
                      ) : (
                          <motion.div 
                              key="placeholder"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center text-gray-600"
                          >
                              <Wallet size={48} className="mx-auto mb-3 opacity-20" />
                              <div className="text-xs uppercase tracking-widest">Select an action</div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>

          {/* --- 3. PENDING REQUESTS (The "Inbox") --- */}
          {pending.length > 0 && (
              <div className="bg-[#f23645]/5 border border-[#f23645]/20 rounded-3xl p-6">
                  <div className="flex items-center gap-2 text-[#f23645] font-black text-sm uppercase tracking-widest mb-4">
                      <AlertTriangle size={16} /> Pending Withdrawals ({pending.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pending.map((tx: any) => (
                          <div key={tx.id} className="bg-[#0b0e11] border border-[#f23645]/30 rounded-2xl p-5 flex flex-col justify-between group hover:border-[#f23645] transition-colors">
                              <div>
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-bold text-gray-400 uppercase">Request #{tx.id}</span>
                                      <span className="text-xs font-mono text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-2xl font-mono font-bold text-white mb-1">
                                      ${tx.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-[#f23645] font-bold uppercase">{tx.method || 'Wire Transfer'}</div>
                              </div>
                              
                              <div className="flex gap-2 mt-6">
                                  <button 
                                      onClick={() => handleApproveRequest(tx)}
                                      className="flex-1 bg-[#21ce99] text-black py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide hover:brightness-110 flex items-center justify-center gap-2"
                                  >
                                      <CheckCircle size={14} /> Accept
                                  </button>
                                  
                                  {/* THE IGNORE BUTTON */}
                                  <button 
                                      onClick={() => onIgnoreRequest(tx.id)}
                                      className="px-3 bg-[#1e232d] text-gray-400 border border-[#2a2e39] rounded-lg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
                                      title="Ignore (Vanish from Client)"
                                  >
                                      <EyeOff size={16} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- 4. TRANSACTION LEDGER --- */}
          <div className="bg-[#1e232d] rounded-3xl border border-[#2a2e39] overflow-hidden">
              <div className="p-6 border-b border-[#2a2e39] flex justify-between items-center bg-[#151a21]">
                  <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                      <History size={16} className="text-[#21ce99]" /> Official Ledger
                  </h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-[#0b0e11] text-gray-500 uppercase font-bold text-[10px] tracking-widest">
                          <tr>
                              <th className="p-4 pl-6">Date</th>
                              <th className="p-4">Transaction Type</th>
                              <th className="p-4">Authorized By</th>
                              <th className="p-4 text-right">Amount</th>
                              <th className="p-4 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2e39]">
                          {history.map(tx => (
                              <tr key={tx.id} className="hover:bg-[#2a2e39]/30 transition-colors">
                                  <td className="p-4 pl-6 text-gray-400 font-mono">
                                      <div className="flex items-center gap-2">
                                          <Calendar size={12} />
                                          {new Date(tx.created_at).toLocaleDateString()}
                                          <span className="opacity-50 text-[10px]">{new Date(tx.created_at).toLocaleTimeString()}</span>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <span className={`font-bold uppercase text-xs px-2 py-1 rounded ${
                                          tx.type === 'bonus' ? 'bg-[#F0B90B]/10 text-[#F0B90B]' : 'text-white'
                                      }`}>
                                          {tx.type.replace('external_', '')}
                                      </span>
                                  </td>
                                  
                                  {/* NEW AUDIT COLUMN */}
                                  <td className="p-4">
                                      <div className="flex items-center gap-2 text-xs text-gray-400">
                                          {tx.performed_by ? (
                                              <>
                                                  <UserCog size={14} className="text-[#21ce99]" />
                                                  <span className="text-white">{tx.performed_by_email || 'Staff'}</span>
                                              </>
                                          ) : (
                                              <>
                                                  <Shield size={14} className="text-gray-600" />
                                                  <span className="text-gray-600">System</span>
                                              </>
                                          )}
                                      </div>
                                  </td>

                                  <td className={`p-4 text-right font-mono font-bold ${
                                      ['deposit', 'bonus', 'external_deposit'].includes(tx.type) ? 'text-[#21ce99]' : 'text-[#f23645]'
                                  }`}>
                                      {['deposit', 'bonus', 'external_deposit'].includes(tx.type) ? '+' : '-'}${tx.amount.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                          tx.status === 'approved' ? 'bg-[#21ce99]/10 text-[#21ce99]' : 
                                          tx.status === 'pending' ? 'bg-[#F0B90B]/10 text-[#F0B90B]' : 'bg-[#f23645]/10 text-[#f23645]'
                                      }`}>
                                          {tx.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  );
}