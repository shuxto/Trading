import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// Removed Trash2, AlertTriangle, Zap from imports
import { Plus, Play, Briefcase, Wallet, X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradingAccount } from '../../types';

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mainBalance, setMainBalance] = useState(0);

  // Removed showAgentPopup state

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

  // Removed deleteAccount function

  const handleOpenInNewTab = (accountId: number) => {
      const url = `${window.location.origin}?mode=trading&account_id=${accountId}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in relative min-h-[500px]">
      
      {/* Removed AnimatePresence (Error Popup) */}

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

     {/* --- CREATE MODAL (UPGRADED UI) --- */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Dark Overlay Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsCreating(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* The Command Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#151a21] border border-white/10 rounded-[30px] p-8 overflow-hidden shadow-[0_0_100px_rgba(33,206,153,0.1)]"
            >
                {/* Background Glow Effect */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#21ce99]/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-[#21ce99] rounded-full animate-pulse" />
                                <span className="text-[10px] font-mono text-[#21ce99] uppercase tracking-widest">System Override</span>
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Deploy Unit</h2>
                            <p className="text-[#8b9bb4] text-sm mt-1">Initialize a new isolated trading environment.</p>
                        </div>
                        <button 
                            onClick={() => setIsCreating(false)} 
                            className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-[#5e6673] tracking-widest ml-1">Strategy Identifier</label>
                            <div className="group bg-[#0b0e11] border border-white/10 rounded-2xl flex items-center p-5 gap-4 focus-within:border-[#21ce99] focus-within:shadow-[0_0_30px_rgba(33,206,153,0.15)] transition-all duration-300">
                                <div className="p-2 bg-[#21ce99]/10 rounded-lg text-[#21ce99] group-focus-within:scale-110 transition-transform">
                                    <Terminal size={24} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="ENTER UNIT NAME..."
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    className="bg-transparent border-none text-white font-bold text-xl placeholder-gray-700 w-full focus:ring-0 uppercase tracking-wide"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && createAccount()}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setIsCreating(false)} 
                                className="py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-[#8b9bb4] hover:bg-white/5 hover:text-white transition-colors"
                            >
                                Abort
                            </button>
                            <button 
                                onClick={createAccount} 
                                disabled={!newAccountName.trim()}
                                className="bg-[#21ce99] hover:bg-[#1db586] disabled:opacity-50 disabled:cursor-not-allowed text-[#0b0e11] py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(33,206,153,0.2)] hover:shadow-[0_0_30px_rgba(33,206,153,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Initialize System
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* --- GAMIFIED CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* EXISTING ACCOUNTS */}
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

        {/* 🆕 NEW: THE "ADD UNIT" CARD (Ghost Card) */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setIsCreating(true)}
            className="group relative bg-[#151a21]/50 rounded-3xl p-1 cursor-pointer hover:bg-[#151a21] transition-all duration-300 min-h-[280px]"
        >
            <div className="relative h-full rounded-[20px] border-2 border-dashed border-white/10 group-hover:border-[#21ce99]/50 flex flex-col items-center justify-center gap-4 transition-all bg-[#191f2e]/30 group-hover:bg-[#191f2e]">
                
                <div className="h-16 w-16 rounded-full bg-white/5 group-hover:bg-[#21ce99]/20 flex items-center justify-center transition-all group-hover:scale-110 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(33,206,153,0.3)]">
                    <Plus size={32} className="text-gray-500 group-hover:text-[#21ce99] transition-colors" />
                </div>
                
                <div className="text-center">
                    <h3 className="text-gray-500 font-bold group-hover:text-white transition-colors uppercase tracking-widest text-xs">Deploy Unit</h3>
                    <p className="text-[10px] text-gray-600 group-hover:text-[#21ce99]/70 mt-1 transition-colors">Create new trading room</p>
                </div>

            </div>
        </motion.div>

      </div>
    </div>
  );
}