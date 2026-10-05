import { ReactNode } from 'react';
import { Flame, CheckCircle, FileText, Target, Users, Briefcase, Settings, LogOut, ShieldCheck, UserCheck, Layers, Brain, BarChart3 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children, role, userFullName }: { children: ReactNode, role: string, userFullName: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/');
  };

  const getInitials = (name: string) => (name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2);
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#001621] text-slate-100 flex flex-col md:flex-row selection:bg-[#FF4103] selection:text-white">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#001824] border-r border-[#063750] p-6 flex flex-col shrink-0">
        
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center shadow-lg shadow-[#FF4103]/25 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white group-hover:text-[#FF4103] transition-colors">
              IntelliHire
            </span>
            <div className="text-[10px] text-[#FF4103] font-bold uppercase tracking-wider">
              {role.replace('_', ' ')}
            </div>
          </div>
        </Link>

        {/* Navigation Sections */}
        <nav className="flex-grow space-y-1.5" aria-label="Dashboard Navigation">
          {role === 'candidate' && (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">
                Workspace
              </div>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${isActive('/dashboard') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>Command Center</span>
              </Link>
              
              <Link 
                to="/resume" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/resume')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <FileText className={`w-4 h-4 ${isActive('/resume') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M1 · Resume Studio</span>
              </Link>

              <Link 
                to="/assess" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/assess')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Target className={`w-4 h-4 ${isActive('/assess') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M2 · Adaptive Assessment</span>
              </Link>

              <Link 
                to="/candidate" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/candidate')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${isActive('/candidate') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>Evidence Portfolio</span>
              </Link>

              <Link 
                to="/readiness" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/readiness') || isActive('/module-5')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${isActive('/readiness') || isActive('/module-5') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M5 · Readiness Synthesis</span>
              </Link>
            </>
          )}

          {role === 'recruiter' && (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">
                Recruitment Engine
              </div>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Briefcase className={`w-4 h-4 ${isActive('/dashboard') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>Pipeline Overview</span>
              </Link>
              
              <Link 
                to="/module-3" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/module-3') || isActive('/requisitions') || isActive('/candidates')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Users className={`w-4 h-4 ${isActive('/module-3') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M3 · Requisitions & Match</span>
              </Link>

              <Link 
                to="/module-4" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/module-4') || isActive('/interviews')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Brain className={`w-4 h-4 ${isActive('/module-4') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M4 · Structured Interviews</span>
              </Link>

              <Link 
                to="/module-5" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/module-5') || isActive('/analytics') || isActive('/readiness')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${isActive('/module-5') || isActive('/analytics') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M5 · Decision Cockpit</span>
              </Link>
            </>
          )}

          {role === 'org_admin' && (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">
                Administration
              </div>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#FF4103]" />
                <span>Executive Overview</span>
              </Link>
              
              <Link 
                to="/admin" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/admin')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#FF4103]" />
                <span>Org Control & Quotas</span>
              </Link>

              <Link 
                to="/settings" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/settings')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Organization Settings</span>
              </Link>

              <Link 
                to="/users" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/users')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>User Management</span>
              </Link>
            </>
          )}
        </nav>

        {/* Profile Card & Logout */}
        <div className="pt-6 border-t border-[#063750] mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#002538] border border-[#063750] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {getInitials(userFullName || 'U')}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{userFullName || 'User'}</p>
                <p className="text-xs text-[#FF4103] capitalize truncate">{role.replace('_', ' ')}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-white hover:bg-[#002538] rounded-lg transition-colors" 
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 sm:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
