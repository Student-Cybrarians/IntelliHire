import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Code, Loader2, Search } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800/50 p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
            <p className="text-sm text-slate-400">Step {step} of 3</p>
          </div>
          <div className="flex gap-2">
            <div className={`w-12 h-1 rounded-full ${step >= 1 ? 'bg-brand-500' : 'bg-slate-700'}`}></div>
            <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-brand-500' : 'bg-slate-700'}`}></div>
            <div className={`w-12 h-1 rounded-full ${step >= 3 ? 'bg-brand-500' : 'bg-slate-700'}`}></div>
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white">Select your domain</h3>
              <p className="text-slate-400">Which broad field are you focusing on?</p>
              
              {loadingDomains ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {domains.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => setTargetDomainId(domain.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        targetDomainId === domain.id 
                          ? 'bg-brand-500/10 border-brand-500 text-white' 
                          : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <Briefcase className={`w-6 h-6 ${targetDomainId === domain.id ? 'text-brand-500' : 'text-slate-500'}`} />
                      <span className="font-medium">{domain.name}</span>
                    </button>
                  ))}
                  {domains.length === 0 && (
                    <div className="text-slate-400 text-center py-8">No domains found.</div>
                  )}
                </div>
              )}

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!targetDomainId}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white">What is your specific occupation?</h3>
              <p className="text-slate-400">Search and select your target role.</p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search occupations..."
                  value={occupationSearch}
                  onChange={(e) => setOccupationSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  aria-autocomplete="list"
                  role="combobox"
                  aria-expanded="true"
                />
              </div>

              {loadingOccupations ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2" role="listbox">
                  {filteredOccupations.map((occ) => (
                    <button
                      key={occ.id}
                      onClick={() => setTargetOccupationId(occ.id)}
                      role="option"
                      aria-selected={targetOccupationId === occ.id}
                      className={`w-full flex items-center p-3 rounded-lg border text-left transition-all ${
                        targetOccupationId === occ.id 
                          ? 'bg-brand-500/10 border-brand-500 text-white' 
                          : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-medium">{occ.name}</span>
                    </button>
                  ))}
                  {filteredOccupations.length === 0 && (
                    <div className="text-slate-400 text-center py-8">No occupations found matching "{occupationSearch}".</div>
                  )}
                </div>
              )}

              <div className="pt-6 flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!targetOccupationId}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white">Experience Level</h3>
              <p className="text-slate-400">We calibrate the difficulty of your simulations based on your seniority.</p>
              
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
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border text-center transition-all ${
                      experience === exp.id 
                        ? 'bg-brand-500/10 border-brand-500 text-white' 
                        : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-semibold text-lg">{exp.label}</span>
                    <span className="text-sm opacity-70 mt-1">{exp.sub}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 flex justify-between">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg"
                >
                  Back
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={!experience}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2"
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
