import { useState } from 'react';
import { User, ChevronDown, LayoutGrid, Briefcase, Check, TrendingUp, Wallet } from 'lucide-react';
import { useClickSound } from '../hooks/useClickSound';

interface HeaderProps {
  activeAsset: { 
    symbol: string; 
    name: string; 
    displaySymbol: string; 
  }; 
  balance: number; 
  activeAccountName?: string;
  userAccounts: any[]; // ✅ Prop received from App.tsx
  onOpenAssetSelector: () => void;
  onOpenDashboardPopup: () => void; 
  onOpenProfilePage: () => void;    
}

export default function Header({ 
  activeAsset, 
  balance, 
  activeAccountName, 
  userAccounts, // ✅ Destructured here
  onOpenAssetSelector, 
  onOpenDashboardPopup, 
  onOpenProfilePage 
}: HeaderProps) {
  
  const playClick = useClickSound();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <header className="h-14 md:h-16 border-b border-[#21ce99]/20 flex items-center justify-between px-4 md:px-6 bg-[#151a21]/95 backdrop-blur-md z-50 relative shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-sans">
      
      {/* 1. LEFT SIDE: LOGO & SELECTORS */}
      <div className="flex items-center gap-4 md:gap-8">
        
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#21ce99] to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(33,206,153,0.4)] border border-white/10">
            <TrendingUp size={18} className="text-[#0b0e11]" strokeWidth={3} />
          </div>
          <div className="hidden md:flex flex-col leading-none">
            <span className="font-black text-sm tracking-[0.2em] text-white">VOIDNET</span>
            <span className="text-[9px] font-bold text-[#21ce99] tracking-widest uppercase">Terminal v7.4</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

        <div className="flex items-center gap-3">
            {/* ASSET SELECTOR */}
            <button 
              onClick={() => { playClick(); onOpenAssetSelector(); }}
              className="group flex items-center gap-3 bg-[#0b0e11] hover:bg-[#1e232d] border border-white/10 hover:border-[#21ce99]/50 rounded-xl px-3 py-1.5 transition-all shadow-inner"
            >
              <div className="flex flex-col items-start">
                  <span className="hidden md:block text-[8px] text-[#5e6673] font-bold group-hover:text-[#21ce99] uppercase tracking-wider transition-colors">Target Asset</span>
                  <span className="text-xs md:text-sm font-black text-white tracking-wide font-mono">{activeAsset.displaySymbol}</span>
              </div>
              <ChevronDown size={14} className="text-[#5e6673] group-hover:text-[#21ce99] transition-colors" />
            </button>

            {/* ✅ ACCOUNT SWITCHER DROPDOWN */}
            {activeAccountName && (
                <div className="relative">
                    <button 
                      onClick={() => { playClick(); setIsAccountMenuOpen(!isAccountMenuOpen); }}
                      className={`flex items-center gap-3 border rounded-xl px-3 py-1.5 transition-all ${
                        isAccountMenuOpen 
                        ? 'bg-[#21ce99]/10 border-[#21ce99] shadow-[0_0_15px_rgba(33,206,153,0.2)]' 
                        : 'bg-[#1e232d] border-white/10 hover:border-[#21ce99]/50'
                      }`}
                    >
                        <div className={`hidden md:flex p-1.5 rounded-lg transition-colors ${isAccountMenuOpen ? 'bg-[#21ce99] text-[#0b0e11]' : 'bg-white/5 text-[#21ce99]'}`}>
                            <Briefcase size={14} />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="hidden md:block text-[8px] text-[#5e6673] font-bold uppercase tracking-wider leading-none mb-0.5">Active Unit</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] md:text-xs font-bold text-white leading-none uppercase tracking-wide">{activeAccountName}</span>
                              <ChevronDown size={12} className={`text-[#5e6673] transition-transform ${isAccountMenuOpen ? 'rotate-180 text-[#21ce99]' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* 🟢 FLOATING MENU */}
                    {isAccountMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-3 w-64 bg-[#151a21] border border-[#21ce99]/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 overflow-hidden animate-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-white/5 bg-[#0b0e11] flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-[#21ce99] uppercase tracking-widest">Select Room</span>
                                    <span className="text-[9px] font-bold text-[#5e6673]">{userAccounts?.length || 0} UNITS</span>
                                </div>
                                
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                    {userAccounts && userAccounts.length > 0 ? (
                                        userAccounts.map((acc) => (
                                            <button
                                                key={acc.id}
                                                onClick={() => {
                                                    playClick();
                                                    window.location.href = `?mode=trading&account_id=${acc.id}`;
                                                    setIsAccountMenuOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-3 hover:bg-[#21ce99]/10 rounded-lg transition-all text-left group border border-transparent hover:border-[#21ce99]/20 mb-1"
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold uppercase tracking-wide ${activeAccountName === acc.name ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{acc.name}</span>
                                                    <span className="text-[10px] text-[#5e6673] font-mono group-hover:text-[#21ce99] transition-colors">${acc.balance.toLocaleString()}</span>
                                                </div>
                                                {activeAccountName === acc.name && <div className="bg-[#21ce99] p-1 rounded-full text-[#0b0e11]"><Check size={10} strokeWidth={4} /></div>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-6 text-center text-gray-500 text-[10px] font-mono uppercase">No active units found</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* 2. RIGHT SIDE: BALANCE & TOOLS */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* BALANCE DISPLAY */}
        <div className="bg-[#0b0e11] pl-3 pr-4 py-1.5 rounded-xl border border-white/10 shadow-inner flex items-center gap-3 group hover:border-[#21ce99]/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#1e232d] flex items-center justify-center text-[#21ce99] group-hover:scale-110 transition-transform">
             <Wallet size={16} />
          </div>
          <div className="flex flex-col items-end">
             <span className="hidden md:block text-[#5e6673] text-[8px] font-bold uppercase tracking-widest">Room Equity</span>
             <span className="font-mono text-white font-bold text-xs md:text-sm tracking-tight group-hover:text-[#21ce99] transition-colors">
               $ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
             </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

        {/* DASHBOARD BUTTON */}
        <button 
          onClick={() => { playClick(); onOpenDashboardPopup(); }}
          className="w-10 h-10 rounded-xl bg-[#1e232d] border border-white/10 flex items-center justify-center hover:bg-[#21ce99] hover:text-[#0b0e11] hover:border-[#21ce99] transition-all cursor-pointer shadow-lg group"
          title="Dashboard"
        >
          <LayoutGrid size={18} className="text-gray-400 group-hover:text-[#0b0e11] transition-colors" />
        </button>

        {/* PROFILE BUTTON */}
        <button 
          onClick={() => { playClick(); onOpenProfilePage(); }}
          className="w-10 h-10 rounded-xl bg-[#1e232d] border border-white/10 flex items-center justify-center hover:bg-white hover:text-[#0b0e11] hover:border-white transition-all cursor-pointer shadow-lg group"
          title="Profile"
        >
          <User size={18} className="text-gray-400 group-hover:text-[#0b0e11] transition-colors" />
        </button>
      </div>
    </header>
  );
}