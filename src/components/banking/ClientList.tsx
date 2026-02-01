import { useState } from 'react';
import { Search, ChevronRight, AlertTriangle, Filter, User, Crown } from 'lucide-react';

interface ClientListProps {
  users: any[];
  transactions: any[];
  onSelectUser: (user: any) => void;
}

export default function ClientList({ users = [], transactions = [], onSelectUser }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // SAFEGUARD: Ensure users is an array
  const safeUsers = Array.isArray(users) ? users : [];

  // 1. FILTER: Exclude Staff/Admins
  const clientUsers = safeUsers.filter(u => 
      u.tier !== 'Staff' && 
      u.tier !== 'Admin' && 
      u.role !== 'admin' &&
      u.role !== 'compliance'
  );

  // 2. ENRICH: Attach pending status
  const enrichedUsers = clientUsers.map(user => {
      const hasPending = transactions.some(t => t.user_id === user.id && t.status === 'pending');
      return { ...user, hasPending };
  });

  // 3. SORT: Pending First -> Then by Tier Value (Optional) -> Then Name
  const filteredUsers = enrichedUsers
      .filter(u => 
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (u.real_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (u.id || '').includes(searchTerm)
      )
      .sort((a, b) => {
          // Priority 1: Pending Transactions
          if (a.hasPending !== b.hasPending) return a.hasPending ? -1 : 1;
          // Priority 2: Newest Users first (optional, using ID or created_at if avail)
          return 0; 
      });

  // 🟢 HELPER: Get Tier Color
  const getTierStyle = (tier: string) => {
      switch (tier) {
          case 'Diamond': return 'text-cyan-400 border-cyan-400 bg-cyan-400/10';
          case 'Platinum': return 'text-slate-300 border-slate-300 bg-slate-300/10';
          case 'Gold': return 'text-[#F0B90B] border-[#F0B90B] bg-[#F0B90B]/10';
          case 'Silver': return 'text-gray-300 border-gray-400 bg-white/5';
          default: return 'text-[#21ce99] border-[#21ce99] bg-[#21ce99]/10'; // Basic
      }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#151a21] rounded-2xl border border-[#2a2e39] overflow-hidden min-h-0 shadow-2xl">
        
        {/* TOP BAR */}
        <div className="p-4 border-b border-[#2a2e39] bg-[#151a21] flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
            <div className="relative group w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-500 group-focus-within:text-[#21ce99] transition-colors" />
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Name, Email or ID..." 
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#0b0e11] border border-[#2a2e39] rounded-xl text-xs font-bold text-white placeholder-gray-600 focus:outline-none focus:border-[#21ce99]/50 focus:ring-1 focus:ring-[#21ce99]/20 transition-all"
                />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-[#0b0e11] px-3 py-1.5 rounded-lg border border-[#2a2e39]">
                <Filter size={10} /> 
                <span>Total: <span className="text-white">{filteredUsers.length}</span></span>
            </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0e11]/50">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#151a21] sticky top-0 z-10 text-[9px] uppercase font-black text-gray-500 tracking-widest shadow-sm">
                    <tr>
                        <th className="p-4 pl-6 w-[40%]">Client Profile</th>
                        <th className="p-4 w-[20%]">Tier / Status</th>
                        <th className="p-4 text-right w-[20%]">Equity</th>
                        <th className="p-4 text-center w-[10%]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]/50 text-sm">
                    {filteredUsers.map(user => {
                        const tierStyle = getTierStyle(user.tier);
                        
                        return (
                            <tr 
                                key={user.id} 
                                onClick={() => onSelectUser(user)}
                                className="group hover:bg-[#1e232d] transition-all cursor-pointer border-l-2 border-transparent hover:border-[#21ce99]"
                            >
                                {/* CLIENT INFO */}
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar with Dynamic Tier Border */}
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black border-2 shadow-lg ${user.hasPending ? 'bg-[#f23645] border-[#f23645] text-white animate-pulse' : tierStyle}`}>
                                            {user.hasPending ? <AlertTriangle size={18} /> : (user.real_name ? user.real_name.charAt(0).toUpperCase() : <User size={18} />)}
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            {/* Name & ID */}
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white group-hover:text-[#21ce99] transition-colors text-sm">
                                                    {user.real_name || 'No Name Set'}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0b0e11] text-gray-500 font-mono border border-white/5">
                                                    {user.id.slice(0,6)}
                                                </span>
                                            </div>
                                            {/* Email */}
                                            <span className="text-xs text-gray-500 font-medium">{user.email}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* STATUS */}
                                <td className="p-4">
                                    {user.hasPending ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#f23645] animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Action Req.</span>
                                        </div>
                                    ) : (
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider w-fit ${tierStyle.replace('text-', 'text-opacity-90 ')}`}>
                                            <Crown size={12} />
                                            {user.tier || 'Standard'}
                                        </div>
                                    )}
                                </td>

                                {/* EQUITY */}
                                <td className="p-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-mono font-bold text-white text-sm tracking-tight">
                                            ${(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        {user.hasPending && <span className="text-[9px] text-[#f23645] font-bold">Pending Tx</span>}
                                    </div>
                                </td>

                                {/* ARROW */}
                                <td className="p-4 text-center">
                                    <div className="h-8 w-8 rounded-full bg-[#0b0e11] border border-[#2a2e39] flex items-center justify-center group-hover:border-[#21ce99] group-hover:bg-[#21ce99] transition-all">
                                        <ChevronRight size={14} className="text-gray-500 group-hover:text-black" />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {/* EMPTY STATE */}
            {filteredUsers.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-gray-600 gap-3">
                    <Search size={32} className="opacity-20" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">No clients found</span>
                </div>
            )}
        </div>
    </div>
  );
}