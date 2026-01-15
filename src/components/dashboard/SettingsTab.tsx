import { User, Lock } from 'lucide-react'; // <-- Removed Mail

export default function SettingsTab({ userEmail }: { userEmail: string }) {
  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white">Account Settings</h2>
      
      <div className="bg-[#1e232d] p-8 rounded-2xl border border-[#2a2e39] space-y-6">
         
         <div className="flex items-center gap-4 border-b border-[#2a2e39] pb-6">
            <div className="w-16 h-16 rounded-full bg-[#2a303c] flex items-center justify-center text-[#8b9bb4]">
               <User size={32} />
            </div>
            <div>
               <h3 className="text-white font-bold">My Profile</h3>
               <p className="text-[#5e6673]">{userEmail}</p>
            </div>
         </div>

         {/* Change Password Placeholder */}
         <div>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
               <Lock size={16} className="text-[#21ce99]" /> Security
            </h4>
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-[#8b9bb4] uppercase font-bold">New Password</label>
                  <input type="password" className="w-full mt-1 bg-[#0b0e11] border border-[#2a2e39] rounded-lg p-3 text-white focus:border-[#21ce99] outline-none" placeholder="••••••••" />
               </div>
               <button className="bg-[#21ce99] text-[#0b0e11] font-bold px-6 py-2 rounded-lg hover:bg-[#1db586]">
                  Update Password
               </button>
            </div>
         </div>

      </div>
    </div>
  );
}