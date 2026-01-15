import { Users, Wallet, TrendingUp } from 'lucide-react';

interface Stats {
  totalUsers: number;
  pendingDeposits: number;
  totalVolume: number;
}

export default function AdminOverviewTab({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
           <Users size={64} />
        </div>
        <div className="text-[#8b9bb4] text-xs font-bold uppercase mb-2">Total Users</div>
        <div className="text-4xl font-mono font-bold text-white">{stats.totalUsers}</div>
      </div>
      
      <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
           <Wallet size={64} />
        </div>
        <div className="text-[#8b9bb4] text-xs font-bold uppercase mb-2">Pending Requests</div>
        <div className="text-4xl font-mono font-bold text-[#F0B90B]">{stats.pendingDeposits}</div>
      </div>
      
      <div className="bg-[#1e232d] p-6 rounded-2xl border border-[#2a2e39] relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
           <TrendingUp size={64} />
        </div>
        <div className="text-[#8b9bb4] text-xs font-bold uppercase mb-2">Total Volume</div>
        <div className="text-4xl font-mono font-bold text-[#21ce99]">${stats.totalVolume.toLocaleString()}</div>
      </div>
    </div>
  );
}