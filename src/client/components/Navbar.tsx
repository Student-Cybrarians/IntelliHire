import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, Shield, ArrowRight, Menu, X, Sparkles, Layers } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Modules', path: '/#modules' },
    { name: 'M1 Resume', path: '/resume' },
    { name: 'M2 Assessment', path: '/assess' },
    { name: 'M3 Pipeline', path: '/module-3' },
    { name: 'M4 Interview', path: '/module-4' },
    { name: 'M5 Analytics', path: '/module-5' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#001621]/80 border-b border-[#00273c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#FF4103] rounded-lg p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center shadow-lg shadow-[#FF4103]/25 group-hover:scale-105 transition-transform duration-200">
              <Flame className="w-6 h-6 text-white animate-pulse" />
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
                Evidence & Competency Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.slice(0, 4).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-[#FF4103]/15 border border-[#FF4103]/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#002538]'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Modules Dropdown / Badge */}
            <div className="relative group">
              <button 
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-[#002538] transition-colors"
                aria-expanded="false"
              >
                <Layers className="w-4 h-4 text-[#FF4103]" />
                <span>Engine Slices</span>
              </button>
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-[#001f2e] border border-[#063750] shadow-2xl py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <Link to="/resume" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103]">
                  <span className="w-2 h-2 rounded-full bg-[#FF4103]"></span>
                  M1 · Resume Intelligence
                </Link>
                <Link to="/assess" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103]">
                  <span className="w-2 h-2 rounded-full bg-[#FF4103]"></span>
                  M2 · Universal Adaptive Assessment
                </Link>
                <Link to="/module-3" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103]">
                  <span className="w-2 h-2 rounded-full bg-[#FF4103]"></span>
                  M3 · Pipeline & Candidate Match
                </Link>
                <Link to="/module-4" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103]">
                  <span className="w-2 h-2 rounded-full bg-[#FF4103]"></span>
                  M4 · Structured Interview Intelligence
                </Link>
                <Link to="/module-5" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103]">
                  <span className="w-2 h-2 rounded-full bg-[#FF4103]"></span>
                  M5 · Talent Intelligence & Governance
                </Link>
                <div className="my-1 border-t border-[#063750]"></div>
                <Link to="/dashboard/free-infrastructure" className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-[#00273c] hover:text-[#FF4103]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Free Infra Intelligence (Phase 1)
                </Link>
              </div>
            </div>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-[#002538] rounded-xl transition-colors border border-transparent hover:border-[#063750]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] rounded-xl shadow-lg shadow-[#FF4103]/25 transition-all flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs px-3 py-1.5 font-semibold text-white bg-[#FF4103] rounded-lg"
            >
              Sign In
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#002538]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#001b2a] border-b border-[#00273c] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-[#002538]"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-[#00273c] flex flex-col gap-2">
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
              Register Candidate / Recruiter
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
