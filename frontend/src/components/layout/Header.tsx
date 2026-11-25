import React from 'react';
import { Menu, Target, FileText, RefreshCw, Database, Sparkles } from 'lucide-react';
import { DatasetSummary } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  summary: DatasetSummary | null;
  onTargetChange: (newTarget: string) => void;
  onOpenReport: () => void;
  onLoadSample: (type: 'sample' | 'full') => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  summary,
  onTargetChange,
  onOpenReport,
  onLoadSample,
  isLoading = false,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 glass-panel border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md">
      {/* Left section: mobile hamburger & title tagline */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">
              Statistical Feature Selection Lab
            </span>
            <span className="hidden md:inline text-xs text-slate-500">|</span>
            <span className="hidden md:inline text-xs text-slate-400 italic">
              Discover the mathematics behind smarter machine learning
            </span>
          </div>
        </div>
      </div>

      {/* Right controls: Target selector, dataset switch, report export */}
      <div className="flex items-center gap-3">
        {summary && summary.loaded && (
          <>
            {/* Quick Target Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-inner">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-medium">Target:</span>
              <select
                value={summary.target_column}
                onChange={(e) => onTargetChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer border-none"
              >
                {summary.columns_info.map((col) => (
                  <option key={col.name} value={col.name} className="bg-slate-900 text-slate-200">
                    {col.name} ({col.dtype})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Sample Switcher */}
            <div className="hidden xl:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <button
                onClick={() => onLoadSample('sample')}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  summary.rows < 10000
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Load 4,521 row Bank sample"
              >
                Sample (4.5k)
              </button>
              <button
                onClick={() => onLoadSample('full')}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  summary.rows > 10000
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Load full 45,211 row Bank dataset"
              >
                Full (45.2k)
              </button>
            </div>
          </>
        )}

        {/* Generate Report Button */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm transition"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Audit Report</span>
        </button>
      </div>
    </header>
  );
};
