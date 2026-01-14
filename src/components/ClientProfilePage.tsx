import { ArrowLeft, User, Shield, Mail, Settings, LogOut } from 'lucide-react';

interface Props {
  onBack: () => void;
  email?: string;
}

export default function ClientProfilePage({ onBack, email }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e11] text-white overflow-y-auto animate-in fade-in slide-in-from-right-10">
      
      {/* Navbar for Profile Page */}
      <div className="h-16 border-b border-[#2a2e39] flex items-center px-6 gap-4 bg-[#151a21]">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-[#2a303c] rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-[#8b9bb4]" />
        </button>
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-8">
        
        {/* User Card */}
        <div className="bg-[#151a21] border border-[#2a2e39] rounded-2xl p-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#2a303c] flex items-center justify-center border-2 border-[#2a2e39]">
            <User size={48} className="text-[#5e6673]" />
          </div>
          <div>
             <h2 className="text-2xl font-bold text-white">Trading Client</h2>
             <div className="flex items-center gap-2 text-[#8b9bb4] mt-1">
                <Mail size={14} />
                <span>{email || 'user@example.com'}</span>
             </div>
             <div className="flex items-center gap-2 text-[#21ce99] mt-3 bg-[#21ce99]/10 px-3 py-1 rounded-full w-fit text-xs font-bold uppercase tracking-wider">
                <Shield size={12} /> Verified Account
             </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-6 bg-[#191f2e] border border-[#2a2e39] rounded-xl hover:border-[#21ce99] transition-colors cursor-pointer group">
              <Settings size={24} className="text-[#5e6673] group-hover:text-white mb-4" />
              <h3 className="font-bold text-lg">Account Settings</h3>
              <p className="text-sm text-[#5e6673] mt-2">Manage your password, email, and security preferences.</p>
           </div>
           
           <div className="p-6 bg-[#191f2e] border border-[#2a2e39] rounded-xl hover:border-[#f23645] transition-colors cursor-pointer group">
              <LogOut size={24} className="text-[#5e6673] group-hover:text-[#f23645] mb-4" />
              <h3 className="font-bold text-lg group-hover:text-[#f23645]">Sign Out</h3>
              <p className="text-sm text-[#5e6673] mt-2">Log out of your trading session securely.</p>
           </div>
        </div>

      </div>
    </div>
  );
}