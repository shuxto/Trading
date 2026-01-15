import { useState } from 'react';
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
  X
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
  // REMOVED: onNavigateToPlatform (No longer needed here)
}

export default function ClientDashboard({ userEmail, balance, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'banking' | 'history' | 'kyc' | 'settings'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'accounts', label: 'Trading Accounts', icon: Briefcase },
    { id: 'banking', label: 'Banking', icon: Wallet },
    { id: 'history', label: 'Trade History', icon: History },
    { id: 'kyc', label: 'Verification', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': 
        // Overview now simply switches the tab to "Accounts"
        return <OverviewTab onNavigateToPlatform={() => setActiveTab('accounts')} />;
      case 'accounts': 
        // FIX: Removed 'onLaunch' prop. AccountsTab handles it internally now.
        return <AccountsTab globalBalance={balance} />;
      case 'banking': 
        return <BankingTab currentBalance={balance} />;
      case 'history': 
        return <HistoryTab />;
      case 'kyc': 
        return <VerificationTab />;
      case 'settings': 
        return <SettingsTab userEmail={userEmail} />;
      default: 
        return <OverviewTab onNavigateToPlatform={() => setActiveTab('accounts')} />;
    }
  };

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

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-[#21ce99] text-[#0b0e11] font-bold shadow-[0_0_15px_rgba(33,206,153,0.3)]' 
                  : 'text-[#8b9bb4] hover:bg-[#1e232d] hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-[#2a2e39] bg-[#151a21]">
          {/* Quick Launch Button -> Goes to Accounts Tab */}
          <button 
            onClick={() => setActiveTab('accounts')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F07000] to-[#ff8c00] hover:brightness-110 text-white font-bold py-3 rounded-xl mb-3 transition-all"
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
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-[#151a21] border-b border-[#2a2e39] flex items-center justify-between px-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#8b9bb4]">
            <Menu size={24} />
          </button>
          <span className="font-bold">Dashboard</span>
          <div className="w-6" /> {/* spacer */}
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