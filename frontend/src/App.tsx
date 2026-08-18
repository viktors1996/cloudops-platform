import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Box, Cloud, Menu, X } from 'lucide-react';
import Overview from './pages/Overview';
import Infrastructure from './pages/Infrastructure';
import Project from './pages/Project';

type Page = 'overview' | 'infrastructure' | 'project';

const pageFromHash = (): Page => {
  const value = window.location.hash.replace('#/', '');
  if (value === 'infrastructure' || value === 'project') return value;
  return 'overview';
};

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: Page) => {
    window.location.hash = `/${next}`;
    setPage(next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: Array<{ id: Page; label: string; icon: typeof Activity }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'infrastructure', label: 'Infrastructure', icon: Box },
    { id: 'project', label: 'Project', icon: Cloud },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="sticky top-0 z-40 border-b border-slate-900/90 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('overview')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-blue-500/25 bg-blue-500/10 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold tracking-tight">CloudOps Platform</p>
              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Production Operations Portal</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`relative px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                  page === id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {page === id && (
                  <motion.span
                    layoutId="active-page"
                    className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700"
                    transition={{ type: 'spring', stiffness: 420, damping: 35 }}
                  />
                )}
                <Icon className="relative w-3.5 h-3.5" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-mono text-emerald-400">PRODUCTION</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden p-2 rounded-lg border border-slate-800 text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden max-w-7xl mx-auto px-4 pb-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-2 space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                    page === id ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {page === 'overview' && <Overview />}
        {page === 'infrastructure' && <Infrastructure />}
        {page === 'project' && <Project />}
      </main>
    </div>
  );
}