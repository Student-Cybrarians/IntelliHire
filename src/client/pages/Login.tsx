import { useState } from 'react';
import { Flame, Shield, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/google/url';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001621] p-4 sm:p-6 selection:bg-[#FF4103] selection:text-white relative overflow-hidden">
      
      {/* Background Volcanic Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF4103]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#001f2e] border border-[#063750] rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        
        {/* Top Flame Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF4103] via-[#ff7847] to-[#e03200] rounded-t-3xl" />

        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center mb-4 shadow-lg shadow-[#FF4103]/30">
            <Flame className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign In to IntelliHire
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Access your Universal Evidence Portfolio, assessments, and recruiting workspaces.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-60 focus:ring-4 focus:ring-[#FF4103]/40"
            aria-label="Continue with Google SSO"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span className="text-sm font-bold">Continue with Google SSO</span>
          </button>

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-[#002f47]" />
            <span className="flex-shrink-0 mx-3 text-xs uppercase font-bold text-slate-500 tracking-wider">
              Enterprise Tenant Security
            </span>
            <div className="flex-grow border-t border-[#002f47]" />
          </div>

          <div className="p-4 rounded-xl bg-[#001621] border border-[#002b3f] space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Shield className="w-4 h-4 text-[#FF4103]" />
              <span>Zero Credential Retention</span>
            </div>
            <p className="leading-relaxed">
              Sessions are cryptographically signed with HS256 tokens stored in Cloudflare KV. PII is automatically redacted before LLM evaluation.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#002a40] text-center space-y-3">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#FF4103] font-bold hover:underline">
              Create an Account
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
