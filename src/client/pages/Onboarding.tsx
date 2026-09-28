import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, ArrowRight, Code } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_role: targetRole,
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800/50 p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
            <p className="text-sm text-slate-400">Step {step} of 2</p>
          </div>
          <div className="flex gap-2">
            <div className={`w-12 h-1 rounded-full ${step >= 1 ? 'bg-brand-500' : 'bg-slate-700'}`}></div>
            <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-brand-500' : 'bg-slate-700'}`}></div>
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white">What is your target role?</h3>
              <p className="text-slate-400">This helps us personalize your assessment blueprint and mock interviews.</p>
              
              <div className="space-y-3">
                {[
                  { id: 'software', icon: Code, label: 'Software Engineer (Frontend, Backend, Fullstack)' },
                  { id: 'product', icon: Briefcase, label: 'Product Manager / Owner' },
                  { id: 'data', icon: GraduationCap, label: 'Data Scientist / Analyst' }
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setTargetRole(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      targetRole === role.id 
                        ? 'bg-brand-500/10 border-brand-500 text-white' 
                        : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <role.icon className={`w-6 h-6 ${targetRole === role.id ? 'text-brand-500' : 'text-slate-500'}`} />
                    <span className="font-medium">{role.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!targetRole}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
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
                  onClick={() => setStep(1)}
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
