import { Wallet, CreditCard, Shield, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Props {
  balance: number;
  activeSection: 'transfer' | 'deposit' | 'withdrawal';
  setActiveSection: (section: 'transfer' | 'deposit' | 'withdrawal') => void;
  setAmount: (val: string) => void;
}

export default function MainWalletCard({ balance, activeSection, setActiveSection, setAmount }: Props) {
  return (
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
                    ID: {balance > 0 ? 'ACTIVE' : 'INACTIVE'}
                </div>
            </div>

            {/* Balance */}
            <div className="mb-auto z-10">
                <div className="text-[10px] text-[#8b9bb4] uppercase font-bold tracking-widest mb-1">Available Equity</div>
                <div className="text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6 z-10">
                <button 
                    onClick={() => { setActiveSection('deposit'); setAmount(''); }}
                    className={`relative overflow-hidden group/btn font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border ${activeSection === 'deposit' ? 'bg-[#21ce99] border-[#21ce99] text-[#0b0e11]' : 'bg-[#1e232d] border-white/10 text-white hover:border-[#21ce99]/50'}`}
                >
                    <ArrowDownLeft size={18} className={activeSection === 'deposit' ? 'text-black' : 'text-[#21ce99]'} /> 
                    <span className="uppercase tracking-wider text-xs">Deposit</span>
                </button>
                <button 
                    onClick={() => { setActiveSection('withdrawal'); setAmount(''); }}
                    className={`relative overflow-hidden group/btn font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border ${activeSection === 'withdrawal' ? 'bg-[#f23645] border-[#f23645] text-white' : 'bg-[#1e232d] border-white/10 text-white hover:border-[#f23645]/50'}`}
                >
                    <ArrowUpRight size={18} className={activeSection === 'withdrawal' ? 'text-white' : 'text-[#f23645]'} /> 
                    <span className="uppercase tracking-wider text-xs">Withdraw</span>
                </button>
            </div>
        </div>
    </div>
  );
}