import { ReactNode } from 'react';
import { 
  Flame, CheckCircle, FileText, Target, Users, Briefcase, 
  Settings, LogOut, ShieldCheck, UserCheck, Layers, Brain, 
  BarChart3, GraduationCap, Home, Laptop
} from 'lucide-react';
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

  const isCandidate = role === 'candidate';
  const homePath = isCandidate ? '/dashboard' : '/';

  return (
    <div className="min-h-screen bg-[#001621] text-slate-100 flex flex-col md:flex-row selection:bg-[#FF4103] selection:text-white">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#001824] border-r border-[#063750] p-6 flex flex-col shrink-0">
        
        {/* Brand Header */}
        <Link 
          to={homePath} 
          className="flex items-center gap-2.5 mb-8 group focus:outline-none focus:ring-2 focus:ring-[#FF4103] rounded-xl p-1"
          title="IntelliHire"
          aria-label="IntelliHire Brand"
        >
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

              {/* 1. IntelliHire Home */}
              <Link 
                to={homePath} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="IntelliHire Home"
              >
                <Home className={`w-4 h-4 shrink-0 ${isActive('/') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="truncate">IntelliHire Home</span>
              </Link>
              
              {/* 2. Dashboard · Learning Progress */}
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="Dashboard · Learning Progress"
              >
                <CheckCircle className={`w-4 h-4 shrink-0 ${isActive('/dashboard') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="truncate">Dashboard · Learning Progress</span>
              </Link>
              
              {/* 3. Module 1 · Resume Intelligence */}
              <Link 
                to="/resume" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/resume') || isActive('/module-1')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="Module 1 · Resume Intelligence"
              >
                <FileText className={`w-4 h-4 shrink-0 ${isActive('/resume') || isActive('/module-1') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="truncate">Module 1 · Resume Intelligence</span>
              </Link>

              {/* 4. Module 2 · Aptitude / Assessment Preparation */}
              <Link 
                to="/assess" 
                className={`flex items-start gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/assess') || isActive('/module-2') || isActive('/interview-prep') || isActive('/prep')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="Module 2 · Aptitude / Assessment Preparation"
              >
                <Target className={`w-4 h-4 mt-0.5 shrink-0 ${isActive('/assess') || isActive('/module-2') || isActive('/interview-prep') || isActive('/prep') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="leading-tight text-xs sm:text-sm">Module 2 · Aptitude / Assessment Preparation</span>
              </Link>

              {/* 5. Module 3 · Technical Round */}
              <Link 
                to="/simulation" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/simulation') || isActive('/technical-sandbox') || isActive('/sandbox') || isActive('/module-3')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="Module 3 · Technical Round"
              >
                <Laptop className={`w-4 h-4 shrink-0 ${isActive('/simulation') || isActive('/technical-sandbox') || isActive('/sandbox') || isActive('/module-3') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="truncate">Module 3 · Technical Round</span>
              </Link>

              {/* 6. Module 4 · HR Round */}
              <Link 
                to="/interviews" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/interviews') || isActive('/module-4') || isActive('/hr-round')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="Module 4 · HR Round"
              >
                <Brain className={`w-4 h-4 shrink-0 ${isActive('/interviews') || isActive('/module-4') || isActive('/hr-round') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="truncate">Module 4 · HR Round</span>
              </Link>

              {/* 7. Module 5 · Results */}
              <Link 
                to="/results" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/results') || isActive('/readiness') || isActive('/module-5') || isActive('/analytics')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
                title="Module 5 · Results"
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${isActive('/results') || isActive('/readiness') || isActive('/module-5') || isActive('/analytics') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span className="truncate">Module 5 · Results</span>
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

              <Link 
                to="/learning" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/learning') || isActive('/training') || isActive('/curriculum')
                    ? 'bg-[#FF4103]/15 border border-[#FF4103]/40 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${isActive('/learning') || isActive('/training') || isActive('/curriculum') ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                <span>M6 · Cohort Pathways</span>
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
        <div className="pt-4 border-t border-[#063750] mt-auto">
          <div className="flex items-center justify-between gap-2">
            <Link 
              to={isCandidate ? "/candidate" : "/settings"} 
              className="flex items-center gap-3 overflow-hidden group hover:opacity-90 transition-opacity flex-grow focus:outline-none focus:ring-1 focus:ring-[#FF4103] rounded-lg p-1"
              title={isCandidate ? "View Candidate Profile" : "Account Settings"}
              aria-label={isCandidate ? "Candidate Profile" : "Account Settings"}
            >
              <div className="w-10 h-10 rounded-xl bg-[#002538] border border-[#063750] group-hover:border-[#FF4103]/50 flex items-center justify-center text-white font-bold text-sm shrink-0 transition-colors">
                {getInitials(userFullName || 'U')}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#FF4103] transition-colors">{userFullName || 'User'}</p>
                <p className="text-xs text-[#FF4103] capitalize truncate">{role.replace('_', ' ')}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-white hover:bg-[#002538] rounded-lg transition-colors shrink-0" 
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {isCandidate && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#00273c] text-xs">
              <Link 
                to="/candidate" 
                className="text-slate-400 hover:text-[#FF4103] transition-colors font-semibold"
              >
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 transition-colors font-semibold"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 sm:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
