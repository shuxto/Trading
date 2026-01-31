import { useState } from 'react';
import { Search, ChevronRight, AlertTriangle, Filter } from 'lucide-react';

interface ClientListProps {
  users: any[];
  transactions: any[];
  onSelectUser: (user: any) => void;
}

export default function ClientList({ users, transactions, onSelectUser }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. FILTER: Exclude Staff/Admins
  const clientUsers = users.filter(u => 
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

  // 3. SORT: Pending First
  const filteredUsers = enrichedUsers
      .filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.includes(searchTerm))
      .sort((a, b) => (b.hasPending === a.hasPending ? 0 : b.hasPending ? 1 : -1));

  return (
    <div className="flex flex-col h-[600px] bg-[#1e232d] rounded-2xl border border-[#2a2e39] overflow-hidden">
        
        {/* TOP BAR */}
        <div className="p-4 border-b border-[#2a2e39] bg-[#151a21] flex justify-between items-center">
            <div className="flex items-center gap-3 bg-[#1e232d] px-4 py-2.5 rounded-xl border border-[#2a2e39] w-96 transition-all focus-within:border-[#21ce99]/50">
                <Search size={16} className="text-[#8b9bb4]" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Client Database..." 
                    className="bg-transparent outline-none text-white w-full placeholder-gray-600 text-sm font-bold"
                />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <Filter size={14} /> Showing {filteredUsers.length} Clients
            </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#151a21] sticky top-0 z-10 text-[10px] uppercase font-bold text-[#8b9bb4] tracking-widest">
                    <tr>
                        <th className="p-4 pl-6">Client Identity</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Balance</th>
                        <th className="p-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39] text-sm">
                    {filteredUsers.map(user => (
                        <tr 
                            key={user.id} 
                            onClick={() => onSelectUser(user)}
                            className="group hover:bg-[#2a2e39]/60 transition-colors cursor-pointer"
                        >
                            <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner ${user.hasPending ? 'bg-[#f23645] text-white' : 'bg-[#2a303c] text-white'}`}>
                                        {user.hasPending ? <AlertTriangle size={20} /> : user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white group-hover:text-[#21ce99] transition-colors">{user.email}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">ID: {user.id.slice(0,8)}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                {user.hasPending ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                        Requesting Action
                                    </span>
                                ) : (
                                    <span className="text-gray-500 text-xs font-mono">{user.tier || 'Standard'}</span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                <div className="font-mono font-bold text-white">${(user.balance || 0).toLocaleString()}</div>
                            </td>
                            <td className="p-4 text-center">
                                <ChevronRight size={16} className="text-gray-600 group-hover:text-white mx-auto" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}