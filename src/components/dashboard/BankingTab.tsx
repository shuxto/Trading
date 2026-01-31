import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// The Boss calls the workers from the neighbor folder
import MainWalletCard from '../banking/MainWalletCard';
import ActionPanel from '../banking/ActionPanel';
import TransactionHistory from '../banking/TransactionHistory';

export default function BankingTab() {
  const [mainBalance, setMainBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // UI State
  const [activeSection, setActiveSection] = useState<'transfer' | 'deposit' | 'withdrawal'>('transfer');
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Main Wallet
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
    if (profile) setMainBalance(profile.balance);

    // 2. Get Rooms
    const { data: rooms } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id).order('created_at');
    if (rooms) {
        setAccounts(rooms);
        if (!selectedAccount && rooms.length > 0) setSelectedAccount(rooms[0]);
    }

    // 3. Get History
    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (txs) setTransactions(txs);
  };

  // --- INTERNAL TRANSFER ---
  const handleInternalTransfer = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !selectedAccount) return;

    setLoading(true);
    try {
        const { error } = await supabase.rpc('transfer_funds', {
            p_room_id: selectedAccount.id,
            p_amount: val,
            p_direction: direction 
        });

        if (error) throw error;
        setAmount('');
        await fetchData(); 
        // Optional: Add Toast Notification here
    } catch (err: any) {
        alert("Transfer Failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- EXTERNAL REQUEST ---
  const handleExternalRequest = async () => {
      const val = parseFloat(amount);
      if (!val || val <= 0) return;
      
      if (activeSection === 'withdrawal' && val > mainBalance) {
          alert("Insufficient funds.");
          return;
      }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
          const { error } = await supabase.from('transactions').insert({
              user_id: user.id,
              type: activeSection,
              amount: val,
              status: 'pending'
          });

          if (!error) {
            setAmount('');
            setActiveSection('transfer');
            fetchData();
          }
      }
      setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-10 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: MAIN WALLET */}
        <MainWalletCard 
            balance={mainBalance}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            setAmount={setAmount}
        />

        {/* RIGHT: ACTION FORMS */}
        <ActionPanel 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            amount={amount}
            setAmount={setAmount}
            loading={loading}
            accounts={accounts}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            direction={direction}
            setDirection={setDirection}
            handleExternalRequest={handleExternalRequest}
            handleInternalTransfer={handleInternalTransfer}
        />
      </div>

      {/* BOTTOM: HISTORY */}
      <TransactionHistory transactions={transactions} />
    </div>
  );
}