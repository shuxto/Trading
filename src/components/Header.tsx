import { useState } from 'react';
import { User, ChevronDown, LayoutGrid, Briefcase, Check } from 'lucide-react';
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
    <header className="h-12 md:h-14 border-b border-[#2a2e39] flex items-center justify-between px-3 md:px-6 bg-[#151a21] z-50 relative shadow-md">
      
      {/* 1. LEFT SIDE */}
      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#21ce99] to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(33,206,153,0.3)]">
            <span className="font-black text-black text-[10px] md:text-xs">T</span>
          </div>
          <div className="font-bold text-lg tracking-widest text-white hidden md:block">
            TRADING<span className="text-[#21ce99]">PRO</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#2a2e39] hidden md:block"></div>

        <div className="flex items-center gap-2">
            <button 
              onClick={() => { playClick(); onOpenAssetSelector(); }}
              className="flex items-center gap-2 bg-[#0b0e11] hover:bg-[#2a303c] border border-[#2a2e39] hover:border-[#21ce99] rounded-lg px-2 py-1 md:px-3 md:py-1.5 transition-all group"
            >
              <div className="flex flex-col items-start">
                  <span className="hidden md:block text-[9px] text-[#5e6673] font-bold group-hover:text-[#21ce99] uppercase transition-colors">Asset</span>
                  <span className="text-xs md:text-sm font-bold text-white tracking-wide">{activeAsset.displaySymbol}</span>
              </div>
              <ChevronDown size={12} className="text-[#5e6673] group-hover:text-white transition-colors" />
            </button>

            {/* ✅ ACCOUNT SWITCHER DROPDOWN */}
            {activeAccountName && (
                <div className="relative">
                    <button 
                      onClick={() => { playClick(); setIsAccountMenuOpen(!isAccountMenuOpen); }}
                      className={`flex items-center gap-2 border rounded-lg px-2 py-1 md:px-3 md:py-1.5 transition-all animate-in fade-in ${
                        isAccountMenuOpen ? 'bg-[#21ce99]/20 border-[#21ce99]' : 'bg-[#21ce99]/10 border-[#21ce99]/30 hover:border-[#21ce99]'
                      }`}
                    >
                        <div className="hidden md:block p-1 bg-[#21ce99]/20 rounded text-[#21ce99]">
                            <Briefcase size={12} />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="hidden md:block text-[9px] text-[#21ce99] font-bold uppercase leading-none">Trading Room</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] md:text-xs font-bold text-white leading-tight">{activeAccountName}</span>
                              <ChevronDown size={10} className={`text-[#21ce99] transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* 🟢 FLOATING MENU */}
                    {isAccountMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-56 bg-[#1e232d] border border-[#2a2e39] rounded-xl shadow-2xl z-20 overflow-hidden py-1 animate-in slide-in-from-top-2">
                                <div className="px-3 py-2 border-b border-[#2a2e39] bg-black/20">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Switch Room</span>
                                </div>
                                {/* ✅ Mapping through userAccounts from PROPS */}
                                {userAccounts && userAccounts.length > 0 ? (
                                    userAccounts.map((acc) => (
                                        <button
                                            key={acc.id}
                                            onClick={() => {
                                                playClick();
                                                window.location.href = `?mode=trading&account_id=${acc.id}`;
                                                setIsAccountMenuOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#2a2e39] transition-colors text-left"
                                        >
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-bold ${activeAccountName === acc.name ? 'text-[#21ce99]' : 'text-white'}`}>{acc.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">${acc.balance.toLocaleString()}</span>
                                            </div>
                                            {activeAccountName === acc.name && <Check size={14} className="text-[#21ce99]" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-gray-500 text-[10px]">No accounts found</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* 2. RIGHT SIDE */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="bg-[#0b0e11] px-2 py-1 md:px-4 md:py-1.5 rounded-lg border border-[#2a2e39] shadow-lg flex flex-col items-end min-w-[auto] md:min-w-[120px]">
          <span className="hidden md:block text-[#5e6673] text-[9px] font-bold uppercase">Account Wallet</span>
          <span className="font-mono text-[#21ce99] font-bold text-xs md:text-sm tracking-wide">
              $ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button 
          onClick={() => { playClick(); onOpenDashboardPopup(); }}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-[#21ce99] hover:text-black transition-all cursor-pointer border border-[#2a2e39]"
        >
          <LayoutGrid size={16} className="text-[#8b9bb4]" />
        </button>

        <button 
          onClick={() => { playClick(); onOpenProfilePage(); }}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer border border-[#2a2e39]"
        >
          <User size={16} className="text-[#8b9bb4]" />
        </button>
      </div>
    </header>
  );
}