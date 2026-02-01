import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Wallet, History, ShieldCheck, Settings, LogOut, 
  Briefcase, Menu, X, Lock, Loader2, Cpu, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

import OverviewTab from './OverviewTab';
import BankingTab from './BankingTab';
import AccountsTab from './AccountsTab';
import HistoryTab from './HistoryTab';
import VerificationTab from './VerificationTab';
import SettingsTab from './SettingsTab';

interface Props {
  userEmail: string;
  onLogout: () => void;
}

export default function ClientDashboard({ userEmail, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'banking' | 'history' | 'kyc' | 'settings'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [kycStatus, setKycStatus] = useState<string>('pending'); 
  const [tier, setTier] = useState<string>('Basic'); // 🟢 NEW: Store Tier
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  // CHECK KYC & TIER ON LOAD
  useEffect(() => {
    const checkUserdata = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
           .from('profiles')
           .select('kyc_status, tier') // 🟢 Fetch Tier too
           .eq('id', user.id)
           .single();
        
        setKycStatus(profile?.kyc_status || 'unverified');
        setTier(profile?.tier || 'Basic'); // 🟢 Set Tier
      }
      setLoading(false);
    };
    checkUserdata();
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard, locked: false },
    { id: 'kyc', label: 'Identity Core', icon: ShieldCheck, locked: false },
    { id: 'accounts', label: 'Trading Units', icon: Briefcase, locked: true },
    { id: 'banking', label: 'Vault & Assets', icon: Wallet, locked: true },
    { id: 'history', label: 'Data Logs', icon: History, locked: true },
    { id: 'settings', label: 'System Config', icon: Settings, locked: false },
  ];

  const handleTabChange = (tabId: string, isLocked: boolean) => {
    if (isLocked && kycStatus !== 'verified') {
        alert("🔒 RESTRICTED ACCESS: Identity Verification Required.");
        setActiveTab('kyc'); 
        return;
    }
    setActiveTab(tabId as any);
    setIsMobileMenuOpen(false);
  };

  const handleQuickLaunch = async () => {
      setLaunching(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data: accounts } = await supabase
                  .from('trading_accounts')
                  .select('id')
                  .eq('user_id', user.id)
                  .order('created_at', { ascending: true })
                  .limit(1);

              if (accounts && accounts.length > 0) {
                  window.location.href = `?mode=trading&account_id=${accounts[0].id}`;
              } else {
                  alert("⚠️ No trading unit found. Please create one first.");
                  handleTabChange('accounts', true);
              }
          }
      } catch (e) {
          console.error("Launch Error:", e);
          handleTabChange('accounts', true);
      }
      setLaunching(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': 
        return <OverviewTab onNavigateToPlatform={handleQuickLaunch} isLocked={kycStatus !== 'verified'} />;
      case 'accounts': return <AccountsTab />;
      case 'banking': return <BankingTab />;
      case 'history': return <HistoryTab />;
      case 'kyc': return <VerificationTab />;
      case 'settings': return <SettingsTab userEmail={userEmail} />;
      default: return <OverviewTab onNavigateToPlatform={handleQuickLaunch} isLocked={kycStatus !== 'verified'} />;
    }
  };

  // 🟢 Helper to determine Tier Color
  // Added 'Diamond' to the list
  const isPremium = tier === 'Gold' || tier === 'Platinum' || tier === 'Diamond';
  const tierColor = isPremium ? 'text-[#F0B90B]' : 'text-[#21ce99]';
  const tierBorder = isPremium ? 'bg-[#F0B90B]/5 border-[#F0B90B]/20' : 'bg-[#21ce99]/5 border-[#21ce99]/20';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-[#21ce99]">
         <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white font-sans flex overflow-hidden relative selection:bg-[#21ce99] selection:text-black"> 
      
      {/* BACKGROUND ATMOSPHERE */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#151a21] via-[#0b0e11] to-[#000000] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#21ce99 1px, transparent 1px), linear-gradient(90deg, #21ce99 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#151a21]/80 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
      `}>
        {/* Logo Area */}
        <div className="p-8 border-b border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#21ce99]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-3">
             <div className="h-10 w-10 bg-[#21ce99] rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(33,206,153,0.5)]">
                <Cpu size={24} />
             </div>
             <div>
                <h1 className="text-lg font-black tracking-wider text-white">VOIDNET</h1>
                <p className="text-[10px] text-[#21ce99] font-mono tracking-widest uppercase">Terminal v7.4</p>
             </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-8 right-6 text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* 🟢 TIER STATUS BADGE (Fixed for Performance) */}
        <div className="px-6 py-6">
            <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-500 ${tierBorder}`}>
               <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Tier</span>
                   <ShieldCheck size={16} className={tierColor} />
               </div>
               <div className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${tierColor}`}>
                   {tier} MEMBERSHIP
               </div>
               {/* ❌ REMOVED: High GPU Usage Animation */}
            </div>
        </div>

        {/* NAVIGATION */}
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const isLocked = item.locked && kycStatus !== 'verified';
            
            return (
                <button
                key={item.id}
                onClick={() => handleTabChange(item.id, item.locked)}
                disabled={isLocked}
                className={`relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group overflow-hidden ${
                    isActive 
                    ? 'text-[#0b0e11] font-bold' 
                    : isLocked 
                        ? 'text-gray-600 cursor-not-allowed opacity-50' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                >
                {/* Active Background Pill */}
                {isActive && (
                    <motion.div 
                        layoutId="activeNav"
                        className="absolute inset-0 bg-[#21ce99] shadow-[0_0_20px_rgba(33,206,153,0.4)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}

                <div className="relative z-10 flex items-center gap-3">
                    <item.icon size={18} className={isActive ? 'text-black' : isLocked ? 'text-gray-600' : 'text-[#21ce99]'} />
                    <span className="tracking-wide text-sm">{item.label}</span>
                </div>

                {isLocked && <Lock size={12} className="ml-auto relative z-10" />}
                </button>
            )
          })}
        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md space-y-3">
          <button 
            onClick={handleQuickLaunch}
            disabled={kycStatus !== 'verified' || launching}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-[#F07000] to-[#ff8c00] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-lg hover:shadow-[#F07000]/20"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center justify-center gap-2">
                {launching ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18} className="fill-current" />}
                <span className="uppercase tracking-widest text-xs">
                    {launching ? 'INITIALIZING...' : 'Launch Terminal'}
                </span>
            </div>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[#f23645] hover:bg-[#f23645]/10 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        <header className="md:hidden h-16 bg-[#151a21]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-40">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="font-black text-[#21ce99] tracking-widest">NEXUS</span>
          <div className="w-6" /> 
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
              {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}