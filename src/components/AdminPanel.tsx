import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  LogOut, 
  ShieldAlert,
  Menu,
  X,
  ShieldCheck 
} from 'lucide-react';

// COMPONENTS
import AdminOverviewTab from './admin/AdminOverviewTab';
import AdminBankingTab from './admin/AdminBankingTab';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminVerificationTab from './admin/AdminVerificationTab';
import GlassModal from './ui/GlassModal'; // ✅ IMPORT NEW MODAL

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'users' | 'verification'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState({ totalUsers: 0, pendingDeposits: 0, totalVolume: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // ✅ MODAL STATE
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    type: 'warning' as 'warning' | 'success' | 'danger',
    onConfirm: undefined as (() => void) | undefined,
    confirmText: 'Confirm'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*');
    if (usersData) setUsers(usersData);

    const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (txData) setTransactions(txData);

    if (usersData && txData) {
      setStats({
        totalUsers: usersData.length,
        pendingDeposits: txData.filter((t: any) => t.status === 'pending').length,
        totalVolume: txData.filter((t: any) => t.status === 'approved').reduce((acc: number, curr: any) => acc + curr.amount, 0)
      });
    }
  };

  // ✅ HELPER: Open Confirmation Modal
  const confirmAction = (title: string, desc: string, type: 'warning' | 'danger' | 'success', action: () => Promise<void>) => {
    setModal({
      isOpen: true,
      title,
      description: desc,
      type,
      confirmText: 'Confirm',
      onConfirm: async () => {
         await action();
         // Show Success Alert after action
         setModal({ 
            isOpen: true, 
            title: 'Success', 
            description: 'Operation completed successfully.', 
            type: 'success', 
            confirmText: 'Awesome',
            onConfirm: undefined // undefined means it's just an alert (no cancel button)
         });
         fetchData();
      }
    });
  };

  // --- ACTIONS (Now using Glass Modal) ---

  const handleApproveDeposit = (txnId: number) => {
    confirmAction(
      "Approve Deposit?", 
      "This will add funds to the user's balance immediately. Are you sure?", 
      "success",
      async () => {
        const { error } = await supabase.rpc('approve_deposit', { txn_id: txnId });
        if (error) throw error;
      }
    );
  };

  const handleRejectDeposit = (txnId: number) => {
    confirmAction(
      "Reject Transaction?", 
      "This will mark the transaction as rejected. The user will not receive funds.", 
      "danger",
      async () => {
        const { error } = await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txnId);
        if (error) throw error;
      }
    );
  };

  const handleVerifyUser = (userId: string) => {
    confirmAction(
      "Verify User Identity?", 
      "This user will be granted full access to trading and banking features.", 
      "success",
      async () => {
        const { error } = await supabase.from('profiles').update({ kyc_status: 'verified' }).eq('id', userId);
        if (error) throw error;
      }
    );
  };

  const handleRejectUser = (userId: string) => {
    confirmAction(
      "Reject User Verification?", 
      "This will mark the user's KYC as rejected. They will remain locked out of key features.", 
      "danger",
      async () => {
        const { error } = await supabase.from('profiles').update({ kyc_status: 'rejected' }).eq('id', userId);
        if (error) throw error;
      }
    );
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverviewTab stats={stats} />;
      case 'deposits': return <AdminBankingTab transactions={transactions} onApprove={handleApproveDeposit} onReject={handleRejectDeposit} />;
      case 'users':    return <AdminUsersTab users={users} />;
      case 'verification': return <AdminVerificationTab users={users} onVerify={handleVerifyUser} onReject={handleRejectUser} />;
      default:         return <AdminOverviewTab stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans flex">
      
      {/* ✅ RENDER THE GLASS MODAL */}
      <GlassModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        description={modal.description}
        type={modal.type}
        confirmText={modal.confirmText}
      />

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#151a21] border-r border-[#2a2e39] transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-[#2a2e39] flex justify-between items-center">
          <div>
             <h1 className="text-xl font-black text-[#F0B90B] tracking-wider">ADMIN<span className="text-white">PANEL</span></h1>
             <p className="text-xs text-[#5e6673] mt-1">Master Control</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500"><X size={24}/></button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
            <LayoutDashboard size={20} /> Overview
          </button>
          <button onClick={() => { setActiveTab('deposits'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deposits' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
            <Wallet size={20} /> Deposits
            {stats.pendingDeposits > 0 && <span className="ml-auto bg-[#f23645] text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{stats.pendingDeposits}</span>}
          </button>
          <button onClick={() => { setActiveTab('verification'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'verification' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
            <ShieldCheck size={20} /> Verify Accounts
          </button>
          <button onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#151a21] md:bg-transparent border-b border-[#2a2e39] md:border-none flex items-center justify-between px-4 md:px-8 md:pt-8 md:mb-4">
           <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-500"><Menu size={24}/></button>
           <h2 className="text-2xl font-bold capitalize hidden md:block">{activeTab}</h2>
           <div className="flex items-center gap-2 bg-[#1e232d] px-4 py-2 rounded-lg border border-[#2a2e39] ml-auto">
             <ShieldAlert size={16} className="text-[#F0B90B]" />
             <span className="text-xs text-[#8b9bb4]">Super Admin Access Active</span>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:px-8 md:pb-8">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}