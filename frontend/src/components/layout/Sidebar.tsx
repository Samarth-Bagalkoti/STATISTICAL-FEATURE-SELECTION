import React from 'react';
import {
  LayoutDashboard,
  Database,
  GitCommit,
  Sparkles,
  Layers,
  Cpu,
  BookOpen,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'explorer'
  | 'correlation'
  | 'chisquare'
  | 'selection'
  | 'models'
  | 'methodology';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  datasetName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onToggle,
  datasetName = 'Bank Marketing',
}) => {
  const navItems: { id: NavItem; label: string; icon: React.FC<any>; badge?: string; desc: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Platform overview & metrics',
    },
    {
      id: 'explorer',
      label: 'Dataset Explorer',
      icon: Database,
      badge: 'UCI Bank',
      desc: 'Preview, upload & profiling',
    },
    {
      id: 'correlation',
      label: 'Correlation Analysis',
      icon: TrendingUp,
      badge: 'Pearson r',
      desc: 'Numerical feature relationships',
    },
    {
      id: 'chisquare',
      label: 'Chi-Square Analysis',
      icon: Sparkles,
      badge: 'χ² Test',
      desc: 'Categorical feature independence',
    },
    {
      id: 'selection',
      label: 'Feature Selection',
      icon: SlidersHorizontal,
      badge: '4 Steps',
      desc: 'Decision matrix & overrides',
    },
    {
      id: 'models',
      label: 'Model Comparison',
      icon: Cpu,
      badge: 'ML Test',
      desc: 'Random Forest benchmarking',
    },
    {
      id: 'methodology',
      label: 'About & Methodology',
      icon: BookOpen,
      desc: 'Formulas, theory & proofs',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 flex flex-col glass-panel border-r border-slate-800/80 bg-navy-950/95 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-navy-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-xl">
              <Layers className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Feature<span className="text-cyan-400">Lab</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Statistical Selection Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/35 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          active
                            ? 'bg-cyan-400 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Dataset Footer card */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/60">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Dataset
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Ready
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate" title={datasetName}>
              {datasetName}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Delimiter: Semicolon / Comma</p>
          </div>
        </div>
      </aside>
    </>
  );
};
