import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  ShieldAlert,
  Menu,
  X,
  ShieldCheck,
  CreditCard // Added for Banking Icon
} from 'lucide-react';

// COMPONENTS
import AdminOverviewTab from './admin/AdminOverviewTab';
import AdminBankingTab from './admin/AdminBankingTab'; // The New Component
import AdminUsersTab from './admin/AdminUsersTab';
import AdminVerificationTab from './admin/AdminVerificationTab';
import GlassModal from './ui/GlassModal'; 

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  // Renamed 'deposits' to 'banking' to match new logic
  const [activeTab, setActiveTab] = useState<'overview' | 'banking' | 'users' | 'verification'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState({ totalUsers: 0, pendingDeposits: 0, totalVolume: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // MODAL STATE
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    type: 'warning' as 'warning' | 'success' | 'danger',
    onConfirm: undefined as (() => void) | undefined,
    confirmText: 'Confirm',
    isLoading: false
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    // 1. Get Users
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);

    // 2. Get Transactions
    const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (txData) setTransactions(txData);

    // 3. Stats
    if (usersData && txData) {
      // Calculate total volume (sum of all balances)
      const { data: accounts } = await supabase.from('trading_accounts').select('balance');
      const volume = accounts?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;

      setStats({
        totalUsers: usersData.length,
        pendingDeposits: txData.filter((t: any) => t.status === 'pending').length,
        totalVolume: volume
      });
    }
  };

  // HELPER: Open Confirmation Modal
  const confirmAction = (title: string, desc: string, type: 'warning' | 'danger' | 'success', action: () => Promise<void>) => {
    setModal({
      isOpen: true,
      title,
      description: desc,
      type,
      confirmText: 'Confirm',
      isLoading: false,
      onConfirm: async () => {
          setModal(prev => ({ ...prev, isLoading: true }));
          try {
            await action();
            setModal({ 
              isOpen: true, title: 'Success', description: 'Operation successful.', 
              type: 'success', confirmText: 'Done', isLoading: false, onConfirm: undefined 
            });
            fetchData();
          } catch (error: any) {
            console.error("Action Failed:", error);
            setModal({ 
              isOpen: true, title: 'Error', description: error.message, 
              type: 'danger', confirmText: 'Close', isLoading: false, onConfirm: undefined 
            });
          }
      }
    });
  };

  // --- NEW: HANDLE FUNDS (Deposit / Withdraw / Bonus) ---
  const handleManageFunds = async (userId: string, amount: number, type: 'deposit' | 'withdrawal' | 'bonus') => {
      confirmAction(
          `Confirm ${type.toUpperCase()}?`, 
          `Are you sure you want to ${type} $${amount} for this user?`, 
          type === 'withdrawal' ? 'warning' : 'success', 
          async () => {
              // 1. Calculate Adjustment (Withdrawal = Negative)
              const adjustment = type === 'withdrawal' ? -amount : amount;

              // 2. Call SQL Function
              const { error } = await supabase.rpc('admin_adjust_balance', {
                  p_user_id: userId,
                  p_amount: adjustment,
                  p_type: type
              });

              if (error) throw error;
          }
      );
  };

  // --- USER VERIFICATION ACTIONS ---
  const handleVerifyUser = (userId: string) => {
    confirmAction("Verify User?", "Grant full access to this user.", "success", async () => {
        const { error } = await supabase.from('profiles').update({ kyc_status: 'verified' }).eq('id', userId);
        if (error) throw error;
    });
  };

  const handleRejectUser = (userId: string) => {
    confirmAction("Reject User?", "Mark KYC as rejected.", "danger", async () => {
        const { error } = await supabase.from('profiles').update({ kyc_status: 'rejected' }).eq('id', userId);
        if (error) throw error;
    });
  };

  const handleLogoutClick = () => {
    setModal({
      isOpen: true, title: "Sign Out", description: "End session?", type: "warning", confirmText: "Sign Out", isLoading: false,
      onConfirm: async () => {
        await supabase.auth.signOut();
        onLogout();
      }
    });
  };

  // --- RENDER CONTENT SWITCHER ---
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverviewTab stats={stats} />;
      
      // 🚀 FIXED: Now passing the correct props to the new Banking Tab
      case 'banking': return (
        <AdminBankingTab 
            users={users} 
            transactions={transactions} 
            onManageFunds={handleManageFunds} 
        />
      );

      case 'users': return <AdminUsersTab users={users} />;
      case 'verification': return <AdminVerificationTab users={users} onVerify={handleVerifyUser} onReject={handleRejectUser} />;
      default: return <AdminOverviewTab stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans flex">
      <GlassModal 
        isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm} title={modal.title} description={modal.description}
        type={modal.type} confirmText={modal.confirmText} isLoading={modal.isLoading}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#151a21] border-r border-[#2a2e39] transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
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
          <button onClick={() => { setActiveTab('banking'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'banking' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
            <CreditCard size={20} /> Banking & Funds
          </button>
          <button onClick={() => { setActiveTab('verification'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'verification' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
            <ShieldCheck size={20} /> Verify Accounts
          </button>
          <button onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
            <Users size={20} /> Users
          </button>
        </nav>
        <div className="p-4 border-t border-[#2a2e39]">
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-2 text-[#f23645] px-4 py-2 hover:bg-[#f23645]/10 rounded-lg transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#151a21] md:bg-transparent border-b border-[#2a2e39] md:border-none flex items-center justify-between px-4 md:px-8 md:pt-8 md:mb-4">
           <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-500"><Menu size={24}/></button>
           <h2 className="text-2xl font-bold capitalize hidden md:block">{activeTab === 'banking' ? 'Funds Management' : activeTab}</h2>
           <div className="flex items-center gap-2 bg-[#1e232d] px-4 py-2 rounded-lg border border-[#2a2e39] ml-auto">
             <ShieldAlert size={16} className="text-[#F0B90B]" />
             <span className="text-xs text-[#8b9bb4]">Super Admin Access</span>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:px-8 md:pb-8">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}