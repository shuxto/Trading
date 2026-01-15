import { Upload, FileText, AlertCircle } from 'lucide-react'; // <-- Removed CheckCircle
import { useState } from 'react';

export default function VerificationTab() {
  const [status, setStatus] = useState<'pending' | 'verified' | 'unverified'>('unverified');

  const handleUpload = (e: any) => {
    e.preventDefault();
    // Logic to upload to Supabase Storage would go here
    setStatus('pending');
    alert("Documents uploaded! Admin will review shortly.");
  };

  return (
    <div className="max-w-2xl animate-in fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">Identity Verification (KYC)</h2>
      
      {status === 'unverified' && (
        <div className="bg-[#1e232d] p-8 rounded-2xl border border-[#2a2e39]">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-[#F07000]/20 rounded-lg text-[#F07000]">
               <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Account Not Verified</h3>
              <p className="text-[#8b9bb4] text-sm mt-1">Please upload a valid Government ID to unlock withdrawals.</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleUpload}>
            <div className="border-2 border-dashed border-[#2a2e39] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#21ce99] transition-colors cursor-pointer bg-[#0b0e11]">
              <Upload size={32} className="text-[#5e6673] mb-3" />
              <span className="text-white font-bold">Click to upload ID Front</span>
              <span className="text-[#5e6673] text-xs mt-1">JPG, PNG or PDF (Max 5MB)</span>
              <input type="file" className="hidden" />
            </div>
            
            <button className="w-full bg-[#21ce99] text-[#0b0e11] font-bold py-3 rounded-xl hover:bg-[#1db586] transition-colors">
              Submit Documents
            </button>
          </form>
        </div>
      )}

      {status === 'pending' && (
        <div className="bg-[#1e232d] p-8 rounded-2xl border border-[#2a2e39] text-center">
           <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <FileText size={32} />
           </div>
           <h3 className="text-xl font-bold text-white">Verification Pending</h3>
           <p className="text-[#8b9bb4] mt-2">Our team is reviewing your documents. This usually takes 24 hours.</p>
        </div>
      )}
    </div>
  );
}