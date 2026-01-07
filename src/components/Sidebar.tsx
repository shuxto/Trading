import { 
  LayoutGrid, 
  BarChart2, 
  History, 
  Wallet, 
  Settings, 
  HelpCircle,
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-[60px] flex-col items-center py-4 border-r border-[#2a2e39] bg-[#151a21] z-30">
      
      {/* Top Icons */}
      <div className="flex flex-col gap-6 w-full items-center">
        <button className="w-10 h-10 rounded-xl bg-[#21ce99]/10 flex items-center justify-center text-[#21ce99] transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(33,206,153,0.2)]">
          <LayoutGrid size={20} strokeWidth={2.5} />
        </button>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-[#8b9bb4] hover:bg-[#2a303c] transition-all">
          <BarChart2 size={20} />
        </button>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-[#8b9bb4] hover:bg-[#2a303c] transition-all">
          <History size={20} />
        </button>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-[#8b9bb4] hover:bg-[#2a303c] transition-all">
          <Wallet size={20} />
        </button>
      </div>

      {/* Bottom Icons */}
      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-[#8b9bb4] hover:bg-[#2a303c] transition-all">
          <HelpCircle size={20} />
        </button>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-[#8b9bb4] hover:bg-[#2a303c] transition-all">
          <Settings size={20} />
        </button>
        <div className="w-8 h-[1px] bg-[#2a2e39]"></div>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#f4553b] hover:bg-[#f4553b]/10 transition-all">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}