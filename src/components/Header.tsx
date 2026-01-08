import { User } from 'lucide-react';
// REMOVED: ChevronDown import (it was causing the error)

import { useClickSound } from '../hooks/useClickSound';

export default function Header() {
  const playClick = useClickSound();

  return (
    <header className="h-14 border-b border-[#2a2e39] flex items-center justify-between px-6 bg-[#151a21]/80 backdrop-blur-md z-30 relative">
      
      {/* 1. LOGO AREA */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#21ce99] to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(33,206,153,0.3)]">
          <span className="font-black text-black text-xs">T</span>
        </div>
        <div className="font-bold text-lg tracking-widest text-white">TRADING<span className="text-[#21ce99]">PRO</span></div>
      </div>

      {/* 3. RIGHT PROFILE & BALANCE */}
      <div className="flex items-center gap-4">
        
        {/* Balance Box */}
        <div 
          onClick={playClick} 
          className="bg-[#0b0e11] px-4 py-1.5 rounded-lg border border-[#2a2e39] shadow-lg flex flex-col items-end group cursor-pointer hover:border-[#21ce99] transition-colors"
        >
          <span className="text-[#5e6673] text-[9px] font-bold uppercase">Total Balance</span>
          <span className="font-mono text-[#21ce99] font-bold text-sm tracking-wide shadow-[#21ce99]">$ 10,432.50</span>
        </div>

        {/* Profile Circle */}
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