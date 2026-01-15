import { ShieldCheck, TrendingUp } from 'lucide-react'; // <-- Removed Wallet
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function OverviewTab({ onNavigateToPlatform }: { onNavigateToPlatform: () => void }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header>
        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-[#8b9bb4]">Here is what's happening with your account today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1e232d] to-[#151a21] border border-[#2a2e39]">
          <div className="text-[#8b9bb4] text-xs font-bold uppercase tracking-wider mb-2">Total Balance</div>
          <div className="text-4xl font-mono font-bold text-white">
            ${profile?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#21ce99] bg-[#21ce99]/10 w-fit px-2 py-1 rounded">
            <ShieldCheck size={12} /> Live Account Active
          </div>
        </div>

        <div 
          onClick={onNavigateToPlatform}
          className="group p-6 rounded-2xl bg-[#151a21] border border-[#2a2e39] cursor-pointer hover:border-[#21ce99] transition-all relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={100} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Open Platform</h3>
          <p className="text-[#8b9bb4] text-sm">Access the trading terminal, charts, and execution tools.</p>
          <span className="inline-block mt-4 text-[#21ce99] font-bold text-sm underline">Launch Now &rarr;</span>
        </div>
      </div>
    </div>
  );
}