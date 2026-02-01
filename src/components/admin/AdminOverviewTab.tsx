import { Users, TrendingUp, Activity, Server, ShieldCheck, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number;
  pendingVerification: number; // 🟢 Changed from pendingDeposits
  totalVolume: number;
  totalStaff: number;         // 🟢 New stat
}

export default function AdminOverviewTab({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500">
      
      {/* 🟢 1. HEADER SECTION */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-white tracking-tight">System Overview</h2>
        <p className="text-gray-500 text-sm font-medium">Real-time platform metrics and node performance.</p>
      </div>

      {/* 🟢 2. MAIN STATS GRID (Now 4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: CLIENT DATABASE */}
        <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-lg">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
             <Users size={60} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                   <Users size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Database</span>
             </div>
             <div>
                <div className="text-3xl font-mono font-black text-white tracking-tighter">{stats.totalUsers}</div>
                <div className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Active User Nodes</div>
             </div>
          </div>
        </div>

        {/* CARD 2: TOTAL STAFF (New) */}
        <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-lg">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
             <ShieldCheck size={60} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                   <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Staff Members</span>
             </div>
             <div>
                <div className="text-3xl font-mono font-black text-white tracking-tighter">{stats.totalStaff}</div>
                <div className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Admin/Staff Accounts</div>
             </div>
          </div>
        </div>
        
        {/* CARD 3: PENDING VERIFICATION */}
        <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group hover:border-[#F0B90B]/50 transition-all shadow-lg">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
             <Clock size={60} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#F0B90B]/10 rounded-xl border border-[#F0B90B]/20 text-[#F0B90B]">
                   <Clock size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Verification</span>
             </div>
             <div>
                <div className="text-3xl font-mono font-black text-[#F0B90B] tracking-tighter">{stats.pendingVerification}</div>
                <div className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Awaiting KYC Review</div>
             </div>
          </div>
        </div>
        
        {/* CARD 4: TOTAL ASSET VOLUME */}
        <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group hover:border-[#21ce99]/50 transition-all shadow-lg">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
             <TrendingUp size={60} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#21ce99]/10 rounded-xl border border-[#21ce99]/20 text-[#21ce99]">
                   <Activity size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Asset Volume</span>
             </div>
             <div>
                <div className="text-3xl font-mono font-black text-[#21ce99] tracking-tighter">${stats.totalVolume.toLocaleString()}</div>
                <div className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Total Platform Balance</div>
             </div>
          </div>
        </div>
      </div>

      {/* 🟢 3. SYSTEM HEALTH ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-[#151a21] border border-[#2a2e39] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                      <Server size={20} />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-white">System Operational</h4>
                      <p className="text-xs text-gray-500">All gateway services active</p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold text-green-500">ONLINE</span>
              </div>
          </div>

          <div className="bg-[#151a21] border border-[#2a2e39] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                      <ShieldCheck size={20} />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-white">Security Protocol</h4>
                      <p className="text-xs text-gray-500">AES-256 Node Encryption</p>
                  </div>
              </div>
              <div className="text-xs font-bold text-purple-500 border border-purple-500/30 px-2 py-1 rounded bg-purple-500/10">
                  ACTIVE
              </div>
          </div>
      </div>

    </div>
  );
}