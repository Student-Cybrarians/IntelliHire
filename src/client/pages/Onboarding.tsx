import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Loader2, Search, Flame, CheckCircle2 } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  icon?: string;
}

interface Occupation {
  id: string;
  name: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [targetDomainId, setTargetDomainId] = useState('');
  const [targetOccupationId, setTargetOccupationId] = useState('');
  const [experience, setExperience] = useState('');
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [occupationSearch, setOccupationSearch] = useState('');

  useEffect(() => {
    fetch('/api/taxonomy/domains')
      .then(res => res.json())
      .then((data: any) => {
        setDomains(Array.isArray(data) ? data : (data.domains || []));
        setLoadingDomains(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingDomains(false);
      });
  }, []);

  useEffect(() => {
    if (targetDomainId) {
      setLoadingOccupations(true);
      setTargetOccupationId('');
      setOccupationSearch('');
      fetch(`/api/taxonomy/occupations?domain_id=${targetDomainId}`)
        .then(res => res.json())
        .then((data: any) => {
          setOccupations(Array.isArray(data) ? data : (data.occupations || []));
          setLoadingOccupations(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingOccupations(false);
        });
    }
  }, [targetDomainId]);

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_domain_id: targetDomainId,
          target_occupation_id: targetOccupationId,
          experience_level: experience,
        }),
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const filteredOccupations = occupations.filter(occ => 
    occ.name.toLowerCase().includes(occupationSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#001621] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#FF4103] selection:text-white relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-[#FF4103]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#001f2e] border border-[#063750] rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#FF4103] via-[#ff7847] to-[#e03200]" />

        {/* Header */}
        <div className="bg-[#001824] p-6 border-b border-[#063750] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center shadow-md">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
              <p className="text-xs text-slate-400">Step {step} of 3</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className={`w-10 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-[#FF4103]' : 'bg-[#002f47]'}`} />
            <div className={`w-10 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-[#FF4103]' : 'bg-[#002f47]'}`} />
            <div className={`w-10 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-[#FF4103]' : 'bg-[#002f47]'}`} />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Select your domain</h3>
                <p className="text-slate-400 text-sm mt-1">Which broad occupational field are you focusing on?</p>
              </div>
              
              {loadingDomains ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#FF4103] animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {domains.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => setTargetDomainId(domain.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        targetDomainId === domain.id 
                          ? 'bg-[#FF4103]/15 border-[#FF4103] text-white shadow-md shadow-[#FF4103]/10' 
                          : 'bg-[#001824] border-[#002f47] text-slate-300 hover:bg-[#002538] hover:border-[#063750]'
                      }`}
                    >
                      <Briefcase className={`w-5 h-5 ${targetDomainId === domain.id ? 'text-[#FF4103]' : 'text-slate-500'}`} />
                      <span className="font-semibold text-sm">{domain.name}</span>
                    </button>
                  ))}
                  {domains.length === 0 && (
                    <div className="text-slate-400 text-center py-8">No domains found.</div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-[#00283d] flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!targetDomainId}
                  className="px-6 py-3 bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">What is your specific occupation?</h3>
                <p className="text-slate-400 text-sm mt-1">Search and select your target role.</p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search occupations..."
                  value={occupationSearch}
                  onChange={(e) => setOccupationSearch(e.target.value)}
                  className="w-full bg-[#001824] border border-[#002f47] rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF4103] focus:ring-2 focus:ring-[#FF4103]/30 transition-all text-sm"
                  aria-autocomplete="list"
                  role="combobox"
                  aria-expanded="true"
                />
              </div>

              {loadingOccupations ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#FF4103] animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1" role="listbox">
                  {filteredOccupations.map((occ) => (
                    <button
                      key={occ.id}
                      onClick={() => setTargetOccupationId(occ.id)}
                      role="option"
                      aria-selected={targetOccupationId === occ.id}
                      className={`w-full flex items-center p-3.5 rounded-xl border text-left transition-all ${
                        targetOccupationId === occ.id 
                          ? 'bg-[#FF4103]/15 border-[#FF4103] text-white shadow-sm' 
                          : 'bg-transparent border-transparent text-slate-300 hover:bg-[#002538]'
                      }`}
                    >
                      <span className="font-semibold text-sm">{occ.name}</span>
                    </button>
                  ))}
                  {filteredOccupations.length === 0 && (
                    <div className="text-slate-400 text-center py-8 text-sm">
                      No occupations found matching "{occupationSearch}".
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-[#00283d] flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-[#001824] hover:bg-[#002538] border border-[#002f47] text-white font-semibold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!targetOccupationId}
                  className="px-6 py-3 bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Experience Level</h3>
                <p className="text-slate-400 text-sm mt-1">We calibrate the difficulty and ambiguity of your simulations based on your seniority.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'entry', label: 'Entry Level', sub: '0-2 years' },
                  { id: 'mid', label: 'Mid Level', sub: '3-5 years' },
                  { id: 'senior', label: 'Senior', sub: '5-8+ years' },
                  { id: 'lead', label: 'Lead / Staff', sub: '8+ years' }
                ].map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setExperience(exp.id)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all ${
                      experience === exp.id 
                        ? 'bg-[#FF4103]/15 border-[#FF4103] text-white shadow-md shadow-[#FF4103]/15' 
                        : 'bg-[#001824] border-[#002f47] text-slate-300 hover:bg-[#002538] hover:border-[#063750]'
                    }`}
                  >
                    <span className="font-bold text-lg text-white">{exp.label}</span>
                    <span className="text-xs text-slate-400 mt-1">{exp.sub}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-[#00283d] flex justify-between">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#001824] hover:bg-[#002538] border border-[#002f47] text-white font-semibold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={!experience}
                  className="px-6 py-3 bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
                >
                  Generate Blueprint <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
