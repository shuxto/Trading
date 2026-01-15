import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Play, Briefcase, Trash2, Wallet, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradingAccount } from '../../types';

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mainBalance, setMainBalance] = useState(0);

  // GLASS POPUP STATE
  const [showAgentPopup, setShowAgentPopup] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchMainBalance();
  }, []);

  const fetchMainBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        if (data) setMainBalance(data.balance);
    }
  };

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (data) setAccounts(data);
  };

  const createAccount = async () => {
    if (!newAccountName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('trading_accounts').insert({
      user_id: user.id,
      name: newAccountName,
      balance: 0 
    });

    if (!error) {
      setNewAccountName('');
      setIsCreating(false);
      fetchAccounts();
    }
  };

  const deleteAccount = async (id: number) => {
    // ✅ REMOVED the "confirm()" alert here. 
    // It will now try to delete immediately.
    
    const { error } = await supabase.from('trading_accounts').delete().eq('id', id);
    
    if (error) {
        // IF it fails because of trades -> SHOW GLASS POPUP
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
            setShowAgentPopup(true); 
        } else {
            alert("Error: " + error.message);
        }
    } else {
        // IF success -> REFRESH LIST
        fetchAccounts();
    }
  };

  const handleOpenInNewTab = (accountId: number) => {
      const url = `${window.location.origin}?mode=trading&account_id=${accountId}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in relative">
      
      {/* --- GLASSMORPHIC POPUP (Only shows on Error) --- */}
      <AnimatePresence>
        {showAgentPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                style={{
                    background: 'rgba(25, 31, 46, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}
            >
                {/* Close Button */}
                <button 
                   onClick={() => setShowAgentPopup(false)}
                   className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#f23645] to-[#ff6b6b] flex items-center justify-center shadow-lg shadow-red-500/20">
                        <AlertTriangle size={32} className="text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white">Action Required</h3>
                    
                    <p className="text-[#8b9bb4] text-sm leading-relaxed">
                        This trading room cannot be deleted because it contains active trades or historical data.
                    </p>

                    <div className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-[#21ce99] font-mono font-bold">
                        Please contact your agent to archive or delete this room safely.
                    </div>

                    <button 
                        onClick={() => setShowAgentPopup(false)}
                        className="mt-4 px-8 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors w-full"
                    >
                        Understood
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#21ce99]/20 rounded-full blur-[50px] pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#f23645]/20 rounded-full blur-[50px] pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#1e232d] to-[#151a21] p-6 rounded-2xl border border-[#2a2e39] flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">Trading Rooms</h2>
           <p className="text-[#8b9bb4] text-sm">Manage your strategies.</p>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
                <div className="text-[10px] text-[#8b9bb4] uppercase font-bold">Main Wallet</div>
                <div className="text-xl font-mono font-bold text-white flex items-center justify-end gap-2">
                    <Wallet size={16} className="text-[#21ce99]" />
                    ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>

            <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#21ce99] hover:bg-[#1db586] text-[#0b0e11] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(33,206,153,0.2)]"
            >
            <Plus size={18} /> New Room
            </button>
        </div>
      </div>

      {/* CREATE FORM */}
      {isCreating && (
        <div className="bg-[#1e232d] p-4 rounded-xl border border-[#2a2e39] flex gap-2 animate-in slide-in-from-top-2">
          <input 
            type="text" 
            placeholder="Room Name (e.g. Scalping Strategy)"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            className="flex-1 bg-[#0b0e11] border border-[#2a2e39] rounded-lg px-4 text-white focus:border-[#21ce99] outline-none"
          />
          <button onClick={createAccount} className="text-[#21ce99] font-bold hover:underline px-4">Create</button>
          <button onClick={() => setIsCreating(false)} className="text-[#8b9bb4] hover:text-white px-4">Cancel</button>
        </div>
      )}

      {/* ROOMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-[#1e232d] border border-[#2a2e39] rounded-xl p-6 hover:border-[#21ce99] transition-all group relative flex flex-col h-48">
            
            <button 
                onClick={() => deleteAccount(acc.id)}
                className="absolute top-4 right-4 text-[#2a303c] group-hover:text-[#f23645] transition-colors p-1 hover:bg-[#f23645]/10 rounded"
                title="Delete Room"
            >
                <Trash2 size={16} />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-[#2a303c] rounded-xl text-white group-hover:text-[#21ce99] transition-colors shadow-inner">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{acc.name}</h3>
                <p className="text-[10px] text-[#5e6673] font-mono mt-1">ID: {acc.id}</p>
              </div>
            </div>

            <div className="mt-auto">
                <div className="text-[10px] text-[#8b9bb4] uppercase font-bold tracking-wider mb-1">Room Balance</div>
                <div className="text-2xl font-mono font-bold text-[#21ce99]">
                    ${(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>

            <button 
              onClick={() => handleOpenInNewTab(acc.id)} 
              className="w-full bg-[#2a2e39] group-hover:bg-[#21ce99] text-white group-hover:text-[#0b0e11] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all mt-4 shadow-lg"
            >
              <Play size={16} /> LAUNCH TERMINAL
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}