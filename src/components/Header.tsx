import { User, ChevronDown, LayoutGrid, Briefcase } from 'lucide-react';
import { useClickSound } from '../hooks/useClickSound';

interface HeaderProps {
  activeAsset: { 
    symbol: string; 
    name: string; 
    displaySymbol: string; 
  }; 
  balance: number; 
  activeAccountName?: string;
  onOpenAssetSelector: () => void;
  onOpenDashboardPopup: () => void; 
  onOpenProfilePage: () => void;    
}

export default function Header({ 
  activeAsset, 
  balance, 
  activeAccountName, 
  onOpenAssetSelector, 
  onOpenDashboardPopup, 
  onOpenProfilePage 
}: HeaderProps) {
  
  const playClick = useClickSound();

  return (
    <header className="h-12 md:h-14 border-b border-[#2a2e39] flex items-center justify-between px-3 md:px-6 bg-[#151a21] z-30 relative shadow-md">
      
      {/* 1. LEFT SIDE */}
      <div className="flex items-center gap-2 md:gap-6">
        
        {/* LOGO (Hidden text on mobile, just icon) */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#21ce99] to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(33,206,153,0.3)]">
            <span className="font-black text-black text-[10px] md:text-xs">T</span>
          </div>
          <div className="font-bold text-lg tracking-widest text-white hidden md:block">
            TRADING<span className="text-[#21ce99]">PRO</span>
          </div>
        </div>

        {/* SEPARATOR */}
        <div className="h-6 w-[1px] bg-[#2a2e39] hidden md:block"></div>

        {/* ASSET & ACCOUNT */}
        <div className="flex items-center gap-2">
            
            {/* A. ASSET SELECTOR (Compact on Mobile) */}
            <button 
              onClick={() => { playClick(); onOpenAssetSelector(); }}
              className="flex items-center gap-2 bg-[#0b0e11] hover:bg-[#2a303c] border border-[#2a2e39] hover:border-[#21ce99] rounded-lg px-2 py-1 md:px-3 md:py-1.5 transition-all group"
            >
              <div className="flex flex-col items-start">
                  {/* Hide Label on Mobile */}
                  <span className="hidden md:block text-[9px] text-[#5e6673] font-bold group-hover:text-[#21ce99] uppercase transition-colors">Asset</span>
                  <span className="text-xs md:text-sm font-bold text-white tracking-wide">{activeAsset.displaySymbol}</span>
              </div>
              <ChevronDown size={12} className="text-[#5e6673] group-hover:text-white transition-colors" />
            </button>

            {/* B. ACTIVE ACCOUNT BADGE (Icon only on mobile if space is tight, or small text) */}
            {activeAccountName && (
                <div className="flex items-center gap-2 bg-[#21ce99]/10 border border-[#21ce99]/30 rounded-lg px-2 py-1 md:px-3 md:py-1.5 animate-in fade-in">
                    <div className="hidden md:block p-1 bg-[#21ce99]/20 rounded text-[#21ce99]">
                        <Briefcase size={12} />
                    </div>
                    <div className="flex flex-col">
                        <span className="hidden md:block text-[9px] text-[#21ce99] font-bold uppercase leading-none">Trading Room</span>
                        <span className="text-[10px] md:text-xs font-bold text-white leading-tight whitespace-nowrap">{activeAccountName}</span>
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* 2. RIGHT SIDE */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* A. BALANCE (Compact) */}
        <div className="bg-[#0b0e11] px-2 py-1 md:px-4 md:py-1.5 rounded-lg border border-[#2a2e39] shadow-lg flex flex-col items-end min-w-[auto] md:min-w-[120px]">
          <span className="hidden md:block text-[#5e6673] text-[9px] font-bold uppercase">Shared Wallet</span>
          <span className="font-mono text-[#21ce99] font-bold text-xs md:text-sm tracking-wide">
             $ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* B. ICONS (Smaller on Mobile) */}
        <button 
          onClick={() => { playClick(); onOpenDashboardPopup(); }}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-[#21ce99] hover:text-black transition-all cursor-pointer border border-[#2a2e39]"
        >
          <LayoutGrid size={16} className="text-[#8b9bb4] hover:text-black" />
        </button>

        <button 
          onClick={() => { playClick(); onOpenProfilePage(); }}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer border border-[#2a2e39]"
        >
          <User size={16} className="text-[#8b9bb4] hover:text-black" />
        </button>

      </div>
    </header>
  )
}