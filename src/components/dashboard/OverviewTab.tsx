import { TrendingUp, Wallet, Briefcase, PiggyBank } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function OverviewTab({ onNavigateToPlatform }: { onNavigateToPlatform: () => void }) {
  const [mainBalance, setMainBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Main Profile (Unused Funds)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();
    
    // 2. Fetch Trading Accounts (Active Room Balances)
    const { data: accountsData } = await supabase
      .from('trading_accounts')
      .select('id, name, balance')
      .eq('user_id', user.id);

    if (profileData) {
        const mBalance = profileData.balance || 0;
        setMainBalance(mBalance);

        // Calculate Total (Main Wallet + All Rooms)
        let total = mBalance;
        
        if (accountsData) {
            const roomsTotal = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0);
            total += roomsTotal;
            setAccounts(accountsData);
        }
        setTotalAssets(total);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header>
        <h2 className="text-2xl font-bold text-white">Financial Overview</h2>
        <p className="text-[#8b9bb4]">Your complete portfolio snapshot.</p>
      </header>

      {/* --- TOP ROW: 3 CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. TOTAL NET WORTH */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#21ce99]/20 to-[#151a21] border border-[#21ce99]/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <TrendingUp size={80} />
          </div>
          <div className="text-[#21ce99] text-xs font-bold uppercase tracking-wider mb-2">Total Net Worth</div>
          <div className="text-3xl font-mono font-bold text-white">
            ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-4 text-[10px] text-[#8b9bb4]">
             Global Wallet + All Rooms
          </div>
        </div>

        {/* 2. MAIN WALLET (IDLE / UNUSED) */}
        <div className="p-6 rounded-2xl bg-[#1e232d] border border-[#2a2e39] relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5">
            <Wallet size={80} />
          </div>
          <div className="text-[#8b9bb4] text-xs font-bold uppercase tracking-wider mb-2">Unused Funds (Main)</div>
          <div className="text-3xl font-mono font-bold text-white">
            ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
           <div className="mt-4 flex items-center gap-2 text-[10px] text-[#5e6673] bg-[#0b0e11] w-fit px-2 py-1 rounded border border-[#2a2e39]">
            <PiggyBank size={12} /> Available for Transfer
          </div>
        </div>

        {/* 3. ACTION CARD (LAUNCH PLATFORM) */}
        <div 
          onClick={onNavigateToPlatform}
          className="group p-6 rounded-2xl bg-[#151a21] border border-[#2a2e39] cursor-pointer hover:border-[#21ce99] transition-all relative overflow-hidden flex flex-col justify-center"
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Briefcase size={80} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#21ce99] transition-colors">Open Platform</h3>
          <p className="text-[#5e6673] text-xs">Manage active positions.</p>
          <span className="inline-block mt-auto pt-4 text-[#21ce99] font-bold text-xs underline">Launch &rarr;</span>
        </div>
      </div>

      {/* --- BOTTOM SECTION: ROOM BREAKDOWN --- */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-[#21ce99]" /> Trading Room Balances
        </h3>
        
        {accounts.length === 0 ? (
            <div className="p-8 bg-[#1e232d] rounded-2xl border border-[#2a2e39] text-center text-[#5e6673]">
                No trading rooms active. Create one in the "Trading Accounts" tab.
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-[#1e232d] p-4 rounded-xl border border-[#2a2e39] hover:border-[#5e6673] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white text-sm">{acc.name}</span>
                            <span className="text-[10px] text-[#5e6673] font-mono bg-[#0b0e11] px-1.5 py-0.5 rounded">ID: {acc.id}</span>
                        </div>
                        <div className="text-xl font-mono font-bold text-[#21ce99]">
                            ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}