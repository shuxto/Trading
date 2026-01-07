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
    // CHANGED: bg-[#151a21] -> bg-[#151a21]/80 backdrop-blur-xl border-white/5
    <aside className="hidden md:flex w-[60px] flex-col items-center py-4 border-r border-white/5 bg-[#151a21]/80 backdrop-blur-xl z-30">
      
      {/* Top Icons */}
      <div className="flex flex-col gap-6 w-full items-center">
        
        {/* Active Tab */}
        <button className="w-10 h-10 rounded-xl bg-[#21ce99]/20 flex items-center justify-center text-[#21ce99] transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(33,206,153,0.3)] border border-[#21ce99]/20">
          <LayoutGrid size={20} strokeWidth={2.5} />
        </button>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-white hover:bg-white/5 transition-all">
          <BarChart2 size={20} />
        </button>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-white hover:bg-white/5 transition-all">
          <History size={20} />
        </button>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-white hover:bg-white/5 transition-all">
          <Wallet size={20} />
        </button>

      </div>

      {/* Bottom Icons */}
      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-white hover:bg-white/5 transition-all">
          <HelpCircle size={20} />
        </button>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5e6673] hover:text-white hover:bg-white/5 transition-all">
          <Settings size={20} />
        </button>

        <div className="w-8 h-[1px] bg-white/5"></div>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#f4553b] hover:bg-[#f4553b]/10 transition-all">
          <LogOut size={20} />
        </button>

      </div>

    </aside>
  );
}