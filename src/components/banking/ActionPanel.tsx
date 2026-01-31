import { useState } from 'react';
import { ArrowRightLeft, ArrowDownLeft, ArrowUpRight, ChevronDown, Briefcase, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  activeSection: 'transfer' | 'deposit' | 'withdrawal';
  setActiveSection: (val: 'transfer' | 'deposit' | 'withdrawal') => void;
  amount: string;
  setAmount: (val: string) => void;
  loading: boolean;
  accounts: any[];
  selectedAccount: any;
  setSelectedAccount: (acc: any) => void;
  direction: 'deposit' | 'withdraw';
  setDirection: (dir: 'deposit' | 'withdraw') => void;
  handleExternalRequest: () => void;
  handleInternalTransfer: () => void;
}

export default function ActionPanel({
  activeSection, setActiveSection, amount, setAmount, loading,
  accounts, selectedAccount, setSelectedAccount,
  direction, setDirection, handleInternalTransfer, handleExternalRequest // ✅ FIXED: Added this
}: Props) {
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Wrapper to be safe (optional, but good for debugging)
  const onConfirmExternal = () => {
      handleExternalRequest();
  };

  return (
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
                    onClick={onConfirmExternal} 
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
  );
}