import { CheckCircle, XCircle, ShieldAlert, User, Clock } from 'lucide-react';

interface AdminVerificationTabProps {
  users: any[];
  onVerify: (userId: string) => void;
  onReject: (userId: string) => void;
}

export default function AdminVerificationTab({ users, onVerify, onReject }: AdminVerificationTabProps) {
  // ✅ FIX: Catch 'pending', NULL, undefined, or empty string
  const pendingUsers = users.filter(u => 
    u.kyc_status === 'pending' || 
    u.kyc_status === null || 
    u.kyc_status === undefined ||
    u.kyc_status === ''
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ... (Keep the rest of the return code exactly the same) ... */}
      <div className="flex items-center gap-3 p-4 bg-[#F0B90B]/10 border border-[#F0B90B]/30 rounded-xl text-[#F0B90B]">
         <ShieldAlert size={24} />
         <div>
           <h3 className="font-bold text-sm">Action Required</h3>
           <p className="text-xs opacity-80">There are {pendingUsers.length} users waiting for verification.</p>
         </div>
      </div>

      <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#151a21] text-[#8b9bb4]">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4 text-center">Current Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2e39]">
            {pendingUsers.length === 0 ? (
               <tr><td colSpan={4} className="p-10 text-center text-gray-500 italic">All users are verified!</td></tr>
            ) : (
               pendingUsers.map(user => (
              <tr key={user.id} className="hover:bg-[#252a36] transition-colors">
                <td className="p-4">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#2a2e39] rounded-full flex items-center justify-center text-gray-400">
                         <User size={14} />
                      </div>
                      <div>
                         <div className="font-bold text-white text-xs">{user.email || 'No Email'}</div>
                         <div className="font-mono text-[10px] text-[#5e6673]">{user.id}</div>
                      </div>
                   </div>
                </td>
                <td className="p-4 text-[#8b9bb4] text-xs">
                   <div className="flex items-center gap-2">
                      <Clock size={12} />
                      {new Date(user.created_at).toLocaleDateString()}
                   </div>
                </td>
                <td className="p-4 text-center">
                   <span className="px-2 py-1 bg-[#F0B90B]/10 text-[#F0B90B] rounded text-[10px] font-bold uppercase border border-[#F0B90B]/20">
                     PENDING REVIEW
                   </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onVerify(user.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#21ce99]/10 text-[#21ce99] hover:bg-[#21ce99] hover:text-black rounded-lg transition-all font-bold text-xs"
                    >
                      <CheckCircle size={14} /> VERIFY
                    </button>
                    <button 
                      onClick={() => onReject(user.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#f23645]/10 text-[#f23645] hover:bg-[#f23645] hover:text-white rounded-lg transition-all font-bold text-xs"
                    >
                      <XCircle size={14} /> REJECT
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}