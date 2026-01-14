import { User, ChevronDown, LayoutGrid } from 'lucide-react'; // Added LayoutGrid
import { useClickSound } from '../hooks/useClickSound';

interface HeaderProps {
  activeAsset: { 
    symbol: string; 
    name: string; 
    displaySymbol: string; 
  }; 
  balance: number; // ✅ Passed in real balance
  onOpenAssetSelector: () => void;
  onOpenDashboardPopup: () => void; // ✅ Opens the Popup
  onOpenProfilePage: () => void;    // ✅ Opens the Full Page
}

export default function Header({ 
  activeAsset, 
  balance, 
  onOpenAssetSelector, 
  onOpenDashboardPopup, 
  onOpenProfilePage 
}: HeaderProps) {
  
  const playClick = useClickSound();

  return (
    <header className="h-14 border-b border-[#2a2e39] flex items-center justify-between px-6 bg-[#151a21]/80 backdrop-blur-md z-30 relative">
      
      {/* 1. LOGO & ASSET */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#21ce99] to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(33,206,153,0.3)]">
            <span className="font-black text-black text-xs">T</span>
          </div>
          <div className="font-bold text-lg tracking-widest text-white hidden md:block">TRADING<span className="text-[#21ce99]">PRO</span></div>
        </div>

        <button 
          onClick={() => { playClick(); onOpenAssetSelector(); }}
          className="flex items-center gap-3 bg-[#0b0e11] hover:bg-[#2a303c] border border-[#2a2e39] hover:border-[#21ce99] rounded-lg px-4 py-1.5 transition-all group"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-[#5e6673] font-bold group-hover:text-[#21ce99] uppercase transition-colors">Current Asset</span>
            <span className="text-sm font-bold text-white tracking-wide">{activeAsset.displaySymbol} <span className="text-[#5e6673] text-xs ml-1">({activeAsset.name})</span></span>
          </div>
          <ChevronDown size={16} className="text-[#5e6673] group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* 2. RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-3">
        
        {/* A. BALANCE DISPLAY (Restored!) */}
        <div className="bg-[#0b0e11] px-4 py-1.5 rounded-lg border border-[#2a2e39] shadow-lg flex flex-col items-end min-w-[120px]">
          <span className="text-[#5e6673] text-[9px] font-bold uppercase">Total Balance</span>
          <span className="font-mono text-[#21ce99] font-bold text-sm tracking-wide shadow-[#21ce99]">
             $ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* B. NEW ICON: DASHBOARD POPUP (Banking/History) */}
        <button 
          onClick={() => { playClick(); onOpenDashboardPopup(); }}
          className="w-9 h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-[#21ce99] hover:text-black transition-all cursor-pointer border border-[#2a2e39] group"
          title="Dashboard"
        >
          <LayoutGrid size={18} className="text-[#8b9bb4] group-hover:text-black" />
        </button>

        {/* C. PROFILE ICON: GO TO PROFILE PAGE */}
        <button 
          onClick={() => { playClick(); onOpenProfilePage(); }}
          className="w-9 h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer border border-[#2a2e39] group"
          title="My Profile"
        >
          <User size={18} className="text-[#8b9bb4] group-hover:text-black" />
        </button>

      </div>
    </header>
  )
}