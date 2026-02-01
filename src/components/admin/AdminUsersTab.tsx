import { Search, User, Shield, Key, Loader2, Save, X, ChevronLeft, ChevronRight, RefreshCw, Check } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminUsersTab({ users }: { users: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🟢 PASSWORD MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, email: string} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 🟢 PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 🟢 STATUS TOAST
  const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // 1. Filter Logic
  const filteredUsers = users.filter(user =>
    (user.id || '').includes(searchTerm) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.real_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const showToast = (text: string, type: 'success' | 'error') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser({ id: user.id, email: user.email });
    setNewPassword('');
    setIsModalOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || newPassword.length < 6) {
      showToast("Password must be 6+ chars", "error");
      return;
    }
    setIsUpdating(true);
    try {
        const { error } = await supabase.functions.invoke('update-user', {
            body: {
                target_id: selectedUser.id,
                updates: { password: newPassword }
            }
        });
        if (error) throw error;
        showToast("Security updated", "success");
        setIsModalOpen(false);
    } catch (err: any) {
        showToast(err.message || "Override Failed", "error");
    } finally {
        setIsUpdating(false);
    }
  };

  const getClearanceBadge = (tier: string) => {
    const isStaff = tier === 'Staff' || tier === 'Admin';
    if (isStaff) {
      return {
        label: 'STAFF',
        classes: 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/30' 
      };
    }
    return {
      label: 'USER',
      classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
  };

  return (
    /* 🟢 min-h-screen ensures the background and container grow with the table */
    <div className="w-full min-h-screen p-6 animate-in fade-in duration-500 relative font-sans space-y-6 overflow-visible">
      
      {/* SEARCH & STATS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="relative group w-full md:w-96">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#21ce99]" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search user database..." 
              className="block w-full pl-12 pr-4 py-3 bg-[#151a21] border border-[#2a2e39] rounded-2xl text-sm text-white placeholder-gray-600 outline-none focus:border-[#21ce99]/50 transition-all shadow-inner"
            />
        </div>
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-[#1e232d] px-5 py-2.5 rounded-xl border border-[#2a2e39]">
            Total Nodes: <span className="text-white ml-2">{filteredUsers.length}</span>
        </div>
      </div>

      {/* USERS TABLE CONTAINER - No internal fixed heights */}
      <div className="bg-[#151a21] rounded-3xl border border-[#2a2e39] shadow-2xl">
        <div className="overflow-x-auto"> 
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#1e232d] text-[10px] uppercase font-black text-gray-500 tracking-widest border-b border-[#2a2e39]">
              <tr>
                <th className="p-5 pl-8">Client Identity</th>
                <th className="p-5">Clearance</th>
                <th className="p-5 text-right">Main Balance</th>
                <th className="p-4 text-right">Registration</th>
                <th className="p-5 text-center">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/30">
              {currentUsers.map(user => {
                const badge = getClearanceBadge(user.tier);
                return (
                  <tr key={user.id} className="group hover:bg-[#1e232d]/60 transition-colors">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[#0b0e11] border border-white/5 text-gray-500 group-hover:text-[#21ce99] transition-all">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-white leading-none mb-1.5">{user.real_name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border w-fit ${badge.classes}`}>
                          {badge.label === 'STAFF' ? <Shield size={10} /> : <User size={10} />} 
                          {badge.label}
                      </div>
                    </td>
                    <td className="p-5 text-right font-mono font-bold text-[#21ce99] text-sm">
                      ${(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex flex-col items-end text-gray-400">
                        <span className="text-xs font-bold text-gray-300">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono mt-0.5">
                          {user.created_at ? new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => handleOpenModal(user)} className="p-2.5 rounded-xl bg-[#1e232d] text-gray-400 hover:text-white hover:bg-[#f23645]/10 border border-[#2a2e39] transition-all cursor-pointer">
                          <Key size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION - Attached to the bottom of the table */}
        <div className="p-6 bg-[#1e232d]/40 border-t border-[#2a2e39] flex justify-between items-center shrink-0">
            <button 
              disabled={currentPage === 1} 
              onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 disabled:opacity-10 cursor-pointer transition-all"
            >
                <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Page {currentPage} / {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 disabled:opacity-10 cursor-pointer transition-all"
            >
                Next <ChevronRight size={16} />
            </button>
        </div>
      </div>

      {/* FOOTER SPACER - Ensures you can always scroll past the last row */}
      <div className="h-20 w-full" />

      {/* PASSWORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-[#151a21] border border-[#2a2e39] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-[#2a2e39] flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-[#f23645] mb-2"><Shield size={18} /><h3 className="text-lg font-black uppercase">Security Override</h3></div>
                        <p className="text-xs text-gray-500 font-mono">{selectedUser?.email}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-[#1e232d] rounded-xl text-gray-500 hover:text-white cursor-pointer"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-500 uppercase">New Access Key</label>
                            <button onClick={generateRandomPassword} className="text-[9px] font-bold text-[#21ce99] hover:underline uppercase flex items-center gap-1 cursor-pointer"><RefreshCw size={10} /> Auto-Gen</button>
                        </div>
                        <div className="relative">
                            <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-sm focus:border-[#f23645] outline-none" />
                        </div>
                    </div>
                    <button onClick={handleUpdatePassword} disabled={isUpdating || newPassword.length < 6} className="w-full bg-[#f23645] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#d92d3b] transition-all disabled:opacity-20 cursor-pointer">
                        {isUpdating ? <Loader2 size={20} className="animate-spin"/> : <Save size={20} />} PUSH UPDATE
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* TOAST */}
      {statusMsg && (
        <div className={`fixed bottom-10 right-10 px-8 py-4 rounded-2xl border shadow-2xl flex items-center gap-4 z-[110] animate-in slide-in-from-bottom-10 ${statusMsg.type === 'success' ? 'bg-[#0b0e11] border-[#21ce99] text-[#21ce99]' : 'bg-[#0b0e11] border-[#f23645] text-[#f23645]'}`}>
            {statusMsg.type === 'success' ? <Check size={20} /> : <Shield size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}