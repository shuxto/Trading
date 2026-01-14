import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // REGISTER
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registration successful! You are logged in.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0e11] flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#21ce99]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-[#151a21]/80 backdrop-blur-xl border border-[#2a2e39] p-8 rounded-2xl shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#21ce99] to-blue-600 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="font-black text-black text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[#5e6673] text-sm mt-2">
            Professional Trading Platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#f23645]/10 border border-[#f23645]/50 rounded-lg text-[#f23645] text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#8b9bb4] uppercase ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6673]" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#21ce99] outline-none transition-all"
                placeholder="trader@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#8b9bb4] uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6673]" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#21ce99] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#21ce99] hover:bg-[#1db586] text-[#0b0e11] font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(33,206,153,0.3)] mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#5e6673] hover:text-white transition-colors font-medium"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}