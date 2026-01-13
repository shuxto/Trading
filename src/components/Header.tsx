import { User, ChevronDown } from 'lucide-react';
import { useClickSound } from '../hooks/useClickSound';

interface HeaderProps {
  activeAsset: { symbol: string; name: string; displaySymbol: string }; // Updated Props
  onOpenAssetSelector: () => void;
}

export default function Header({ activeAsset, onOpenAssetSelector }: HeaderProps) {
  const playClick = useClickSound();

  return (
    <header className="h-14 border-b border-[#2a2e39] flex items-center justify-between px-6 bg-[#151a21]/80 backdrop-blur-md z-30 relative">
      
      {/* 1. LOGO AREA & ASSET BUTTON */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#21ce99] to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(33,206,153,0.3)]">
            <span className="font-black text-black text-xs">T</span>
          </div>
          <div className="font-bold text-lg tracking-widest text-white hidden md:block">TRADING<span className="text-[#21ce99]">PRO</span></div>
        </div>

        {/* 2. THE ASSET BUTTON */}
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

      {/* 3. RIGHT PROFILE & BALANCE */}
      <div className="flex items-center gap-4">
        <div 
          onClick={playClick} 
          className="bg-[#0b0e11] px-4 py-1.5 rounded-lg border border-[#2a2e39] shadow-lg flex flex-col items-end group cursor-pointer hover:border-[#21ce99] transition-colors"
        >
          <span className="text-[#5e6673] text-[9px] font-bold uppercase">Total Balance</span>
          <span className="font-mono text-[#21ce99] font-bold text-sm tracking-wide shadow-[#21ce99]">$ 10,432.50</span>
        </div>

        <div 
          onClick={playClick}
          className="w-9 h-9 rounded-full bg-[#2a303c] flex items-center justify-center hover:bg-[#3e4552] transition cursor-pointer border border-[#2a2e39]"
        >
          <User size={18} className="text-[#8b9bb4]" />
        </div>
      </div>
    </header>
  )
}