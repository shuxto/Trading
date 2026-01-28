import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Play, Briefcase, Trash2, Wallet, X, AlertTriangle, Zap, Terminal } from 'lucide-react';
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
    const { error } = await supabase.from('trading_accounts').delete().eq('id', id);
    
    if (error) {
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
            setShowAgentPopup(true); 
        } else {
            alert("Error: " + error.message);
        }
    } else {
        fetchAccounts();
    }
  };

  const handleOpenInNewTab = (accountId: number) => {
      const url = `${window.location.origin}?mode=trading&account_id=${accountId}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in relative min-h-[500px]">
      
      {/* --- GLASSMORPHIC ERROR POPUP --- */}
      <AnimatePresence>
        {showAgentPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="relative w-full max-w-md p-1 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20"
            >
                <div className="bg-[#151a21] p-8 rounded-[22px] border border-white/10 relative overflow-hidden">
                    {/* Close Button */}
                    <button onClick={() => setShowAgentPopup(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X size={20} /></button>

                    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#f23645] to-[#ff6b6b] flex items-center justify-center shadow-[0_0_30px_rgba(242,54,69,0.4)]">
                            <AlertTriangle size={36} className="text-white fill-white/20" />
                        </div>
                        
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Access Denied</h3>
                        
                        <p className="text-[#8b9bb4] text-sm leading-relaxed max-w-[280px]">
                            This room contains active data history. Security protocols prevent deletion.
                        </p>

                        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-[#21ce99] font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                            <Zap size={14} /> Contact Support Agent
                        </div>

                        <button onClick={() => setShowAgentPopup(false)} className="mt-2 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors w-full uppercase tracking-wider text-sm">
                            Acknowledge
                        </button>
                    </div>
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- HUD HEADER --- */}
      <div className="relative p-8 rounded-3xl overflow-hidden border border-white/10 group">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#21ce99]/10 to-[#1e232d] opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#21ce99]/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 bg-[#21ce99] rounded-full animate-pulse" />
                   <span className="text-xs font-mono text-[#21ce99] uppercase tracking-widest">Command Center</span>
               </div>
               <h2 className="text-4xl font-black text-white tracking-tight">Trading Rooms</h2>
               <p className="text-[#8b9bb4] text-sm mt-2 max-w-md">Launch active terminals or deploy new strategies from your fleet.</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                    <div className="text-right">
                        <div className="text-[9px] text-[#8b9bb4] uppercase font-bold tracking-wider">Main Vault</div>
                        <div className="text-xl font-mono font-bold text-white tracking-tight">
                            ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-[#21ce99] rounded-xl flex items-center justify-center text-[#0b0e11] shadow-[0_0_15px_rgba(33,206,153,0.4)]">
                        <Wallet size={20} />
                    </div>
                </div>

                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 text-xs font-bold text-[#21ce99] hover:text-white transition-colors uppercase tracking-widest"
                >
                    <Plus size={14} /> Deploy New Unit
                </button>
            </div>
        </div>
      </div>

      {/* --- CREATE ROW --- */}
      <AnimatePresence>
        {isCreating && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="bg-[#1e232d]/50 border border-[#21ce99]/30 p-2 rounded-2xl flex items-center gap-2">
                    <div className="h-10 w-10 bg-[#21ce99]/10 rounded-xl flex items-center justify-center text-[#21ce99]">
                        <Terminal size={20} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="ENTER STRATEGY NAME..."
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        className="flex-1 bg-transparent border-none text-white font-bold placeholder-gray-600 focus:ring-0 uppercase tracking-wide"
                        autoFocus
                    />
                    <button onClick={createAccount} className="bg-[#21ce99] text-[#0b0e11] px-6 py-2 rounded-xl font-bold text-xs uppercase hover:brightness-110 transition-all">
                        Initialize
                    </button>
                    <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- GAMIFIED CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc, index) => (
          <motion.div 
            key={acc.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-[#151a21] rounded-3xl p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            {/* Hover Glow Border */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#21ce99] to-[#21ce99]/0 rounded-3xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 pointer-events-none" />

            <div className="relative h-full bg-[#191f2e] rounded-[20px] p-6 flex flex-col overflow-hidden border border-white/5 group-hover:border-[#21ce99]/30 transition-colors">
                
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {/* Top Row */}
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2a303c] to-[#151a21] border border-white/10 flex items-center justify-center text-white group-hover:text-[#21ce99] group-hover:border-[#21ce99]/50 transition-all shadow-inner">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-none group-hover:text-[#21ce99] transition-colors">{acc.name}</h3>
                            <span className="text-[10px] text-[#5e6673] font-mono mt-1 block">ID: {String(acc.id).padStart(4, '0')}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => deleteAccount(acc.id)}
                        className="text-[#2a303c] hover:text-[#f23645] transition-colors p-2 hover:bg-[#f23645]/10 rounded-lg"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                {/* Balance Area */}
                <div className="relative z-10 mt-auto mb-6">
                    <div className="flex items-baseline gap-1 text-[10px] text-[#8b9bb4] uppercase font-bold tracking-wider mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#21ce99] animate-pulse" />
                        Available Equity
                    </div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                        ${(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => handleOpenInNewTab(acc.id)} 
                  className="relative z-10 w-full group/btn bg-[#21ce99] hover:bg-[#1db586] text-[#0b0e11] font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(33,206,153,0.2)] hover:shadow-[0_0_30px_rgba(33,206,153,0.4)]"
                >
                  <Play size={16} className="fill-current" />
                  Launch Terminal
                </button>

            </div>
          </motion.div>
        ))}

        {/* --- EMPTY STATE CARD --- */}
        {accounts.length === 0 && (
            <div className="border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 opacity-50 hover:opacity-100 hover:border-[#21ce99]/30 transition-all cursor-pointer min-h-[300px]" onClick={() => setIsCreating(true)}>
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Plus size={32} className="text-[#21ce99]" />
                </div>
                <div>
                    <h3 className="text-white font-bold">No Active Units</h3>
                    <p className="text-sm text-gray-500">Deploy your first trading room to begin.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}