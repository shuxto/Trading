import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function GlassModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'warning',
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false
}: GlassModalProps) {
  
  if (!isOpen) return null;

  // Colors based on type
  const colors = {
    danger: { icon: 'text-[#f23645]', bg: 'bg-[#f23645]/10', border: 'border-[#f23645]/30', btn: 'bg-[#f23645] hover:bg-[#d12c39]' },
    success: { icon: 'text-[#21ce99]', bg: 'bg-[#21ce99]/10', border: 'border-[#21ce99]/30', btn: 'bg-[#21ce99] hover:bg-[#1aa37a] text-black' },
    warning: { icon: 'text-[#F0B90B]', bg: 'bg-[#F0B90B]/10', border: 'border-[#F0B90B]/30', btn: 'bg-[#F0B90B] hover:bg-[#d9a70a] text-black' },
    info:    { icon: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/30', btn: 'bg-[#3b82f6] hover:bg-[#2563eb] text-white' },
  };

  const theme = colors[type];
  const Icon = type === 'danger' ? AlertTriangle : type === 'success' ? CheckCircle : Info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* BACKDROP (Blurry & Dark) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b0e11]/80 backdrop-blur-sm transition-opacity"
          />

          {/* MODAL CONTENT (Glass) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md bg-[#151a21]/90 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col`}
          >
            {/* DECORATIVE TOP LINE */}
            <div className={`h-1 w-full ${theme.bg.replace('/10', '')}`} />

            <div className="p-6 flex flex-col items-center text-center">
              
              {/* ICON GLOW */}
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${theme.bg} ${theme.border} border shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
                 <Icon size={32} className={theme.icon} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-[#8b9bb4] text-sm leading-relaxed mb-6">
                {description}
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 w-full">
                {onConfirm && (
                   <button 
                     onClick={onClose}
                     className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#2a2e39] text-gray-400 hover:text-white hover:bg-[#363b47] transition-all"
                   >
                     {cancelText}
                   </button>
                )}
                
                <button 
                  onClick={() => {
                     if (onConfirm) onConfirm();
                     else onClose(); // If it's just an alert, close it
                  }}
                  disabled={isLoading}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${theme.btn} ${!onConfirm ? 'w-full' : ''}`}
                >
                  {isLoading ? "Processing..." : confirmText}
                </button>
              </div>
            </div>

            {/* CLOSE X TOP RIGHT */}
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}