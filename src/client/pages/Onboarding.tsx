import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, ArrowRight, Code, Database, Sparkles, CheckCircle2 } from 'lucide-react';

const roles = [
  { id: 'software', icon: Code, label: 'Software Engineer', sub: 'Frontend, Backend, Fullstack' },
  { id: 'product', icon: Briefcase, label: 'Product Manager / Owner', sub: 'Product, strategy, delivery' },
  { id: 'data', icon: GraduationCap, label: 'Data Scientist / Analyst', sub: 'Analytics, ML, data engineering' },
  { id: 'other', icon: Database, label: 'Other professional role', sub: 'We will personalize from your profile' },
];

const domains = ['Software & Technology','Data & AI','Finance & Banking','Healthcare','Consulting','Product & Operations','Sales & Marketing','Other'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');
  const [domain, setDomain] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole,
          experience_level: experience,
          primary_domain: domain,
          skills_json: JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 30)),
          bio: bio.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to save your profile');
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Unable to save profile');
    } finally { setSaving(false); }
  };

  const canContinue = step === 1 ? !!targetRole : step === 2 ? !!experience : true;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800/50 p-6 border-b border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-brand-400 text-sm font-medium"><Sparkles className="w-4 h-4"/> IntelliHire profile setup</div>
              <h2 className="text-xl font-bold text-white mt-1">Build your candidate context</h2>
              <p className="text-sm text-slate-400">This context personalizes assessments, simulations, matching and readiness evidence.</p>
            </div>
            <span className="text-sm text-slate-400">Step {step} of 4</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[1,2,3,4].map(n => <div key={n} className={`h-1 rounded-full ${step >= n ? 'bg-brand-500' : 'bg-slate-700'}`}/>)}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && <section className="space-y-6">
            <div><h3 className="text-2xl font-semibold text-white">What role are you targeting?</h3><p className="text-slate-400 mt-1">Choose the role that should anchor your competency and assessment blueprint.</p></div>
            <div className="grid md:grid-cols-2 gap-3">
              {roles.map(role => <button key={role.id} onClick={() => setTargetRole(role.id)} className={`text-left p-4 rounded-xl border transition-all ${targetRole === role.id ? 'bg-brand-500/10 border-brand-500 text-white' : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                <div className="flex gap-3 items-start"><role.icon className={`w-6 h-6 mt-0.5 ${targetRole === role.id ? 'text-brand-400' : 'text-slate-500'}`}/><div><div className="font-semibold">{role.label}</div><div className="text-xs text-slate-500 mt-1">{role.sub}</div></div></div>
              </button>)}
            </div>
          </section>}

          {step === 2 && <section className="space-y-6">
            <div><h3 className="text-2xl font-semibold text-white">What is your experience level?</h3><p className="text-slate-400 mt-1">Used to calibrate difficulty. It is a starting context, not an assessment result.</p></div>
            <div className="grid grid-cols-2 gap-3">
              {[['entry','Entry Level','0–2 years'],['mid','Mid Level','3–5 years'],['senior','Senior','5–8+ years'],['lead','Lead / Staff','8+ years']].map(([id,label,sub]) => <button key={id} onClick={() => setExperience(id)} className={`p-5 rounded-xl border text-center transition-all ${experience === id ? 'bg-brand-500/10 border-brand-500 text-white' : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                <div className="font-semibold">{label}</div><div className="text-xs text-slate-500 mt-1">{sub}</div>
              </button>)}
            </div>
          </section>}

          {step === 3 && <section className="space-y-6">
            <div><h3 className="text-2xl font-semibold text-white">Add professional context</h3><p className="text-slate-400 mt-1">These fields improve personalization. Do not add claims you cannot support.</p></div>
            <div><label className="block text-sm text-slate-300 mb-2">Primary domain</label><select value={domain} onChange={e=>setDomain(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-white"><option value="">Select a domain</option>{domains.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="block text-sm text-slate-300 mb-2">Key skills <span className="text-slate-500">(comma separated)</span></label><input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Python, React, SQL, communication" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-white placeholder:text-slate-600"/></div>
            <div><label className="block text-sm text-slate-300 mb-2">Professional summary <span className="text-slate-500">(optional)</span></label><textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={1000} rows={5} placeholder="Briefly describe your professional focus, goals or background." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-white placeholder:text-slate-600"/></div>
          </section>}

          {step === 4 && <section className="space-y-6">
            <div><h3 className="text-2xl font-semibold text-white">Ready to build your workspace?</h3><p className="text-slate-400 mt-1">Review your starting context. Resume evidence and assessments will add verified evidence later.</p></div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              {[['Target role',targetRole],['Experience',experience],['Domain',domain || 'Not specified'],['Skills',skills || 'Not specified']].map(([k,v])=><div key={k} className="flex justify-between gap-4 text-sm"><span className="text-slate-500">{k}</span><span className="text-slate-200 text-right">{v}</span></div>)}
            </div>
            <div className="flex gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10"><CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0"/><p className="text-sm text-slate-300">Your onboarding answers are context, not proof. IntelliHire should use resume and assessment evidence to verify skills.</p></div>
          </section>}

          {error && <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
          <div className="pt-8 flex justify-between">
            <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1 || saving} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg">Back</button>
            {step < 4 ? <button onClick={()=>setStep(step+1)} disabled={!canContinue} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">Continue <ArrowRight className="w-4 h-4"/></button>
              : <button onClick={handleComplete} disabled={saving} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">{saving ? 'Saving…' : 'Build My Workspace'} <ArrowRight className="w-4 h-4"/></button>}
          </div>
        </div>
      </div>
    </div>
  );
}