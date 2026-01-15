import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert
} from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'users'>('overview');
  const [stats, setStats] = useState({ totalUsers: 0, pendingDeposits: 0, totalVolume: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  // REMOVED: Unused 'loading' state to fix error

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    // 1. Fetch Stats & Users
    const { data: usersData } = await supabase.from('profiles').select('*');
    const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    
    if (usersData) setUsers(usersData);
    if (txData) setTransactions(txData);

    // Calculate Stats
    if (usersData && txData) {
      setStats({
        totalUsers: usersData.length,
        pendingDeposits: txData.filter((t: any) => t.status === 'pending').length,
        totalVolume: txData.filter((t: any) => t.status === 'approved').reduce((acc: number, curr: any) => acc + curr.amount, 0)
      });
    }
  };

  // --- ACTIONS ---

  const handleApproveDeposit = async (txnId: number) => {
    const confirm = window.confirm("Are you sure you want to APPROVE this deposit? Money will be added to user balance.");
    if (!confirm) return;

    // Call the Secure Database Function we created
    const { error } = await supabase.rpc('approve_deposit', { txn_id: txnId });

    if (error) {
      alert("Error approving: " + error.message);
    } else {
      alert("Deposit Approved! Balance updated.");
      fetchData(); // Refresh list
    }
  };

  const handleRejectDeposit = async (txnId: number) => {
    const confirm = window.confirm("Reject this transaction?");
    if (!confirm) return;

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', txnId);

    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#151a21] border-r border-[#2a2e39] flex flex-col">
        <div className="p-6 border-b border-[#2a2e39]">
          <h1 className="text-xl font-black text-[#F0B90B] tracking-wider">ADMIN<span className="text-white">PANEL</span></h1>
          <p className="text-xs text-[#5e6673] mt-1">Master Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}
          >
            <LayoutDashboard size={20} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deposits' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}
          >
            <Wallet size={20} /> 
            Deposits
            {stats.pendingDeposits > 0 && (
              <span className="ml-auto bg-[#f23645] text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{stats.pendingDeposits}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}
          >
            <Users size={20} /> Users
          </button>
        </nav>

        <div className="p-4 border-t border-[#2a2e39]">
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-[#f23645] px-4 py-2 hover:bg-[#f23645]/10 rounded-lg transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-2 bg-[#1e232d] px-4 py-2 rounded-lg border border-[#2a2e39]">
            <ShieldAlert size={16} className="text-[#F0B90B]" />
            <span className="text-xs text-[#8b9bb4]">Super Admin Access Active</span>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39]">
              <div className="text-[#8b9bb4] text-xs font-bold uppercase mb-2">Total Users</div>
              <div className="text-4xl font-mono font-bold">{stats.totalUsers}</div>
            </div>
            <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39]">
              <div className="text-[#8b9bb4] text-xs font-bold uppercase mb-2">Pending Requests</div>
              <div className="text-4xl font-mono font-bold text-[#F0B90B]">{stats.pendingDeposits}</div>
            </div>
            <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39]">
              <div className="text-[#8b9bb4] text-xs font-bold uppercase mb-2">Total Volume</div>
              <div className="text-4xl font-mono font-bold text-[#21ce99]">${stats.totalVolume.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* DEPOSITS TAB */}
        {activeTab === 'deposits' && (
          <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#151a21] text-[#8b9bb4]">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">User ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#252a36]">
                    <td className="p-4 text-[#5e6673]">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-xs text-[#8b9bb4]">{tx.user_id.slice(0, 8)}...</td>
                    <td className="p-4 flex items-center gap-2">
                      {tx.type === 'deposit' ? <ArrowDownLeft size={16} className="text-[#21ce99]" /> : <ArrowUpRight size={16} className="text-[#f23645]" />}
                      <span className="capitalize">{tx.type}</span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold">${tx.amount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        tx.status === 'approved' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 
                        tx.status === 'rejected' ? 'bg-[#f23645]/20 text-[#f23645]' : 'bg-[#F0B90B]/20 text-[#F0B90B]'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {tx.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleApproveDeposit(tx.id)}
                            className="p-2 bg-[#21ce99]/10 text-[#21ce99] hover:bg-[#21ce99] hover:text-black rounded transition-colors" title="Approve">
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectDeposit(tx.id)}
                            className="p-2 bg-[#f23645]/10 text-[#f23645] hover:bg-[#f23645] hover:text-white rounded transition-colors" title="Reject">
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-2 bg-[#1e232d] p-3 rounded-xl border border-[#2a2e39] w-full md:w-96 mb-4">
              <Search size={18} className="text-[#8b9bb4]" />
              <input type="text" placeholder="Search user by ID or Email..." className="bg-transparent outline-none text-white w-full" />
            </div>

            <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#151a21] text-[#8b9bb4]">
                  <tr>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Balance</th>
                    <th className="p-4 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-[#252a36]">
                      <td className="p-4 font-mono text-xs text-[#8b9bb4]">{user.id}</td>
                      <td className="p-4 uppercase text-xs font-bold">{user.role}</td>
                      <td className="p-4 text-right font-mono font-bold text-[#21ce99]">
                        ${user.balance?.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-[#5e6673]">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}