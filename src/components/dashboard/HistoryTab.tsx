import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';

export default function HistoryTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredTx = transactions.filter(tx => {
    const matchesSearch = 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesType;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTx.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTx.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1e232d] p-4 rounded-2xl border border-[#2a2e39]">
        <div>
          <h2 className="text-xl font-bold text-white">Transaction History</h2>
          <p className="text-xs text-[#8b9bb4]">View all your deposits, withdrawals, and transfers</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6673]" size={16} />
            <input 
              type="text" 
              placeholder="Search ID or Description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-[#F0B90B] outline-none"
            />
          </div>
          
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6673]" size={16} />
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="bg-[#0b0e11] border border-[#2a2e39] rounded-xl py-2 pl-10 pr-8 text-sm text-white appearance-none outline-none focus:border-[#F0B90B]"
             >
               <option value="all">All Types</option>
               <option value="deposit">Deposits</option>
               <option value="withdrawal">Withdrawals</option>
             </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#1e232d] border border-[#2a2e39] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#151a21] text-[#8b9bb4] border-b border-[#2a2e39]">
              <tr>
                <th className="p-4 font-bold text-xs uppercase">Type</th>
                <th className="p-4 font-bold text-xs uppercase">Description</th>
                <th className="p-4 font-bold text-xs uppercase text-right">Amount</th>
                <th className="p-4 font-bold text-xs uppercase text-center">Status</th>
                <th className="p-4 font-bold text-xs uppercase text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading history...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                currentItems.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#252a36] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          tx.type === 'deposit' ? 'bg-[#21ce99]/20 text-[#21ce99]' : 'bg-[#f23645]/20 text-[#f23645]'
                        }`}>
                          {tx.type === 'deposit' ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                        </div>
                        <span className="font-bold capitalize text-white">{tx.type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">
                      {tx.description || <span className="text-gray-600 italic">No description</span>}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${tx.type === 'deposit' ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${
                          tx.status === 'approved' || tx.status === 'completed' ? 'bg-[#21ce99]/10 text-[#21ce99] border border-[#21ce99]/20' :
                          tx.status === 'rejected' ? 'bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/20' :
                          'bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/20'
                        }`}>
                          {(tx.status === 'approved' || tx.status === 'completed') && <CheckCircle size={12} />}
                          {tx.status === 'rejected' && <XCircle size={12} />}
                          {tx.status === 'pending' && <Clock size={12} />}
                          {tx.status}
                        </span>
                    </td>
                    <td className="p-4 text-right text-gray-500 font-mono text-xs">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#2a2e39] bg-[#151a21] flex justify-between items-center">
             <button 
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               disabled={currentPage === 1}
               className="flex items-center gap-1 text-xs font-bold text-[#8b9bb4] hover:text-white disabled:opacity-30"
             >
               <ChevronLeft size={14} /> Previous
             </button>
             <span className="text-xs text-[#5e6673]">Page {currentPage} of {totalPages}</span>
             <button 
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               disabled={currentPage === totalPages}
               className="flex items-center gap-1 text-xs font-bold text-[#8b9bb4] hover:text-white disabled:opacity-30"
             >
               Next <ChevronRight size={14} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}