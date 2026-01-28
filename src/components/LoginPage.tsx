import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Lock, Mail, ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react';
// 🟢 FIX: Added AnimatePresence to the import
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
       setError("Please enter an email");
       setLoading(false);
       return;
    }

    if (cleanPassword.length < 1) {
       setError("Please enter a password");
       setLoading(false);
       return;
    }

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
      } else {
        // --- REGISTER LOGIC ---
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              role: 'user',
              balance: 0,
              kyc_status: 'unverified' 
            },
          },
        });
        if (error) throw error;
        else {
          alert("Registration Successful! You can now log in.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#21ce99] selection:text-black">
      
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#151a21] via-[#0b0e11] to-[#000000]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#21ce99 1px, transparent 1px), linear-gradient(90deg, #21ce99 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-[#21ce99]/20 to-transparent" />
      <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-[#21ce99]/20 to-transparent" />

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* LOGO AREA */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
        >
            <div className="relative inline-block group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#21ce99] to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-20 w-20 bg-[#151a21] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#21ce99]/30 shadow-2xl">
                    <LayoutDashboard size={40} className="text-[#21ce99] drop-shadow-[0_0_10px_rgba(33,206,153,0.5)]" />
                </div>
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                VOID<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#21ce99] to-emerald-600">NET</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-[#5e6673] text-xs font-mono tracking-widest uppercase">
                <span className="w-2 h-2 bg-[#21ce99] rounded-full animate-pulse"></span>
                System Operational
            </div>
        </motion.div>

        {/* AUTH CARD */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#151a21]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
            {/* Top Light Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#21ce99] to-transparent opacity-50" />

            {/* TABS */}
            <div className="flex gap-2 p-1.5 bg-[#0b0e11] rounded-xl border border-white/5 mb-8">
                <button
                    onClick={() => { setIsLogin(true); setError(null); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all relative overflow-hidden ${
                        isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {isLogin && <motion.div layoutId="authTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">Access Terminal</span>
                </button>
                <button
                    onClick={() => { setIsLogin(false); setError(null); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all relative overflow-hidden ${
                        !isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {!isLogin && <motion.div layoutId="authTab" className="absolute inset-0 bg-[#2a2e39] rounded-lg shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">New Registration</span>
                </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2 group">
                    <label className="text-[10px] font-bold text-[#8b9bb4] uppercase tracking-widest ml-1 group-focus-within:text-[#21ce99] transition-colors">Identification (Email)</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6673] group-focus-within:text-[#21ce99] transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="text" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="OPERATIVE ID..."
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-4 pl-12 pr-4 text-white placeholder-[#2a2e39] focus:border-[#21ce99] focus:shadow-[0_0_20px_rgba(33,206,153,0.1)] outline-none transition-all font-mono text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <label className="text-[10px] font-bold text-[#8b9bb4] uppercase tracking-widest ml-1 group-focus-within:text-[#21ce99] transition-colors">Access Key (Password)</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6673] group-focus-within:text-[#21ce99] transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-4 pl-12 pr-4 text-white placeholder-[#2a2e39] focus:border-[#21ce99] focus:shadow-[0_0_20px_rgba(33,206,153,0.1)] outline-none transition-all font-mono text-sm font-medium"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#21ce99] to-[#1db586] hover:from-[#1db586] hover:to-[#1aa37a] text-[#0b0e11] font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(33,206,153,0.3)] hover:shadow-[0_0_30px_rgba(33,206,153,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            {isLogin ? <Zap size={20} className="fill-current" /> : <ShieldCheck size={20} />}
                            <span className="uppercase tracking-widest text-xs">{isLogin ? 'Initialize Session' : 'Create Secure ID'}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-[10px] text-[#8b9bb4] uppercase font-bold tracking-widest">
                    <ShieldCheck size={12} /> 256-Bit Encrypted
                </div>
                <div className="w-1 h-1 bg-[#2a2e39] rounded-full" />
                <div className="flex items-center gap-2 text-[10px] text-[#8b9bb4] uppercase font-bold tracking-widest">
                    <Zap size={12} /> Low Latency
                </div>
            </div>
        </motion.div>

        <p className="mt-8 text-center text-[10px] text-[#5e6673] font-mono">
            SECURE CONNECTION ESTABLISHED v2.4.0 <br/>
            <span className="opacity-50">UNAUTHORIZED ACCESS IS PROHIBITED</span>
        </p>
      </div>
    </div>
  );
}