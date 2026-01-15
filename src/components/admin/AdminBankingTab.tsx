import { ArrowDownLeft, ArrowUpRight, CheckCircle, XCircle } from 'lucide-react';

interface AdminBankingTabProps {
  transactions: any[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export default function AdminBankingTab({ transactions, onApprove, onReject }: AdminBankingTabProps) {
  return (
    <div className="bg-[#1e232d] rounded-xl border border-[#2a2e39] overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#151a21] text-[#8b9bb4]">
          <tr>
            <th className="p-4">Date</th>
            <th className="p-4">User ID</th>
            <th className="p-4">Type</th>
            <th className="p-4 text-right">Amount</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a2e39]">
          {transactions.length === 0 ? (
             <tr><td colSpan={6} className="p-10 text-center text-gray-500 italic">No transactions found</td></tr>
          ) : (
             transactions.map(tx => (
            <tr key={tx.id} className="hover:bg-[#252a36] transition-colors">
              <td className="p-4 text-[#5e6673]">{new Date(tx.created_at).toLocaleDateString()}</td>
              <td className="p-4 font-mono text-xs text-[#8b9bb4]">{tx.user_id.slice(0, 8)}...</td>
              <td className="p-4 flex items-center gap-2">
                {tx.type === 'deposit' ? <ArrowDownLeft size={16} className="text-[#21ce99]" /> : <ArrowUpRight size={16} className="text-[#f23645]" />}
                <span className="capitalize font-bold text-white">{tx.type}</span>
              </td>
              <td className="p-4 text-right font-mono font-bold text-white">${tx.amount.toLocaleString()}</td>
              <td className="p-4 text-center">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                  tx.status === 'approved' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 
                  tx.status === 'rejected' ? 'bg-[#f23645]/20 text-[#f23645]' : 'bg-[#F0B90B]/20 text-[#F0B90B]'
                }`}>
                  {tx.status}
                </span>
              </td>
              <td className="p-4 text-right">
                {tx.status === 'pending' && (
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onApprove(tx.id)}
                      className="p-2 bg-[#21ce99]/10 text-[#21ce99] hover:bg-[#21ce99] hover:text-black rounded transition-colors" title="Approve">
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => onReject(tx.id)}
                      className="p-2 bg-[#f23645]/10 text-[#f23645] hover:bg-[#f23645] hover:text-white rounded transition-colors" title="Reject">
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}