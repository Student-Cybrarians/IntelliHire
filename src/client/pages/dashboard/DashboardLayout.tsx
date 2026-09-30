import { ReactNode } from 'react';
import { Bot, CheckCircle, FileText, Code2, Users, Briefcase, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardLayout({ children, role, userFullName }: { children: ReactNode, role: string, userFullName: string }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <Bot className="w-8 h-8 text-brand-500" />
          <span className="text-xl font-bold tracking-tight text-slate-100">IntelliHire</span>
        </div>

        <nav className="flex-grow space-y-2">
          {role === 'candidate' && (
            <>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-500/10 text-brand-400 font-medium"><CheckCircle className="w-5 h-5" /> Command Center</Link>
              <Link to="/resume" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"><FileText className="w-5 h-5" /> Resume Studio</Link>
              <Link to="/technical-sandbox" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"><Code2 className="w-5 h-5" /> Technical Sandbox</Link>
            </>
          )}

          {role === 'recruiter' && (
            <>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-500/10 text-brand-400 font-medium"><Briefcase className="w-5 h-5" /> Pipeline Overview</Link>
              <Link to="/requisitions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"><Users className="w-5 h-5" /> Active Requisitions</Link>
            </>
          )}

          {role === 'org_admin' && (
            <>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-500/10 text-brand-400 font-medium"><Briefcase className="w-5 h-5" /> Pipeline Overview</Link>
              <Link to="/requisitions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"><Users className="w-5 h-5" /> Active Requisitions</Link>
              <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"><Settings className="w-5 h-5" /> Organization Settings</Link>
              <Link to="/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"><Users className="w-5 h-5" /> User Management</Link>
            </>
          )}
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-slate-700 uppercase">
                {getInitials(userFullName || 'U')}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{userFullName}</p>
                <p className="text-xs text-slate-500 capitalize">{role.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-slate-300" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
