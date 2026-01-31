import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Search, X, Check, EyeOff, Loader2, AlertTriangle, 
    ArrowUpRight, ArrowDownLeft, Gift, User, Shield
} from 'lucide-react';

interface AdminBankingTabProps {
  users: any[];        
  transactions: any[]; 
  onManageFunds: (userId: string, amount: number, type: 'deposit' | 'withdrawal' | 'bonus', transactionId?: number) => Promise<void>;
}

export default function AdminBankingTab({ users, transactions, onManageFunds }: AdminBankingTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. FILTER DATA ---
  // Exclude Admins/Staff & Search
  const clientList = users
    .filter(u => u.role !== 'admin' && u.role !== 'compliance')
    .filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.includes(searchTerm))
    .map(user => {
        // Attach pending withdrawals count to user for sorting
        const pendingCount = transactions.filter(t => t.user_id === user.id && t.status === 'pending').length;
        return { ...user, pendingCount };
    })
    .sort((a, b) => b.pendingCount - a.pendingCount); // Show people with requests FIRST

  // --- 2. ACTIONS ---
  const handleExecute = async (type: 'deposit' | 'withdrawal' | 'bonus') => {
      if (!selectedUser || !amount) return;
      setLoading(true);
      await onManageFunds(selectedUser.id, parseFloat(amount), type);
      setLoading(false);
      setAmount('');
      // Keep modal open so you can see the result, or close it:
      // setSelectedUser(null); 
  };

  const handleIgnore = async (txId: number) => {
      if(!confirm("Are you sure you want to hide this request?")) return;
      const { error } = await supabase.from('transactions').delete().eq('id', txId);
      if (error) alert(error.message);
      else window.location.reload(); 
  };

  const handleApprove = async (tx: any) => {
      setLoading(true);
      await onManageFunds(selectedUser.id, tx.amount, 'withdrawal', tx.id);
      setLoading(false);
  };

  // Get History for Modal
  const userHistory = selectedUser ? transactions.filter(t => t.user_id === selectedUser.id) : [];
  const pendingRequests = userHistory.filter(t => t.status === 'pending');

  return (
    <div className="h-[600px] flex flex-col bg-[#0b0e11] text-white">
      
      {/* --- TOP BAR --- */}
      <div className="p-4 border-b border-gray-800 flex justify-between">
          <div className="relative w-96">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
              <input 
                  type="text" 
                  placeholder="Search user..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 text-sm focus:border-blue-500 outline-none"
              />
          </div>
          <div className="text-gray-500 text-sm pt-2">
              {clientList.length} Clients Found
          </div>
      </div>

      {/* --- MAIN TABLE (SIMPLE EXCEL STYLE) --- */}
      <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-900 text-gray-400 sticky top-0">
                  <tr>
                      <th className="p-4 border-b border-gray-800">Client</th>
                      <th className="p-4 border-b border-gray-800 text-right">Balance</th>
                      <th className="p-4 border-b border-gray-800 text-center">Status</th>
                      <th className="p-4 border-b border-gray-800 text-right">Action</th>
                  </tr>
              </thead>
              <tbody>
                  {clientList.map(user => (
                      <tr key={user.id} className="hover:bg-gray-900/50 border-b border-gray-800/50">
                          <td className="p-4">
                              <div className="font-bold text-white">{user.email}</div>
                              <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                          </td>
                          <td className="p-4 text-right font-mono text-green-400 font-bold">
                              ${(user.balance || 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                              {user.pendingCount > 0 ? (
                                  <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded font-bold animate-pulse">
                                      {user.pendingCount} REQUESTS
                                  </span>
                              ) : (
                                  <span className="text-gray-600 text-xs">Active</span>
                              )}
                          </td>
                          <td className="p-4 text-right">
                              <button 
                                  onClick={() => setSelectedUser(user)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold"
                              >
                                  MANAGE
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* --- POPUP MODAL (When you click MANAGE) --- */}
      {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-[#151a21] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1e232d]">
                      <div>
                          <h2 className="text-xl font-bold text-white">{selectedUser.email}</h2>
                          <div className="text-green-400 font-mono text-lg font-bold">
                              Balance: ${(selectedUser.balance || 0).toLocaleString()}
                          </div>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="bg-gray-800 p-2 rounded hover:bg-gray-700">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6 space-y-8">
                      
                      {/* 1. PENDING REQUESTS SECTION */}
                      {pendingRequests.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                              <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2">
                                  <AlertTriangle size={16} /> CLIENT WANTS TO WITHDRAW
                              </h3>
                              {pendingRequests.map((tx: any) => (
                                  <div key={tx.id} className="bg-black/40 p-3 rounded flex justify-between items-center mb-2">
                                      <span className="font-mono text-white font-bold">${tx.amount}</span>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleApprove(tx)} className="bg-green-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-green-400">
                                              APPROVE
                                          </button>
                                          <button onClick={() => handleIgnore(tx.id)} className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-xs font-bold hover:bg-gray-600">
                                              IGNORE
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* 2. MANUAL ACTIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                              <h3 className="text-gray-400 text-xs font-bold uppercase mb-4">Manual Operations</h3>
                              <div className="flex gap-2 mb-4">
                                  <input 
                                      type="number" 
                                      placeholder="Amount..." 
                                      value={amount}
                                      onChange={e => setAmount(e.target.value)}
                                      className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none font-mono"
                                  />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                  <button onClick={() => handleExecute('deposit')} disabled={loading} className="bg-green-600/20 text-green-500 border border-green-600 hover:bg-green-600 hover:text-black py-3 rounded font-bold text-xs">
                                      DEPOSIT
                                  </button>
                                  <button onClick={() => handleExecute('bonus')} disabled={loading} className="bg-yellow-600/20 text-yellow-500 border border-yellow-600 hover:bg-yellow-600 hover:text-black py-3 rounded font-bold text-xs">
                                      BONUS
                                  </button>
                                  <button onClick={() => handleExecute('withdrawal')} disabled={loading} className="bg-red-600/20 text-red-500 border border-red-600 hover:bg-red-600 hover:text-white py-3 rounded font-bold text-xs">
                                      WITHDRAW
                                  </button>
                              </div>
                          </div>

                          {/* 3. HISTORY TABLE */}
                          <div className="border-l border-gray-800 pl-8">
                              <h3 className="text-gray-400 text-xs font-bold uppercase mb-4">Transaction Log</h3>
                              <div className="max-h-60 overflow-y-auto pr-2">
                                  <table className="w-full text-xs text-left">
                                      <thead>
                                          <tr className="text-gray-600 border-b border-gray-800">
                                              <th className="pb-2">Date</th>
                                              <th className="pb-2">Type</th>
                                              <th className="pb-2">By</th>
                                              <th className="pb-2 text-right">Amount</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {userHistory.map((tx: any) => (
                                              <tr key={tx.id} className="border-b border-gray-800/50">
                                                  <td className="py-2 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                                                  <td className="py-2 uppercase font-bold text-gray-300">{tx.type.replace('external_', '')}</td>
                                                  <td className="py-2 text-blue-400">{tx.performed_by_email ? 'Staff' : 'System'}</td>
                                                  <td className={`py-2 text-right font-mono ${['deposit','bonus','external_deposit'].includes(tx.type) ? 'text-green-500' : 'text-red-500'}`}>
                                                      ${tx.amount}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      )}

    </div>
  );
}