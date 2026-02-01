import { CheckCircle, XCircle, ShieldAlert, User, Clock, ShieldCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminVerificationTabProps {
  users: any[];
  onVerify?: (userId: string) => void; // Keeping for compatibility
  onReject?: (userId: string) => void; // Keeping for compatibility
}

export default function AdminVerificationTab({ users }: AdminVerificationTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 🟢 1. FILTER: Logic to find users needing verification
  const pendingUsers = users.filter(u => 
    u.kyc_status === 'pending' || 
    u.kyc_status === null || 
    u.kyc_status === undefined ||
    u.kyc_status === ''
  );

  // 🟢 2. PAGINATION LOGIC
  const totalPages = Math.ceil(pendingUsers.length / itemsPerPage);
  const currentItems = pendingUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 🟢 3. SYNCED VERIFICATION LOGIC (Trading App + CRM)
  const handleStatusUpdate = async (userId: string, targetStatus: 'verified' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to mark this user as ${targetStatus.toUpperCase()}?`)) return;
    
    setProcessingId(userId);
    try {
        const crmStatus = targetStatus === 'verified' ? 'Approved' : 'Rejected';

        // A. Update Trading App (profiles table)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ kyc_status: targetStatus })
            .eq('id', userId);

        if (profileError) throw profileError;

        // B. Update CRM (crm_leads table using the email or trading_id)
        // We match by the user id which is stored as trading_account_id in CRM
        const { error: crmError } = await supabase
            .from('crm_leads')
            .update({ kyc_status: crmStatus })
            .eq('trading_account_id', userId);

        // Note: We don't throw if CRM update fails because user might not be in CRM, 
        // but we log it.
        if (crmError) console.warn("CRM Sync failed, but Profile updated:", crmError.message);

        // Success state is handled by the parent component re-fetching users prop
        alert(`User successfully ${targetStatus === 'verified' ? 'Verified' : 'Rejected'}.`);

    } catch (err: any) {
        alert("Verification Error: " + err.message);
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen p-6 animate-in fade-in duration-500 relative font-sans space-y-6 overflow-visible bg-[#0b0e11]">
      
      {/* 🟡 HEADER ALERT */}
      <div className="flex items-center justify-between p-6 bg-[#F0B90B]/5 border border-[#F0B90B]/20 rounded-3xl shadow-xl shadow-yellow-900/5">
         <div className="flex items-center gap-5">
            <div className="p-4 bg-[#F0B90B]/10 rounded-2xl text-[#F0B90B]">
                <ShieldAlert size={32} />
            </div>
            <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">KYC Queue</h3>
                <p className="text-sm text-[#F0B90B] font-medium uppercase tracking-widest opacity-80">
                    {pendingUsers.length} Nodes Awaiting Clearance
                </p>
            </div>
         </div>
         <div className="hidden md:block px-4 py-2 bg-black/20 rounded-xl border border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Security Level: Alpha
         </div>
      </div>

      {/* 🟢 TABLE CONTAINER */}
      <div className="bg-[#151a21] rounded-[2rem] border border-[#2a2e39] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#1e232d] text-[10px] uppercase font-black text-gray-500 tracking-widest border-b border-[#2a2e39]">
              <tr>
                <th className="p-5 pl-8">Client Identification</th>
                <th className="p-5">Node Registration</th>
                <th className="p-5 text-center">Protocol Status</th>
                <th className="p-5 text-right pr-8">Clearance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/30">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <ShieldCheck size={48} className="text-[#21ce99]" />
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">All Nodes Cleared</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map(user => (
                  <tr key={user.id} className="group hover:bg-[#1e232d]/60 transition-colors">
                    {/* IDENTITY */}
                    <td className="p-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[#0b0e11] border border-white/5 text-gray-500 group-hover:text-[#F0B90B] group-hover:border-[#F0B90B]/20 transition-all shadow-inner">
                            <User size={18} />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-bold text-white leading-none mb-1.5">{user.real_name || 'System Lead'}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{user.email}</span>
                                <span className="text-gray-700">|</span>
                                <span className="font-mono text-[10px] uppercase tracking-tighter">{user.id.slice(0,13)}...</span>
                            </div>
                          </div>
                        </div>
                    </td>

                    {/* JOINED DATE */}
                    <td className="p-5 text-gray-400">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                            <Clock size={12} className="text-gray-600" />
                            {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span className="text-[10px] font-mono text-gray-600 mt-0.5 uppercase">Node Initialized</span>
                        </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0B90B]/10 text-[#F0B90B] rounded-lg text-[9px] font-black uppercase border border-[#F0B90B]/20 animate-pulse">
                          Awaiting Review
                        </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-5 text-right pr-8">
                      <div className="flex justify-end gap-3">
                        <button 
                          disabled={processingId === user.id}
                          onClick={() => handleStatusUpdate(user.id, 'verified')}
                          className="flex items-center gap-2 px-5 py-2 bg-[#21ce99]/10 text-[#21ce99] hover:bg-[#21ce99] hover:text-black rounded-xl transition-all font-black text-[10px] uppercase tracking-wider border border-[#21ce99]/20 disabled:opacity-30 cursor-pointer"
                        >
                          {processingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} 
                          Verify
                        </button>
                        <button 
                          disabled={processingId === user.id}
                          onClick={() => handleStatusUpdate(user.id, 'rejected')}
                          className="flex items-center gap-2 px-5 py-2 bg-[#f23645]/10 text-[#f23645] hover:bg-[#f23645] hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-wider border border-[#f23645]/20 disabled:opacity-30 cursor-pointer"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🟢 PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-6 bg-[#1e232d]/40 border-t border-[#2a2e39] flex justify-between items-center shrink-0">
              <button 
                disabled={currentPage === 1} 
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 disabled:opacity-10 cursor-pointer transition-all"
              >
                  <ChevronLeft size={16} /> Previous
              </button>
              <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Queue Page {currentPage} / {totalPages}</span>
                  <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#F0B90B] transition-all duration-500" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
                  </div>
              </div>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 disabled:opacity-10 cursor-pointer transition-all"
              >
                  Next <ChevronRight size={16} />
              </button>
          </div>
        )}
      </div>

      <div className="h-20 w-full" />
    </div>
  );
}