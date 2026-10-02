import { useState } from 'react';
import { Flame, Shield, ArrowRight, UserCheck, Briefcase, Building, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Register() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | 'org_admin'>('candidate');

  const handleRegister = () => {
    window.location.href = '/api/auth/google/url';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001621] p-4 sm:p-6 selection:bg-[#FF4103] selection:text-white relative overflow-hidden">
      
      {/* Background Volcanic Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF4103]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl w-full bg-[#001f2e] border border-[#063750] rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10">
        
        {/* Top Flame Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF4103] via-[#ff7847] to-[#e03200] rounded-t-3xl" />

        <div className="text-center mb-8">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF4103]/30">
            <Flame className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Create Your IntelliHire Account
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
            Choose your primary role to access role-specific evidence engines and dashboards.
          </p>
        </div>

        {/* Role Persona Selector Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setSelectedRole('candidate')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedRole === 'candidate'
                ? 'bg-[#00273c] border-[#FF4103] shadow-lg shadow-[#FF4103]/15'
                : 'bg-[#001621] border-[#002b40] hover:border-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              selectedRole === 'candidate' ? 'bg-[#FF4103] text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-white mb-1">Candidate</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify competencies, optimize resume ATS scores, and take adaptive assessments.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('recruiter')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedRole === 'recruiter'
                ? 'bg-[#00273c] border-[#FF4103] shadow-lg shadow-[#FF4103]/15'
                : 'bg-[#001621] border-[#002b40] hover:border-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              selectedRole === 'recruiter' ? 'bg-[#FF4103] text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-white mb-1">Recruiter</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Post requisitions, review evidence packages, and inspect candidate match models.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('org_admin')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              selectedRole === 'org_admin'
                ? 'bg-[#00273c] border-[#FF4103] shadow-lg shadow-[#FF4103]/15'
                : 'bg-[#001621] border-[#002b40] hover:border-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              selectedRole === 'org_admin' ? 'bg-[#FF4103] text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Building className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-white mb-1">Organization</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise governance, tenant quotas, custom rubrics, and audit event logs.
            </p>
          </button>
        </div>

        {/* Benefits List */}
        <div className="p-4 rounded-2xl bg-[#001621] border border-[#002b40] mb-8 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-[#FF4103] shrink-0" />
            <span>Instant single sign-on with verified Google corporate or personal accounts</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-[#FF4103] shrink-0" />
            <span>Zero spam, zero tracking cookies, deterministic PII redaction</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-[#FF4103] shrink-0" />
            <span>Full compliance with universal evidence standards and human decision boundaries</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRegister}
          className="w-full py-4 px-6 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] shadow-xl shadow-[#FF4103]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <span>Continue with Google as {selectedRole.replace('_', ' ').toUpperCase()}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-8 text-center pt-6 border-t border-[#002a40] space-y-3">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF4103] font-bold hover:underline">
              Sign In Here
            </Link>
          </p>
          <div>
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              &larr; Back to IntelliHire Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
