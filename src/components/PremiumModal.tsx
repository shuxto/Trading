import { X, Sparkles } from 'lucide-react'; // Removed Lock import

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    // 1. BACKDROP
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      {/* 2. THE GLASS CARD */}
      <div className="relative w-full max-w-md bg-[#151a21] border border-[#21ce99]/30 rounded-2xl shadow-[0_0_50px_rgba(33,206,153,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* 3. VIDEO HEADER */}
        <div className="relative h-48 w-full bg-black">
          {/* Subtle Gradient at bottom only */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#151a21] to-transparent z-[5]" />
          
          {/* THE VIDEO (Clean, no text on top) */}
          <video 
            src="/videos/1sec.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-90" // Increased opacity slightly for better visibility
          />
        </div>

        {/* 4. CONTENT */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold text-white">Unlock 1-Second Updates</h2>
          <p className="text-[#8b9bb4] text-sm leading-relaxed">
            See the market move before anyone else. Upgrade to the Pro plan to enable <span className="text-white font-bold">Real-Time Tick Updates</span> and trade with surgical precision.
          </p>

          {/* ACTION BUTTON */}
          <button className="w-full py-3 mt-2 bg-gradient-to-r from-[#21ce99] to-[#18a075] hover:from-[#25e6ab] hover:to-[#1cb584] rounded-xl flex items-center justify-center gap-2 text-[#0b0e11] font-bold shadow-lg shadow-[#21ce99]/20 transition-all active:scale-95 group">
            <Sparkles size={18} className="transition-transform group-hover:rotate-12" />
            <span>Ask Agent to Unlock</span>
          </button>
          
          <button 
            onClick={onClose}
            className="text-xs text-[#5e6673] hover:text-white transition-colors"
          >
            No thanks, I'll stick to 1-minute updates
          </button>
        </div>

      </div>
    </div>
  );
}