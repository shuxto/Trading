import { motion } from "framer-motion";

interface OrderPanelProps {
  onTrade: (type: 'buy' | 'sell', amount: number) => void;
}

export default function OrderPanel({ onTrade }: OrderPanelProps) {
  return (
    // CHANGED: Glassmorphism styles
    <aside className="
      fixed bottom-0 left-0 right-0 z-50 h-[80px] bg-[#151a21]/90 backdrop-blur-xl border-t border-white/10 flex items-center px-4 gap-4 shadow-[0_-5px_40px_rgba(0,0,0,0.6)]
      md:static md:w-[200px] md:h-full md:border-l md:border-t-0 md:border-white/5 md:bg-[#151a21]/80 md:flex-col md:p-3 md:z-20
    ">
      
      {/* HEADER */}
      <div className="hidden md:block mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8b9bb4] text-[10px] font-bold tracking-[0.2em] uppercase">Spot</h2>
          <div className="w-1.5 h-1.5 rounded-full bg-[#21ce99] shadow-[0_0_8px_#21ce99]"></div>
        </div>
      </div>

      {/* INPUT */}
      <div className="flex-1 md:flex-none md:w-full">
         <div className="bg-black/20 p-1 rounded-lg border border-white/5 mb-0 md:mb-2">
            <div className="bg-[#151a21]/50 rounded p-2 flex md:block items-center justify-between">
              <div className="text-[9px] text-[#5e6673] font-bold md:mb-0.5 uppercase mr-2 md:mr-0">Amount</div>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-1">$</span>
                <input type="number" defaultValue="100" className="bg-transparent text-white text-lg font-bold w-16 md:w-full text-right outline-none font-mono"/>
              </div>
            </div>
         </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-2 md:flex-col md:w-full md:mt-auto">
        
        {/* BUY */}
        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(33, 206, 153, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTrade('buy', 100)}
          className="relative flex-1 md:flex-none h-10 md:h-12 rounded-lg bg-gradient-to-b from-[#21ce99] to-[#17a074] text-[#0b0e11] font-black text-sm md:text-lg tracking-wider overflow-hidden group shadow-lg"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-300 blur-md"></div>
          <div className="relative flex items-center justify-center gap-2">
            BUY <span className="hidden md:inline text-[9px] opacity-60 font-mono">LONG</span>
          </div>
        </motion.button>
        
        {/* SELL */}
        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(244, 85, 59, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTrade('sell', 100)}
          className="relative flex-1 md:flex-none h-10 md:h-12 rounded-lg bg-gradient-to-b from-[#f4553b] to-[#c93b25] text-white font-black text-sm md:text-lg tracking-wider overflow-hidden group shadow-lg"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-300 blur-md"></div>
          <div className="relative flex items-center justify-center gap-2">
            SELL <span className="hidden md:inline text-[9px] opacity-60 font-mono">SHORT</span>
          </div>
        </motion.button>

      </div>
    </aside>
  )
}