import { Search } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsersTab({ users }: { users: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.id.includes(searchTerm) || user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 bg-[#1e232d] p-3 rounded-xl border border-[#2a2e39] w-full md:w-96">
        <Search size={18} className="text-[#8b9bb4]" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search user by ID or Email..." 
          className="bg-transparent outline-none text-white w-full placeholder-gray-600" 
        />
      </div>

      <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#151a21] text-[#8b9bb4]">
            <tr>
              <th className="p-4">User ID</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Balance</th>
              <th className="p-4 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2e39]">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-[#252a36] transition-colors">
                <td className="p-4 font-mono text-xs text-[#8b9bb4]">{user.id}</td>
                <td className="p-4 uppercase text-xs font-bold">
                  <span className={`px-2 py-1 rounded ${user.role === 'admin' ? 'bg-[#F0B90B]/20 text-[#F0B90B]' : 'bg-gray-800 text-gray-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-bold text-[#21ce99]">
                  ${user.balance?.toLocaleString()}
                </td>
                <td className="p-4 text-right text-[#5e6673]">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}