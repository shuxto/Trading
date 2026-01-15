import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Briefcase, 
  Menu,
  X,
  Lock,
  Loader2 // <--- IMPORT THIS
} from 'lucide-react';
import OverviewTab from './OverviewTab';
import BankingTab from './BankingTab';
import HistoryTab from './HistoryTab';
import VerificationTab from './VerificationTab';
import SettingsTab from './SettingsTab';
import AccountsTab from './AccountsTab';

interface Props {
  userEmail: string;
  balance: number;
  onLogout: () => void;
}

export default function ClientDashboard({ userEmail, balance, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'banking' | 'history' | 'kyc' | 'settings'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [kycStatus, setKycStatus] = useState<string>('pending'); 
  const [loading, setLoading] = useState(true);

  // CHECK KYC STATUS ON LOAD
  useEffect(() => {
    const checkKyc = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
           .from('profiles')
           .select('kyc_status')
           .eq('id', user.id)
           .single();
        
        setKycStatus(profile?.kyc_status || 'pending');
      }
      setLoading(false);
    };
    checkKyc();
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, locked: false },
    { id: 'kyc', label: 'Verification', icon: ShieldCheck, locked: false },
    { id: 'accounts', label: 'Trading Accounts', icon: Briefcase, locked: true },
    { id: 'banking', label: 'Banking', icon: Wallet, locked: true },
    { id: 'history', label: 'Trade History', icon: History, locked: true },
    { id: 'settings', label: 'Settings', icon: Settings, locked: false },
  ];

  const handleTabChange = (tabId: string, isLocked: boolean) => {
    if (isLocked && kycStatus !== 'verified') {
        alert("🔒 RESTRICTED ACCESS: You must complete Verification (KYC) before you can trade or manage funds.");
        setActiveTab('kyc'); 
        return;
    }
    setActiveTab(tabId as any);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab onNavigateToPlatform={() => handleTabChange('accounts', true)} />;
      case 'accounts': return <AccountsTab globalBalance={balance} />;
      case 'banking': return <BankingTab currentBalance={balance} />;
      case 'history': return <HistoryTab />;
      case 'kyc': return <VerificationTab />;
      case 'settings': return <SettingsTab userEmail={userEmail} />;
      default: return <OverviewTab onNavigateToPlatform={() => handleTabChange('accounts', true)} />;
    }
  };

  // ✅ USE THE LOADING STATE (Fixes the error)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-[#21ce99]">
         <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans flex">
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#151a21] border-r border-[#2a2e39] transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-[#2a2e39] flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#21ce99] to-[#21ce99]/60 bg-clip-text text-transparent">
            TRADING CRM
          </h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[#8b9bb4]">
            <X size={24} />
          </button>
        </div>

        {/* KYC STATUS BADGE */}
        <div className="px-6 pt-4 pb-2">
            <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border flex items-center gap-2 justify-center ${
                kycStatus === 'verified' 
                ? 'bg-[#21ce99]/10 text-[#21ce99] border-[#21ce99]/30' 
                : 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/30'
            }`}>
               {kycStatus === 'verified' ? <ShieldCheck size={14}/> : <Lock size={14}/>}
               {kycStatus === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
            </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isItemLocked = item.locked && kycStatus !== 'verified';
            return (
                <button
                key={item.id}
                onClick={() => handleTabChange(item.id, item.locked)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                    ? 'bg-[#21ce99] text-[#0b0e11] font-bold shadow-[0_0_15px_rgba(33,206,153,0.3)]' 
                    : isItemLocked ? 'text-gray-600 cursor-not-allowed' : 'text-[#8b9bb4] hover:bg-[#1e232d] hover:text-white'
                }`}
                >
                <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {item.label}
                </div>
                {isItemLocked && <Lock size={14} />}
                </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-[#2a2e39] bg-[#151a21]">
          <button 
            onClick={() => handleTabChange('accounts', true)}
            disabled={kycStatus !== 'verified'}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F07000] to-[#ff8c00] hover:brightness-110 text-white font-bold py-3 rounded-xl mb-3 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            <TrendingUp size={20} />
            LAUNCH PLATFORM
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#f23645] hover:bg-[#f23645]/10 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden h-16 bg-[#151a21] border-b border-[#2a2e39] flex items-center justify-between px-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#8b9bb4]">
            <Menu size={24} />
          </button>
          <span className="font-bold">Dashboard</span>
          <div className="w-6" /> 
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}