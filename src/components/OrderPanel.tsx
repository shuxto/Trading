interface OrderPanelProps {
  onTrade: (type: 'buy' | 'sell', amount: number) => void;
}

export default function OrderPanel({ onTrade }: OrderPanelProps) {
  return (
    <aside className="
      /* MOBILE: Fixed bottom bar */
      fixed bottom-0 left-0 right-0 z-50 h-[80px] bg-[#151a21] border-t border-[#2a2e39] flex items-center px-4 gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]
      /* DESKTOP: Right Sidebar */
      md:static md:w-[200px] md:h-full md:border-l md:border-t-0 md:flex-col md:p-3 md:z-20
    ">
      
      {/* HEADER (Desktop Only) */}
      <div className="hidden md:block mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8b9bb4] text-[10px] font-bold tracking-[0.2em] uppercase">Spot</h2>
          <div className="w-1.5 h-1.5 rounded-full bg-[#21ce99] shadow-[0_0_8px_#21ce99]"></div>
        </div>
      </div>

      {/* INPUT AMOUNT */}
      <div className="flex-1 md:flex-none md:w-full">
         <div className="bg-[#0b0e11] p-1 rounded-lg border border-[#2a2e39] mb-0 md:mb-2">
            <div className="bg-[#151a21] rounded p-2 flex md:block items-center justify-between">
              <div className="text-[9px] text-[#5e6673] font-bold md:mb-0.5 uppercase mr-2 md:mr-0">Amount</div>
              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-1">$</span>
                <input type="number" defaultValue="100" className="bg-transparent text-white text-lg font-bold w-16 md:w-full text-right outline-none font-mono"/>
              </div>
            </div>
         </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-2 md:flex-col md:w-full md:mt-auto">
        <button 
          onClick={() => onTrade('buy', 100)}
          className="flex-1 md:flex-none h-10 md:h-12 rounded-lg bg-[#21ce99] hover:bg-[#19a57a] text-[#0b0e11] font-black text-sm md:text-lg tracking-wider shadow-[0_0_15px_rgba(33,206,153,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          BUY <span className="hidden md:inline text-[9px] opacity-60">LONG</span>
        </button>
        
        <button 
          onClick={() => onTrade('sell', 100)}
          className="flex-1 md:flex-none h-10 md:h-12 rounded-lg bg-[#f4553b] hover:bg-[#c93b25] text-white font-black text-sm md:text-lg tracking-wider shadow-[0_0_15px_rgba(244,85,59,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          SELL <span className="hidden md:inline text-[9px] opacity-60">SHORT</span>
        </button>
      </div>
    </aside>
  )
}