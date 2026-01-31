import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Server, Trash2, ArrowRightLeft, Loader2, 
  TrendingUp, AlertTriangle, X, CheckCircle, Wallet, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  userId: string;
  onUpdate: () => void;
}

export default function ClientTradingAccounts({ userId, onUpdate }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; account: any | null }>({ isOpen: false, account: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; account: any | null }>({ isOpen: false, account: null });
  
  // 👇 NEW: Create Modal State
  const [createModal, setCreateModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'in' | 'out'>('in');

  useEffect(() => {
    fetchAccounts();
  }, [userId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const activeAccounts = data.filter(acc => !acc.name?.includes('DELETED_'));
      setAccounts(activeAccounts);
    }
    setLoading(false);
  };

  // 👇 NEW: Handle Account Creation
  const handleCreate = async () => {
    if (!newAccountName.trim()) return;
    setActionLoading(true);

    try {
      const { error } = await supabase.from('trading_accounts').insert({
        user_id: userId,
        name: newAccountName,
        balance: 0
      });

      if (error) throw error;

      setNotification({ type: 'success', message: 'Trading Unit Created' });
      setCreateModal(false);
      setNewAccountName('');
      await fetchAccounts();
      onUpdate();

    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || "Creation Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || !transferModal.account) return;
    const val = parseFloat(amount);
    if (val <= 0) return;

    setActionLoading(true);
    try {
      const accountId = transferModal.account.id;
      const accountName = transferModal.account.name;

      const { data: currentAccount } = await supabase
        .from('trading_accounts')
        .select('balance')
        .eq('id', accountId)
        .single();
        
      if (!currentAccount) throw new Error("Account not found");

      if (direction === 'in') {
        const methodMsg = `MAIN -> ${accountName}`;

        const { error: rpcError } = await supabase.rpc('admin_adjust_balance', {
          p_user_id: userId,
          p_amount: val,
          p_type: 'withdrawal', 
          p_method: methodMsg
        });
        if (rpcError) throw rpcError;

        const { error: updateError } = await supabase
          .from('trading_accounts')
          .update({ balance: (currentAccount.balance || 0) + val })
          .eq('id', accountId);
          
        if (updateError) throw updateError;

      } else {
        const methodMsg = `${accountName} -> MAIN`;
        
        if ((currentAccount.balance || 0) < val) throw new Error("Insufficient funds in Trading Unit");

        const { error: rpcError } = await supabase.rpc('admin_adjust_balance', {
          p_user_id: userId,
          p_amount: val,
          p_type: 'deposit',
          p_method: methodMsg
        });
        if (rpcError) throw rpcError;

        const { error: updateError } = await supabase
          .from('trading_accounts')
          .update({ balance: (currentAccount.balance || 0) - val })
          .eq('id', accountId);

        if (updateError) throw updateError;
      }

      setTransferModal({ isOpen: false, account: null });
      setAmount('');
      setNotification({ type: 'success', message: 'Transfer Successful' });
      await fetchAccounts();
      onUpdate();

    } catch (err: any) {
      console.error("Transfer error:", err);
      setNotification({ type: 'error', message: err.message || "Transfer Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteModal.account) return;
    setActionLoading(true);

    try {
      const { error } = await supabase.rpc('admin_delete_account', { 
        p_account_id: deleteModal.account.id 
      });

      if (error) throw error;

      setDeleteModal({ isOpen: false, account: null });
      setNotification({ type: 'success', message: 'Unit deleted & funds returned' });
      await fetchAccounts();
      onUpdate();

    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || "Delete failed" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-[#21ce99]" /></div>;

  return (
    <div className="bg-[#151a21] rounded-xl border border-[#2a2e39] overflow-hidden shadow-lg mt-4 relative">
      
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-0 left-0 right-0 z-50 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest ${notification.type === 'success' ? 'bg-[#21ce99] text-black' : 'bg-[#f23645] text-white'}`}
          >
            {notification.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER with CREATE BUTTON */}
      <div className="p-4 border-b border-[#2a2e39] bg-[#191f2e]/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Server size={16} className="text-[#F0B90B]" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Active Trading Units</h3>
            <span className="bg-[#2a2e39] text-[#8b9bb4] px-2 py-0.5 rounded text-[9px] font-bold">{accounts.length}</span>
        </div>
        
        {/* 👇 NEW BUTTON */}
        <button 
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1 bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
        >
            <Plus size={12} /> New Unit
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 font-mono text-xs">NO TRADING UNITS DEPLOYED</div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="bg-[#0b0e11] border border-[#2a2e39] rounded-xl p-4 relative group hover:border-[#21ce99]/30 transition-all">
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1e232d] rounded-lg text-white">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs uppercase">{acc.name}</div>
                    <div className="text-[9px] text-gray-500 font-mono">ID: {acc.id}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setDeleteModal({ isOpen: true, account: acc })}
                  className="text-[#2a2e39] hover:text-[#f23645] transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Equity</div>
                <div className="text-xl font-mono font-bold text-[#21ce99]">${acc.balance?.toLocaleString()}</div>
              </div>

              <button 
                onClick={() => setTransferModal({ isOpen: true, account: acc })}
                className="w-full py-2 bg-[#1e232d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <ArrowRightLeft size={12} /> Manage Funds
              </button>
            </div>
          ))
        )}
      </div>

      {/* 👇 CREATE MODAL */}
      <AnimatePresence>
        {createModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#151a21] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center bg-[#191f2e]">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Server size={14} className="text-[#21ce99]" /> 
                  Deploy New Unit
                </h3>
                <button onClick={() => setCreateModal(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Unit Name</label>
                    <input 
                        type="text" 
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="e.g. High Risk Strategy"
                        autoFocus
                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 px-4 text-white font-bold text-sm focus:border-[#21ce99] outline-none placeholder:text-gray-600"
                    />
                </div>

                <button 
                  onClick={handleCreate}
                  disabled={actionLoading || !newAccountName.trim()}
                  className="w-full py-3 bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Create Unit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transferModal.isOpen && transferModal.account && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#151a21] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center bg-[#191f2e]">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ArrowRightLeft size={14} className="text-[#F0B90B]" /> 
                  Transfer Funds
                </h3>
                <button onClick={() => setTransferModal({ isOpen: false, account: null })} className="text-gray-500 hover:text-white"><X size={16}/></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-[#0b0e11] rounded-xl border border-[#2a2e39] text-center">
                  <div className="text-[9px] text-gray-500 uppercase font-bold">Target Unit</div>
                  <div className="text-white font-bold text-sm">{transferModal.account.name}</div>
                  <div className="text-[#21ce99] font-mono text-xs">${transferModal.account.balance?.toLocaleString()}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#0b0e11] p-1 rounded-xl border border-[#2a2e39]">
                  <button 
                    onClick={() => setDirection('in')}
                    className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${direction === 'in' ? 'bg-[#21ce99] text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    Main ➔ Unit
                  </button>
                  <button 
                    onClick={() => setDirection('out')}
                    className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${direction === 'out' ? 'bg-[#F0B90B] text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    Unit ➔ Main
                  </button>
                </div>

                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-8 text-white font-mono font-bold focus:border-[#21ce99] outline-none"
                  />
                </div>

                <button 
                  onClick={handleTransfer}
                  disabled={actionLoading || !amount}
                  className="w-full py-3 bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Confirm Transfer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.isOpen && deleteModal.account && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#151a21] border border-[#f23645]/30 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[#f23645]/20 flex justify-between items-center bg-[#191f2e]">
                <h3 className="font-bold text-[#f23645] text-xs uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={14} /> 
                  Confirm Deletion
                </h3>
                <button onClick={() => setDeleteModal({ isOpen: false, account: null })} className="text-gray-500 hover:text-white"><X size={16}/></button>
              </div>

              <div className="p-6 text-center space-y-4">
                <p className="text-sm text-gray-300">
                  Are you sure you want to delete <span className="font-bold text-white">{deleteModal.account.name}</span>?
                </p>
                
                {deleteModal.account.balance > 0 && (
                  <div className="bg-[#21ce99]/10 border border-[#21ce99]/30 p-3 rounded-xl flex items-center gap-3 text-left">
                    <div className="p-2 bg-[#21ce99]/20 rounded-full text-[#21ce99]"><Wallet size={16} /></div>
                    <div>
                      <div className="text-[10px] text-[#21ce99] font-bold uppercase tracking-widest">Refund Detected</div>
                      <div className="text-xs text-gray-300">
                        <span className="text-white font-mono font-bold">${deleteModal.account.balance.toLocaleString()}</span> will be returned to Main Wallet.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setDeleteModal({ isOpen: false, account: null })}
                    className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-[#2a2e39] text-gray-400 hover:text-white hover:bg-[#363c4a]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeDelete}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-[#f23645] text-white hover:bg-[#d12c39] flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Delete Unit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}