import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Play, Briefcase } from 'lucide-react';
import type { TradingAccount } from '../../types';

interface Props {
  // We removed the old onLaunch handler because we handle it directly here now
  globalBalance: number;
}

export default function AccountsTab({ globalBalance }: Props) {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (data) setAccounts(data);
  };

  const createAccount = async () => {
    if (!newAccountName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('trading_accounts').insert({
      user_id: user.id,
      name: newAccountName
    });

    if (!error) {
      setNewAccountName('');
      setIsCreating(false);
      fetchAccounts();
    }
  };

  // --- NEW LAUNCH LOGIC ---
  const handleOpenInNewTab = (accountId: number) => {
      // Open current URL + query param in new tab
      const url = `${window.location.origin}?mode=trading&account_id=${accountId}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER: Shows Global Balance */}
      <div className="bg-gradient-to-r from-[#1e232d] to-[#151a21] p-6 rounded-2xl border border-[#2a2e39] flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">Trading Accounts</h2>
           <p className="text-[#8b9bb4] text-sm">Manage different strategies using your main wallet.</p>
        </div>
        <div className="text-right">
           <div className="text-[#8b9bb4] text-xs uppercase font-bold">Global Wallet Balance</div>
           <div className="text-3xl font-mono font-bold text-[#21ce99]">
             ${globalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-[#21ce99] hover:bg-[#1db586] text-[#0b0e11] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Create New Room
        </button>
      </div>

      {isCreating && (
        <div className="bg-[#1e232d] p-4 rounded-xl border border-[#2a2e39] flex gap-2 animate-in slide-in-from-top-2">
          <input 
            type="text" 
            placeholder="Room Name (e.g. Bot Strategy)"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            className="flex-1 bg-[#0b0e11] border border-[#2a2e39] rounded-lg px-4 text-white focus:border-[#21ce99] outline-none"
          />
          <button onClick={createAccount} className="text-[#21ce99] font-bold hover:underline px-4">Save</button>
          <button onClick={() => setIsCreating(false)} className="text-[#8b9bb4] hover:text-white px-4">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-[#1e232d] border border-[#2a2e39] rounded-xl p-6 hover:border-[#21ce99] transition-all group relative flex flex-col justify-between h-40">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#2a303c] rounded-lg text-white group-hover:text-[#21ce99] transition-colors">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{acc.name}</h3>
                  <p className="text-[10px] text-[#5e6673] font-mono">ID: {acc.id}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleOpenInNewTab(acc.id)} // <--- OPENS NEW TAB
              className="w-full bg-[#2a2e39] group-hover:bg-[#21ce99] text-white group-hover:text-[#0b0e11] font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all mt-4"
            >
              <Play size={16} /> LAUNCH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}