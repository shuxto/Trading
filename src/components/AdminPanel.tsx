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
  CreditCard 
} from 'lucide-react';

// COMPONENTS
import AdminOverviewTab from './admin/AdminOverviewTab';
import AdminBankingTab from './admin/AdminBankingTab';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminVerificationTab from './admin/AdminVerificationTab';
import GlassModal from './ui/GlassModal'; 

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  // 1. STATE & URL SYNC
  const [activeTab, setActiveTab] = useState<'overview' | 'banking' | 'users' | 'verification'>(() => {
      const params = new URLSearchParams(window.location.search);
      return (params.get('tab') as any) || 'overview';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, pendingDeposits: 0, totalVolume: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // 2. TRACK CURRENT ADMIN ROLE
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const [modal, setModal] = useState({
    isOpen: false, title: '', description: '', type: 'warning' as any, onConfirm: undefined as any, confirmText: 'Confirm', isLoading: false
  });

  useEffect(() => {
    fetchData();
    fetchCurrentUserRole(); 
    
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.pushState({}, '', url);
  }, [activeTab]);

  const fetchCurrentUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile) setCurrentUserRole(profile.role);
      }
  };

  const fetchData = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);

    // Fetch transactions with the performer's email
    const { data: txData } = await supabase
      .from('transactions')
      .select('*, performer:performed_by(email)') 
      .order('created_at', { ascending: false });

    if (txData) {
      const formattedTx = txData.map((t: any) => ({
         ...t,
         performed_by_email: t.performer?.email
      }));
      setTransactions(formattedTx);
    }

    if (usersData && txData) {
      const { data: accounts } = await supabase.from('trading_accounts').select('balance');
      const volume = accounts?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;
      setStats({
        totalUsers: usersData.length,
        pendingDeposits: txData.filter((t: any) => t.status === 'pending').length,
        totalVolume: volume
      });
    }
  };

  const confirmAction = (title: string, desc: string, type: 'warning' | 'danger' | 'success', action: () => Promise<void>) => {
    setModal({
      isOpen: true, title, description: desc, type, confirmText: 'Confirm', isLoading: false,
      onConfirm: async () => {
          setModal(prev => ({ ...prev, isLoading: true }));
          try {
            await action();
            setModal({ isOpen: true, title: 'Success', description: 'Operation successful.', type: 'success', confirmText: 'Done', isLoading: false, onConfirm: undefined });
            fetchData();
          } catch (error: any) {
            setModal({ isOpen: true, title: 'Error', description: error.message, type: 'danger', confirmText: 'Close', isLoading: false, onConfirm: undefined });
          }
      }
    });
  };

  // --- UPDATED: HANDLES ALL FUND TYPES INCLUDING REMOVE ---
  // Renamed transactionId to _transactionId to fix the unused variable error
  const handleManageFunds = async (userId: string, amount: number, type: 'deposit' | 'withdrawal' | 'bonus' | 'remove', _transactionId?: number, method?: string) => {
      
      let title = `Confirm ${type.toUpperCase()}`;
      let desc = `Are you sure you want to ${type} $${amount}?`;
      let alertType: 'warning' | 'danger' | 'success' = 'success';

      if (type === 'withdrawal') {
          alertType = 'warning';
          desc = `Withdraw $${amount} from Main Wallet? This will fail if funds are insufficient.`;
      } else if (type === 'remove') {
          alertType = 'danger';
          title = 'FORCE REMOVAL';
          desc = `⚠️ DANGER: This will remove $${amount} even if funds are insufficient (Balance will go negative). Proceed?`;
      }

      confirmAction(title, desc, alertType, async () => {
          // We pass positive amount, SQL handles subtraction based on type
          const { error } = await supabase.rpc('admin_adjust_balance', { 
            p_user_id: userId, 
            p_amount: amount, 
            p_type: type,
            p_method: method || 'System'
          });
          if (error) throw error;
      });
  };

  const handleVerifyUser = (userId: string) => {
    confirmAction("Verify User?", "Grant full access.", "success", async () => {
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
      onConfirm: async () => { await supabase.auth.signOut(); onLogout(); }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverviewTab stats={stats} />;
      
      case 'banking': return (
          <AdminBankingTab 
              users={users} 
              transactions={transactions} 
              onManageFunds={handleManageFunds}
              currentUserRole={currentUserRole} 
          />
      );

      case 'users': return <AdminUsersTab users={users} />;
      case 'verification': return <AdminVerificationTab users={users} onVerify={handleVerifyUser} onReject={handleRejectUser} />;
      default: return <AdminOverviewTab stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans flex overflow-hidden">
      <GlassModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} description={modal.description} type={modal.type} confirmText={modal.confirmText} isLoading={modal.isLoading} />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#151a21] border-r border-[#2a2e39] transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 border-b border-[#2a2e39] flex justify-between items-center">
          <div><h1 className="text-xl font-black text-[#F0B90B] tracking-wider">ADMIN<span className="text-white">PANEL</span></h1></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500"><X size={24}/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['overview', 'banking', 'verification', 'users'].map((tab) => (
             <button key={tab} onClick={() => { setActiveTab(tab as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all capitalize ${activeTab === tab ? 'bg-[#21ce99] text-black font-bold' : 'text-[#8b9bb4] hover:bg-[#1e232d]'}`}>
                {tab === 'overview' && <LayoutDashboard size={20} />}
                {tab === 'banking' && <CreditCard size={20} />}
                {tab === 'verification' && <ShieldCheck size={20} />}
                {tab === 'users' && <Users size={20} />}
                {tab}
             </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#2a2e39]">
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-2 text-[#f23645] px-4 py-2 hover:bg-[#f23645]/10 rounded-lg transition-colors"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="h-16 bg-[#151a21] border-b border-[#2a2e39] flex items-center justify-between px-6 shrink-0">
           <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-500"><Menu size={24}/></button>
           <h2 className="text-xl font-bold capitalize hidden md:block">{activeTab}</h2>
           <div className="flex items-center gap-2 bg-[#1e232d] px-3 py-1.5 rounded-lg border border-[#2a2e39] ml-auto">
             <ShieldAlert size={14} className="text-[#F0B90B]" />
             <span className="text-[10px] text-[#8b9bb4] uppercase font-bold tracking-wider">
                 {currentUserRole || 'Admin'}
             </span>
           </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}