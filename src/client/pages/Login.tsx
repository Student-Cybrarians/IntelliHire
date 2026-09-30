import { Bot } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-sky-400"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">IntelliHire</h2>
          <p className="text-slate-400 text-center">
            Authentication is currently unavailable. Google OAuth has been removed from IntelliHire.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400 text-center">
          No external OAuth provider is configured for this application.
        </div>
      </div>
    </div>
  );
}
