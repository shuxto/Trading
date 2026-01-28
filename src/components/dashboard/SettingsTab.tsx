import { User, Lock, Shield, Key, Save } from 'lucide-react';

export default function SettingsTab({ userEmail }: { userEmail: string }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-10 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#21ce99]/10 rounded-xl border border-[#21ce99]/20 text-[#21ce99] shadow-[0_0_15px_rgba(33,206,153,0.2)]">
              <User size={24} />
          </div>
          <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-wide">System Config</h2>
              <p className="text-xs text-[#8b9bb4] font-mono tracking-wider">USER PROFILE & SECURITY PROTOCOLS</p>
          </div>
      </div>
      
      {/* PROFILE CARD */}
      <div className="relative group">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-[#21ce99] to-blue-600 rounded-[22px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
         <div className="relative bg-[#151a21] p-8 rounded-[20px] border border-white/10 flex items-center gap-6 overflow-hidden">
             {/* Background Tech Pattern */}
             <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#21ce99]/5 to-transparent skew-x-12 opacity-50 pointer-events-none" />
             
             <div className="relative z-10 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#2a303c] to-[#0b0e11] border border-white/10 flex items-center justify-center shadow-2xl">
                <User size={32} className="text-[#21ce99]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#21ce99] rounded-full border-2 border-[#151a21]" />
             </div>
             
             <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-1">Operative Profile</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#5e6673] uppercase tracking-widest">ID:</span>
                    <p className="text-sm text-[#21ce99] font-mono bg-[#21ce99]/10 px-2 py-0.5 rounded border border-[#21ce99]/20">{userEmail}</p>
                </div>
             </div>
         </div>
      </div>

      {/* SECURITY CARD */}
      <div className="bg-[#151a21] p-8 rounded-[20px] border border-white/10 relative overflow-hidden shadow-xl">
         <div className="absolute top-0 left-0 w-1 h-full bg-[#F0B90B]" />
         
         <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
            <Shield size={20} className="text-[#F0B90B]" />
            <h4 className="text-lg font-bold text-white uppercase tracking-wider">Security Clearance</h4>
         </div>

         <div className="space-y-6">
            <div className="group">
               <label className="flex items-center gap-2 text-[10px] text-[#8b9bb4] uppercase font-bold tracking-widest mb-2">
                  <Key size={12} /> New Access Key
               </label>
               <div className="relative">
                   <input 
                     type="password" 
                     className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl p-4 text-white font-mono focus:border-[#F0B90B] focus:shadow-[0_0_15px_rgba(240,185,11,0.1)] outline-none transition-all placeholder-gray-700" 
                     placeholder="ENTER NEW PASSWORD..." 
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F0B90B] opacity-0 group-focus-within:opacity-100 transition-opacity">
                       <Lock size={16} />
                   </div>
               </div>
            </div>

            <button className="w-full bg-gradient-to-r from-[#21ce99] to-[#1db586] hover:brightness-110 text-[#0b0e11] font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-[#21ce99]/20">
               <Save size={16} />
               Update Credentials
            </button>
         </div>
      </div>

    </div>
  );
}