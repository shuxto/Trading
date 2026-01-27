import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Upload, FileText, Loader2, CheckCircle, User, 
  MapPin, Landmark, FolderOpen, CreditCard, Plus, Trash2, 
  X, Send, ShieldCheck, Clock
} from 'lucide-react';

export default function VerificationTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'pending' | 'verified' | 'unverified'>('unverified');
  const [userId, setUserId] = useState<string | null>(null);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // FORM DATA
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', nationality: '',
    idType: 'passport', idNumber: '', expiryDate: '',
    street: '', city: '', country: '',
    employment: 'employed', income: '0-25k', 
    source: '', 
    additionalInfo: '',
    banks: [{ id: Date.now(), name: '' }] 
  });

  // LOCAL UPLOAD STATE
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (successMsg) {
        const timer = setTimeout(() => setSuccessMsg(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // 1. INITIALIZE DATA
  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        setUserId(user.id);

        const { data: kyc } = await supabase.from('crm_kyc').select('*').eq('lead_id', user.id).maybeSingle();
        const { data: profile } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).single();

        const currentStatus = profile?.kyc_status?.toLowerCase();
        if (currentStatus === 'pending') setStatus('pending');
        else if (currentStatus === 'verified' || currentStatus === 'approved') setStatus('verified');
        else setStatus('unverified');

        if (kyc) {
            setFormData({
                firstName: kyc.first_name || '',
                lastName: kyc.last_name || '',
                dob: kyc.date_of_birth || '',
                nationality: kyc.nationality || '',
                idType: kyc.document_type || 'passport',
                idNumber: kyc.document_number || '',
                expiryDate: kyc.document_expiry || '',
                street: kyc.street_address || '',
                city: kyc.city || '',
                country: kyc.residence_country || '',
                employment: kyc.employment_status || 'employed',
                income: kyc.annual_income || '0-25k',
                source: kyc.source_of_funds || '',
                additionalInfo: kyc.additional_info || '',
                banks: (kyc.bank_details && Array.isArray(kyc.bank_details)) ? kyc.bank_details : [{ id: Date.now(), name: '' }]
            });
        }
        setLoading(false);
    };
    init();
  }, []);

  // 2. MASTER SUBMIT FUNCTION
  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    if (!selectedFile) {
        alert("⚠️ Please select an identification document before submitting your dossier.");
        return;
    }

    setSubmitting(true);

    try {
        // --- STEP 0: SAFETY CHECK ---
        // Ensure the user exists in 'crm_leads' so the Foreign Key doesn't break
        const { data: existingLead } = await supabase
            .from('crm_leads')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!existingLead) {
            const { data: { user } } = await supabase.auth.getUser();
            const { error: leadError } = await supabase.from('crm_leads').insert({
                id: userId,
                email: user?.email,
                // We assume these column names exist based on your previous fixes
                first_name: formData.firstName,
                last_name: formData.lastName,
                status: 'New',
                kyc_status: 'Unverified'
            });
            if (leadError) throw leadError;
        }

        // --- STEP A: SAVE DATA TO crm_kyc ---
        const { error: kycError } = await supabase.from('crm_kyc').upsert({
            lead_id: userId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dob || null,
            nationality: formData.nationality,
            document_type: formData.idType,
            document_number: formData.idNumber,
            document_expiry: formData.expiryDate || null,
            street_address: formData.street,
            city: formData.city,
            residence_country: formData.country,
            employment_status: formData.employment,
            annual_income: formData.income,
            source_of_funds: formData.source,
            additional_info: formData.additionalInfo,
            bank_details: formData.banks,
            updated_at: new Date().toISOString()
        }, { onConflict: 'lead_id' });

        if (kycError) throw kycError;

        // --- STEP B: UPLOAD FILE TO STORAGE ---
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}/${formData.idType}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('kyc-documents').upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;

        // --- STEP C: LOG DOCUMENT ENTRY ---
        await supabase.from('crm_kyc_documents').insert({
            lead_id: userId,
            file_type: formData.idType,
            file_name: selectedFile.name,
            file_path: fileName,
            is_verified: false
        });

        // --- STEP D: FINALIZE STATUS TO PENDING ---
        await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', userId);
        await supabase.from('crm_leads').update({ kyc_status: 'Pending' }).eq('id', userId);

        setStatus('pending');
        setSuccessMsg("Verification Dossier Submitted Successfully!");

    } catch (err: any) {
        console.error("Submission Error Details:", err);
        alert("Submission Failed: " + (err.message || "Unknown error"));
    } finally {
        setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const addBank = () => setFormData(p => ({ ...p, banks: [...p.banks, { id: Date.now(), name: '' }] }));
  const updateBank = (id: number, val: string) => setFormData(p => ({ ...p, banks: p.banks.map(b => b.id === id ? { ...b, name: val } : b) }));
  const removeBank = (id: number) => setFormData(p => ({ ...p, banks: p.banks.filter(b => b.id !== id) }));

  if (loading) return <div className="p-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto"/> Loading Verification Profile...</div>;

  // --- VIEW: PENDING REVIEW ---
  if (status === 'pending') {
      return (
        <div className="max-w-2xl mx-auto mt-10 animate-in fade-in">
            <div className="bg-[#1e232d] p-10 rounded-3xl border border-[#2a2e39] text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
                <div className="w-24 h-24 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                    <Clock size={48} className="animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Dossier Under Review</h3>
                <p className="text-[#8b9bb4] leading-relaxed text-sm px-4">
                  Your identity verification dossier has been successfully transmitted to our compliance department. 
                  Our officers are currently validating your documentation against international regulatory standards.
                </p>
                <div className="mt-8 p-5 bg-[#151a21] rounded-2xl border border-white/5 flex flex-col gap-3">
                   <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                      <span className="text-gray-500">Current Status</span>
                      <span className="text-yellow-500">Awaiting Approval</span>
                   </div>
                   <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full w-2/3 animate-pulse"></div>
                   </div>
                   <p className="text-[10px] text-gray-600 text-left italic">Note: Normal processing time is 2-24 hours depending on network load.</p>
                </div>
            </div>
        </div>
      );
  }

  // --- VIEW: APPROVED ---
  if (status === 'verified') {
      return (
        <div className="max-w-2xl mx-auto mt-10 animate-in fade-in">
            <div className="bg-[#1e232d] p-10 rounded-3xl border border-green-500/20 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-600 via-green-400 to-green-600"></div>
                <div className="w-24 h-24 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <ShieldCheck size={48} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Identity Verified</h3>
                <p className="text-[#8b9bb4] leading-relaxed text-sm px-4">
                  Verification protocols completed successfully. Your account is now fully authorized for institutional-grade trading and priority withdrawals.
                </p>
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[10px] font-black uppercase tracking-widest">
                       Full Access Granted
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in relative pb-20">
      {successMsg && (
        <div className="fixed top-20 right-10 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="bg-[#1e232d] border border-green-500/30 rounded-xl shadow-2xl p-4 flex items-center gap-3">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-white text-sm font-bold">{successMsg}</span>
                <button onClick={() => setSuccessMsg(null)} className="cursor-pointer text-gray-500 hover:text-white"><X size={16}/></button>
            </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tighter">Account Verification</h2>
        <p className="text-[#8b9bb4] mt-1">Submit your identification dossier to authorize live trading capabilities.</p>
      </div>
      
      <form onSubmit={handleSubmitKYC} className="space-y-6">
          <div className="bg-[#1e232d] p-8 rounded-2xl border border-[#2a2e39] space-y-8">
              {/* Identity Section */}
              <div>
                <div className="flex items-center gap-2 mb-6 text-[#21ce99]">
                    <User size={20}/> <span className="font-bold uppercase tracking-widest text-sm">Personal Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="First Name" val={formData.firstName} set={(v: string) => setFormData({...formData, firstName: v})} />
                    <Input label="Last Name" val={formData.lastName} set={(v: string) => setFormData({...formData, lastName: v})} />
                    <Input label="Date of Birth" type="date" val={formData.dob} set={(v: string) => setFormData({...formData, dob: v})} />
                    <Input label="Nationality" val={formData.nationality} set={(v: string) => setFormData({...formData, nationality: v})} />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Address Section */}
              <div>
                <div className="flex items-center gap-2 mb-6 text-purple-400">
                    <MapPin size={20}/> <span className="font-bold uppercase tracking-widest text-sm">Residential Address</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Input label="Street Address" val={formData.street} set={(v: string) => setFormData({...formData, street: v})} />
                    </div>
                    <Input label="City" val={formData.city} set={(v: string) => setFormData({...formData, city: v})} />
                    <Input label="Country" val={formData.country} set={(v: string) => setFormData({...formData, country: v})} />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Banking Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Landmark size={20}/> <span className="font-bold uppercase tracking-widest text-sm">Banking Details</span>
                    </div>
                    <button type="button" onClick={addBank} className="text-xs flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer">
                        <Plus size={14}/> Add Bank
                    </button>
                </div>
                <div className="space-y-4">
                    {formData.banks.map((bank: any, index: number) => (
                        <div key={bank.id} className="flex items-end gap-3 animate-in slide-in-from-left-2">
                            <div className="w-full">
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">
                                    {index === 0 ? 'Primary Settlement Bank' : `Secondary Bank #${index + 1}`}
                                </label>
                                <input 
                                    type="text"
                                    value={bank.name} 
                                    onChange={(e) => updateBank(bank.id, e.target.value)} 
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none transition"
                                    placeholder="e.g. Bank of America, HSBC"
                                />
                            </div>
                            {formData.banks.length > 1 && (
                                <button type="button" onClick={() => removeBank(bank.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition cursor-pointer">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
              </div>
          </div>

          {/* Document Section */}
          <div className="bg-[#1e232d] p-8 rounded-2xl border border-[#2a2e39] space-y-6">
              <div className="flex items-center gap-2 text-blue-400">
                  <FolderOpen size={20}/> <span className="font-bold uppercase tracking-widest text-sm">Identification Document</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <TypeBtn type="passport" label="Passport" icon={<FileText size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
                  <TypeBtn type="id_card" label="National ID" icon={<CreditCard size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
                  <TypeBtn type="driver_license" label="Driver License" icon={<User size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
                  <TypeBtn type="other" label="Other Doc" icon={<Plus size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
              </div>

              <div className="relative group">
                <div 
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all ${
                        selectedFile 
                        ? 'border-green-500/50 bg-green-500/5 cursor-default' 
                        : 'border-[#2a2e39] hover:border-[#21ce99]/50 hover:bg-[#0b0e11]/50 cursor-pointer'
                    }`}
                >
                    {selectedFile ? (
                        <>
                            <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                <CheckCircle size={40}/>
                            </div>
                            <span className="text-white font-bold max-w-[300px] truncate">{selectedFile.name}</span>
                            <span className="text-gray-500 text-xs mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Attachment Verified</span>
                            
                            {/* --- REMOVE ATTACHMENT BUTTON --- */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                            >
                                <Trash2 size={14} /> Remove Attachment
                            </button>
                        </>
                    ) : (
                        <>
                            <Upload size={48} className="text-[#5e6673] mb-4 group-hover:text-[#21ce99] transition-colors"/>
                            <span className="text-white font-bold">Upload Verification Document</span>
                            <span className="text-[#5e6673] text-xs mt-1">JPG, PNG or PDF (Max 5MB)</span>
                        </>
                    )}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.pdf" />
          </div>

          <button 
            type="submit"
            disabled={submitting} 
            className="w-full bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] py-5 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#21ce99]/20 disabled:opacity-50 disabled:grayscale cursor-pointer active:scale-[0.99]"
          >
              {submitting ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}
              {submitting ? 'VALIDATING SECURITY PROTOCOLS...' : 'SUBMIT VERIFICATION DOSSIER'}
          </button>
      </form>
    </div>
  );
}

function Input({ label, type="text", val, set }: { label: string, type?: string, val: string, set: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">{label}</label>
            <input 
                type={type} 
                value={val} 
                onChange={(e) => set(e.target.value)} 
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-3 text-white text-sm focus:border-[#21ce99] outline-none transition-all placeholder:text-gray-700"
            />
        </div>
    );
}

function TypeBtn({ type, label, icon, active, set }: { type: string, label: string, icon: any, active: string, set: (t: string) => void }) {
    const isActive = active === type;
    return (
        <button 
            type="button"
            onClick={() => set(type)}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all cursor-pointer ${
                isActive ? 'bg-[#21ce99]/10 border-[#21ce99] text-[#21ce99] shadow-lg shadow-[#21ce99]/5' : 'bg-[#0b0e11] border-[#2a2e39] text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
        >
            {icon} {label}
        </button>
    );
}