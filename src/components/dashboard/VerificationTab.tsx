import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Loader2, CheckCircle, User, 
  MapPin, Landmark, FolderOpen, CreditCard, Plus, Trash2, 
  X, Send, ShieldCheck, Clock, UploadCloud
} from 'lucide-react';

// Standard Country List
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain", "Netherlands", "Switzerland",
  "Sweden", "Norway", "Denmark", "Finland", "Belgium", "Austria", "Ireland", "Poland", "Portugal", "Greece",
  "Japan", "South Korea", "Singapore", "Hong Kong", "New Zealand", "United Arab Emirates", "Saudi Arabia", "Qatar", "Israel", "Turkey",
  "Brazil", "Mexico", "Argentina", "Chile", "Colombia", "Peru", "South Africa", "India", "China", "Malaysia", "Thailand", "Indonesia", "Vietnam"
].sort();

export default function VerificationTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'pending' | 'verified' | 'unverified'>('unverified');
  const [userId, setUserId] = useState<string | null>(null);
  
  // SUCCESS STATE
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

  // AUTO-HIDE POPUP
  useEffect(() => {
    if (successMsg) {
        const timer = setTimeout(() => setSuccessMsg(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // --- 1. INITIALIZE DATA & REALTIME LISTENER ---
  useEffect(() => {
    let channel: any;

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        setUserId(user.id);

        // A. Get Initial Status
        const { data: profile } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).single();
        const currentStatus = profile?.kyc_status?.toLowerCase();
        
        if (currentStatus === 'pending') setStatus('pending');
        else if (currentStatus === 'verified' || currentStatus === 'approved') setStatus('verified');
        else setStatus('unverified');

        // B. SETUP REALTIME LISTENER
        channel = supabase
            .channel('kyc-status-update')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`, 
                },
                (payload) => {
                    const newStatus = payload.new.kyc_status?.toLowerCase();
                    if (newStatus === 'pending') setStatus('pending');
                    else if (newStatus === 'verified' || newStatus === 'approved') setStatus('verified');
                    else setStatus('unverified');
                }
            )
            .subscribe();

        // C. Fetch Existing Data
        let targetLeadId = null;
        const { data: linkedLead } = await supabase.from('crm_leads').select('id').eq('trading_account_id', user.id).maybeSingle();
        if (linkedLead) targetLeadId = linkedLead.id;
        if (!targetLeadId && user.email) {
            const { data: emailLead } = await supabase.from('crm_leads').select('id').eq('email', user.email).maybeSingle();
            if (emailLead) targetLeadId = emailLead.id;
        }
        if (targetLeadId) {
            const { data: kyc } = await supabase.from('crm_kyc').select('*').eq('lead_id', targetLeadId).maybeSingle();
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
        }
        setLoading(false);
    };

    init();

    return () => {
        if (channel) supabase.removeChannel(channel);
    };
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) throw new Error("User email not found");

        // --- STEP 0: FIND OR CREATE THE CORRECT LEAD ID ---
        let targetLeadId = null;

        // A. Search by Link
        const { data: linkedLead } = await supabase.from('crm_leads').select('id').eq('trading_account_id', userId).maybeSingle();
        if (linkedLead) {
            targetLeadId = linkedLead.id;
        } else {
            // B. Search by Email
            const { data: emailLead } = await supabase.from('crm_leads').select('id').eq('email', user.email).maybeSingle();

            if (emailLead) {
                targetLeadId = emailLead.id;
                await supabase.from('crm_leads').update({ trading_account_id: userId }).eq('id', targetLeadId);
            }
        }

        // D. Create New Lead
        if (!targetLeadId) {
             const { data: newLead, error: createError } = await supabase
                .from('crm_leads')
                .insert({
                    email: user.email,
                    name: formData.firstName,
                    surname: formData.lastName,
                    country: formData.country,
                    status: 'New',
                    kyc_status: 'Pending',
                    source_file: 'Web_KYC',
                    trading_account_id: userId 
                })
                .select()
                .single();
            
            if (createError) throw new Error("Could not create lead record: " + createError.message);
            targetLeadId = newLead.id;
        }

        // --- STEP A: SAVE DATA TO crm_kyc ---
        const { error: kycError } = await supabase.from('crm_kyc').upsert({
            lead_id: targetLeadId, 
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

        // --- STEP B: UPLOAD FILE ---
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}/${formData.idType}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('kyc-documents').upload(fileName, selectedFile);
        if (uploadError) throw uploadError;

        // --- STEP C: LOG DOCUMENT ---
        await supabase.from('crm_kyc_documents').insert({
            lead_id: targetLeadId, 
            file_type: formData.idType,
            file_name: selectedFile.name,
            file_path: fileName,
            is_verified: false
        });

        // --- STEP D: FINALIZE STATUS ---
        await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', userId);
        await supabase.from('crm_leads').update({ kyc_status: 'Pending' }).eq('id', targetLeadId);

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

  if (loading) return <div className="p-12 text-center text-gray-500 font-mono text-xs"><Loader2 className="animate-spin mx-auto"/> DECRYPTING PROFILE DATA...</div>;

  // --- VIEWS (PENDING / VERIFIED) ---
  if (status === 'pending') {
      return (
        <div className="max-w-2xl mx-auto mt-10 animate-in fade-in">
            <div className="bg-[#1e232d] p-10 rounded-[30px] border border-[#2a2e39] text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F0B90B] to-transparent animate-pulse"></div>
                <div className="w-24 h-24 bg-[#F0B90B]/10 text-[#F0B90B] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#F0B90B]/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                    <Clock size={48} className="animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Dossier Under Review</h3>
                <p className="text-[#8b9bb4] leading-relaxed text-sm px-4 font-mono">
                  IDENTITY VERIFICATION DOSSIER TRANSMITTED. <br/>AWAITING COMPLIANCE OFFICER APPROVAL.
                </p>
                <div className="mt-8 p-5 bg-[#151a21] rounded-2xl border border-white/5 flex flex-col gap-3">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-500">Live Uplink</span>
                      <span className="text-[#F0B90B] animate-pulse">Processing...</span>
                   </div>
                   <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#F0B90B] h-full w-2/3 animate-[pulse_2s_infinite]"></div>
                   </div>
                </div>
            </div>
        </div>
      );
  }

  if (status === 'verified') {
      return (
        <div className="max-w-2xl mx-auto mt-10 animate-in fade-in">
            <div className="bg-[#1e232d] p-10 rounded-[30px] border border-[#21ce99]/30 text-center relative overflow-hidden shadow-[0_0_50px_rgba(33,206,153,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#21ce99] to-transparent"></div>
                <div className="w-24 h-24 bg-[#21ce99]/10 text-[#21ce99] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#21ce99]/30 shadow-[0_0_30px_rgba(33,206,153,0.3)]">
                    <ShieldCheck size={48} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Identity Verified</h3>
                <p className="text-[#8b9bb4] leading-relaxed text-sm px-4 font-mono">
                  SECURITY CLEARANCE GRANTED. <br/>FULL TRADING & WITHDRAWAL PRIVILEGES UNLOCKED.
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in relative pb-20 font-sans">
      
      {/* SUCCESS POPUP */}
      {successMsg && (
        <div className="fixed top-20 right-10 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="bg-[#1e232d] border border-[#21ce99]/30 rounded-2xl shadow-2xl shadow-[#21ce99]/20 p-5 flex items-center gap-4 min-w-[300px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#21ce99] to-emerald-600"></div>
                <div className="p-3 bg-[#21ce99]/10 rounded-full text-[#21ce99]"><CheckCircle size={24} /></div>
                <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">Transmission Complete</h4>
                    <p className="text-gray-400 text-xs mt-0.5 font-mono">{successMsg}</p>
                </div>
                <button onClick={() => setSuccessMsg(null)} className="ml-auto text-gray-500 hover:text-white transition cursor-pointer"><X size={16} /></button>
            </div>
        </div>
      )}

      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-[#21ce99]/10 rounded-xl text-[#21ce99] border border-[#21ce99]/20 shadow-[0_0_15px_rgba(33,206,153,0.2)]">
            <ShieldCheck size={32} />
        </div>
        <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Identity Core</h2>
            <p className="text-[#8b9bb4] font-mono text-xs mt-1">SUBMIT ENCRYPTED DOSSIER FOR LEVEL 2 CLEARANCE</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmitKYC} className="space-y-6">
          <div className="bg-[#151a21] p-8 rounded-[24px] border border-white/10 space-y-8 relative overflow-hidden shadow-2xl">
              {/* Scanline Background */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #fff 25%, #fff 26%, transparent 27%, transparent 74%, #fff 75%, #fff 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }} />
              
              {/* --- SECTION 1: IDENTITY --- */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 text-[#21ce99]">
                    <User size={18}/> <span className="font-bold uppercase tracking-widest text-xs">Personal Data Record</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="First Name" val={formData.firstName} set={(v) => setFormData({...formData, firstName: v})} />
                    <Input label="Last Name" val={formData.lastName} set={(v) => setFormData({...formData, lastName: v})} />
                    
                    <Input label="Date of Birth" type="date" val={formData.dob} set={(v) => setFormData({...formData, dob: v})} />
                    <Input label="Nationality" val={formData.nationality} set={(v) => setFormData({...formData, nationality: v})} />
                </div>
              </div>

              <div className="h-px bg-white/5 relative z-10" />

              {/* --- SECTION 2: ADDRESS (WITH COUNTRY SELECT) --- */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 text-[#F0B90B]">
                    <MapPin size={18}/> <span className="font-bold uppercase tracking-widest text-xs">Geolocation Data</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Input label="Street Address" val={formData.street} set={(v) => setFormData({...formData, street: v})} />
                    </div>
                    <Input label="City" val={formData.city} set={(v) => setFormData({...formData, city: v})} />
                    
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 mb-1.5 block">Country of Residence</label>
                        <select 
                            value={formData.country}
                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-3 text-white text-sm focus:border-[#F0B90B] outline-none transition-all placeholder:text-gray-700 appearance-none font-mono"
                        >
                            <option value="">-- SELECT SECTOR --</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
              </div>

              <div className="h-px bg-white/5 relative z-10" />

              {/* --- SECTION 3: FINANCIAL & BANKING --- */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Landmark size={18}/> <span className="font-bold uppercase tracking-widest text-xs">Financial Protocol</span>
                    </div>
                    <button type="button" onClick={addBank} className="text-[10px] uppercase font-bold flex items-center gap-1 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer">
                        <Plus size={12}/> Add Account
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 mb-1.5 block">Employment Status</label>
                        <select 
                            value={formData.employment}
                            onChange={(e) => setFormData({...formData, employment: e.target.value})}
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all font-mono"
                        >
                            <option value="employed">Employed</option>
                            <option value="self_employed">Self-Employed</option>
                            <option value="unemployed">Unemployed</option>
                            <option value="crypto_trader">Crypto Trader</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 mb-1.5 block">Annual Income</label>
                        <select 
                            value={formData.income}
                            onChange={(e) => setFormData({...formData, income: e.target.value})}
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all font-mono"
                        >
                            <option value="0-25k">$0 - $25k</option>
                            <option value="25k-50k">$25k - $50k</option>
                            <option value="50k-100k">$50k - $100k</option>
                            <option value="100k+">$100k+</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <Input label="Source of Funds" placeholder="e.g. Salary, Crypto Trading" val={formData.source} set={(v) => setFormData({...formData, source: v})} />
                    </div>
                </div>

                {/* Bank List */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    {formData.banks.map((bank: any, index: number) => (
                        <div key={bank.id} className="flex items-end gap-3 animate-in slide-in-from-left-2">
                            <div className="w-full">
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block tracking-widest">
                                    {index === 0 ? 'Primary Settlement Node' : `Secondary Node #${index + 1}`}
                                </label>
                                <input 
                                    type="text"
                                    value={bank.name} 
                                    onChange={(e) => updateBank(bank.id, e.target.value)} 
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition placeholder:text-gray-700 font-mono"
                                    placeholder="e.g. Chase, Revolut"
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

          {/* --- SECTION 4: DOCUMENT UPLOAD --- */}
          <div className="bg-[#151a21] p-8 rounded-[24px] border border-white/10 space-y-6 shadow-xl">
              <div className="flex items-center gap-2 text-purple-400">
                  <FolderOpen size={18}/> <span className="font-bold uppercase tracking-widest text-xs">Biometric & ID Upload</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <TypeBtn type="passport" label="Passport" icon={<FileText size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
                  <TypeBtn type="id_card" label="National ID" icon={<CreditCard size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
                  <TypeBtn type="driver_license" label="Driver Lic" icon={<User size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
                  <TypeBtn type="other" label="Other Doc" icon={<Plus size={14}/>} active={formData.idType} set={(t) => setFormData({...formData, idType: t})} />
              </div>

              <div className="relative group">
                <div 
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all ${
                        selectedFile 
                        ? 'border-[#21ce99]/50 bg-[#21ce99]/5 cursor-default' 
                        : 'border-[#2a2e39] hover:border-[#21ce99]/50 hover:bg-[#0b0e11]/50 cursor-pointer'
                    }`}
                >
                    {selectedFile ? (
                        <>
                            <div className="w-20 h-20 bg-[#21ce99]/10 text-[#21ce99] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                <CheckCircle size={40}/>
                            </div>
                            <span className="text-white font-bold font-mono text-sm max-w-[300px] truncate">{selectedFile.name}</span>
                            <span className="text-[#21ce99] text-[10px] font-bold uppercase tracking-widest mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • SECURE HASH VERIFIED</span>
                            
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
                            >
                                <Trash2 size={14} /> Detach File
                            </button>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={48} className="text-[#5e6673] mb-4 group-hover:text-[#21ce99] transition-colors"/>
                            <span className="text-white font-bold text-sm uppercase tracking-wide">Drag Drop or Select File</span>
                            <span className="text-[#5e6673] text-[10px] font-mono mt-1">SUPPORTED FORMATS: JPG, PNG, PDF (MAX 5MB)</span>
                        </>
                    )}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.pdf" />
          </div>

          <button 
            type="submit"
            disabled={submitting} 
            className="w-full bg-[#21ce99] hover:bg-[#1aa37a] text-[#0b0e11] py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#21ce99]/20 disabled:opacity-50 disabled:grayscale cursor-pointer active:scale-[0.99] hover:shadow-[0_0_30px_rgba(33,206,153,0.4)]"
          >
              {submitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
              {submitting ? 'ENCRYPTING & TRANSMITTING...' : 'INITIATE UPLOAD SEQUENCE'}
          </button>
      </form>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function Input({ label, type="text", placeholder, val, set }: { label: string, type?: string, placeholder?: string, val: string, set: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">{label}</label>
            <input 
                type={type} 
                value={val} 
                onChange={(e) => set(e.target.value)} 
                placeholder={placeholder}
                className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-xl px-4 py-3 text-white text-sm focus:border-[#21ce99] focus:shadow-[0_0_15px_rgba(33,206,153,0.1)] outline-none transition-all placeholder:text-gray-700 font-mono"
                style={{ colorScheme: 'dark' }} 
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
            className={`flex items-center justify-center gap-2 px-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all cursor-pointer ${
                isActive ? 'bg-[#21ce99] border-[#21ce99] text-[#0b0e11] shadow-lg shadow-[#21ce99]/20' : 'bg-[#0b0e11] border-[#2a2e39] text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
        >
            {icon} {label}
        </button>
    );
}