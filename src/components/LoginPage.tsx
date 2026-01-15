import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

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

    // 1. Clean inputs (just remove spaces)
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // 2. ZERO EMAIL RESTRICTIONS (We removed the Regex check)
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
              role: 'user', // Default role
              balance: 10000, // Starting Demo Balance
            },
          },
        });
        if (error) throw error;
        else {
          alert("Registration Successful! You can now log in.");
          setIsLogin(true); // Switch to login mode
        }
      }
    } catch (err: any) {
      // Let Supabase tell us if it's wrong (e.g. "Invalid login credentials")
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center p-4">
      
      {/* LOGO AREA */}
      <div className="mb-8 text-center">
        <div className="h-16 w-16 bg-[#21ce99]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#21ce99]/20 shadow-[0_0_30px_rgba(33,206,153,0.2)]">
          <LayoutDashboard size={32} className="text-[#21ce99]" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">TRADING<span className="text-[#21ce99]">CRM</span></h1>
        <p className="text-[#5e6673] mt-2">Professional Trading Terminal</p>
      </div>

      {/* AUTH CARD */}
      <div className="w-full max-w-md bg-[#1e232d] border border-[#2a2e39] rounded-2xl p-8 shadow-2xl">
        <div className="flex gap-4 mb-8 p-1 bg-[#151a21] rounded-xl">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              isLogin ? 'bg-[#2a2e39] text-white shadow-md' : 'text-[#8b9bb4] hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              !isLogin ? 'bg-[#2a2e39] text-white shadow-md' : 'text-[#8b9bb4] hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {error && (
            <div className="p-3 bg-[#f23645]/10 border border-[#f23645]/30 rounded-lg text-[#f23645] text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8b9bb4] uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6673]" size={18} />
              <input
                type="text" // changed from 'email' to 'text' to stop browser nagging
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter anything..."
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#5e6673] focus:border-[#21ce99] outline-none transition-colors font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8b9bb4] uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6673]" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#5e6673] focus:border-[#21ce99] outline-none transition-colors font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(33,206,153,0.3)] hover:shadow-[0_0_30px_rgba(33,206,153,0.5)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Access Terminal' : 'Create Account'} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#5e6673]">
          By continuing, you agree to our <span className="text-[#21ce99] cursor-pointer hover:underline">Terms of Service</span>.
        </p>
      </div>
    </div>
  );
}