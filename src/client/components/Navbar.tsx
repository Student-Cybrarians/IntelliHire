import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, ArrowRight, Menu, X, Layers, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id?: string; full_name?: string; role?: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (active && data?.user?.id) {
          setAuthenticatedUser(data.user);
        }
      })
      .catch(() => {
        // Public page: ignore auth lookup errors when unauthenticated
      });
    return () => {
      active = false;
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const primaryNavLinks = [
    { name: 'Mission', href: '/#mission', isAnchor: true },
    { name: 'Lifecycle', href: '/#lifecycle', isAnchor: true },
    { name: 'Modules', href: '/#modules', isAnchor: true },
    { name: 'Walkthrough', href: '/#walkthrough', isAnchor: true },
    { name: 'Pricing', href: '/#pricing', isAnchor: true },
    { name: 'Trust & AI', href: '/#trust', isAnchor: true },
    { name: 'FAQ', href: '/#faq', isAnchor: true },
    { name: 'About', href: '/about', isAnchor: false }
  ];

  const moduleLinks = [
    { name: 'M1 · Resume Intelligence & ATS', path: '/resume' },
    { name: 'M2 · Adaptive Assessment & Prep', path: '/assess' },
    { name: 'M2 · Targeted Learning Pathways', path: '/learning' },
    { name: 'M3 · Domain & Task Simulation', path: '/simulation' },
    { name: 'M4 · Structured AI Interviewing', path: '/interviews' },
    { name: 'M5 · Readiness & Decision Support', path: '/results' }
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#001621]/90 border-b border-[#00273c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo & Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103] rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center shadow-lg shadow-[#FF4103]/25 group-hover:scale-105 transition-transform duration-200 motion-reduce:transition-none">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-[#FF4103] transition-colors">
                  IntelliHire
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30">
                  Universal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Evidence-Driven Career Readiness
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Main Navigation">
            {primaryNavLinks.map((link) =>
              link.isAnchor && location.pathname === '/' ? (
                <a
                  key={link.name}
                  href={link.href.replace('/', '')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#002538] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103]"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103] ${
                    isActive(link.href)
                      ? 'text-white bg-[#FF4103]/15 border border-[#FF4103]/40'
                      : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                  }`}
                >
                  {link.name}
                </Link>
              )
            )}

            {/* Modules Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#002538] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103]"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <Layers className="w-4 h-4 text-[#FF4103]" />
                <span>Workspaces (M1–M5)</span>
              </button>
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#001f2e] border border-[#063750] shadow-2xl py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 z-50">
                {moduleLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103] focus:bg-[#00273c] focus:text-[#FF4103] focus:outline-none"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FF4103] shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {authenticatedUser ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] rounded-xl shadow-lg shadow-[#FF4103]/25 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#002538] rounded-xl transition-colors border border-[#063750] hover:border-[#FF4103]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] rounded-xl shadow-lg shadow-[#FF4103]/25 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-2">
            {authenticatedUser ? (
              <Link
                to="/dashboard"
                className="text-xs px-3 py-1.5 font-bold text-white bg-[#FF4103] rounded-lg sm:hidden"
              >
                Workspace
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs px-3 py-1.5 font-semibold text-white bg-[#FF4103] rounded-lg sm:hidden"
              >
                Sign In
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-[#002538] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103]"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#001b2a] border-b border-[#00273c] px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {primaryNavLinks.map((link) =>
              link.isAnchor && location.pathname === '/' ? (
                <a
                  key={link.name}
                  href={link.href.replace('/', '')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-[#002538]"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-[#002538]"
                >
                  {link.name}
                </Link>
              )
            )}
          </div>

          <div className="pt-3 border-t border-[#00273c]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Platform Workspaces
            </div>
            <div className="space-y-1">
              {moduleLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#002538]"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#00273c] flex flex-col gap-2">
            {authenticatedUser ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-[#FF4103] text-white font-bold shadow-md shadow-[#FF4103]/30"
              >
                Open Command Center Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-[#063750] text-slate-200 font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-[#FF4103] text-white font-semibold shadow-md shadow-[#FF4103]/30"
                >
                  Create Account (Candidate / Recruiter)
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
