import React from 'react';
import {
  TrendingUp,
  Sparkles,
  SlidersHorizontal,
  Cpu,
  Database,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Hash,
  Layers,
  BarChart3,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { DatasetSummary, FeatureSelectionResponse } from '../types';
import { NavItem } from '../components/layout/Sidebar';

interface DashboardProps {
  summary: DatasetSummary | null;
  selectionResult: FeatureSelectionResponse | null;
  onNavigate: (tab: NavItem) => void;
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  selectionResult,
  onNavigate,
  isLoading,
}) => {
  const totalRows = summary?.rows ?? 0;
  const numFeatures = summary?.numeric_features_count ?? 0;
  const catFeatures = summary?.categorical_features_count ?? 0;
  const selectedCount = selectionResult?.selected_count ?? 0;
  const rejectedCount = selectionResult?.rejected_count ?? 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-cyan-500/20 bg-gradient-to-br from-navy-900/90 via-navy-850/80 to-slate-900/90 p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Academic Data Science & Statistical Learning Platform
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Statistical Feature Selection Lab
          </h1>

          <p className="text-base lg:text-lg text-slate-300 leading-relaxed font-normal">
            Welcome to <strong className="text-cyan-400">FeatureLab</strong>. Discover how mathematical
            principles separate signal from noise in machine learning datasets. By leveraging{' '}
            <span className="text-teal-300 font-medium">Pearson Correlation Analysis</span> for linear numerical relationships and the{' '}
            <span className="text-cyan-300 font-medium">Chi-Square Test of Independence</span> for categorical associations, we construct robust, interpretable, and computationally efficient models without overfitting.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('explorer')}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Database className="w-4 h-4" />
              Explore UCI Bank Dataset
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('selection')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 transition"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              Launch Selection Workflow
            </button>
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Records */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Records
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? '...' : totalRows.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {summary?.dataset_name || 'UCI Bank Marketing'}
            </p>
          </div>
        </div>

        {/* Metric 2: Numerical Features */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Numerical Features
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? '...' : numFeatures}
            </div>
            <p className="text-xs text-teal-400 mt-1">Evaluated via Pearson (r)</p>
          </div>
        </div>

        {/* Metric 3: Categorical Features */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Categorical Features
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {isLoading ? '...' : catFeatures}
            </div>
            <p className="text-xs text-cyan-400 mt-1">Evaluated via Chi-Square (χ²)</p>
          </div>
        </div>

        {/* Metric 4: Selected Features */}
        <div className="glass-card rounded-2xl p-5 border border-teal-500/20 bg-teal-950/20 hover:border-teal-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              Selected Features
            </span>
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-teal-300 font-mono">
              {isLoading ? '...' : selectedCount}
            </div>
            <p className="text-xs text-teal-400/80 mt-1">High statistical evidence</p>
          </div>
        </div>

        {/* Metric 5: Rejected Features */}
        <div className="glass-card rounded-2xl p-5 border border-rose-500/20 bg-rose-950/20 hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              Rejected Features
            </span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-300 font-mono">
              {isLoading ? '...' : rejectedCount}
            </div>
            <p className="text-xs text-rose-400/80 mt-1">Weak correlation / p ≥ 0.05</p>
          </div>
        </div>
      </div>

      {/* Visual Overview of the 4-Step Feature Selection Process */}
      <div className="rounded-3xl glass-panel p-7 lg:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              Statistical Feature Selection Pipeline
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              An end-to-end mathematical methodology for selecting optimal predictor subsets
            </p>
          </div>
          <button
            onClick={() => onNavigate('selection')}
            className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            Open Interactive Wizard <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
                  1
                </span>
                <span className="text-[11px] font-mono uppercase text-slate-500">Partition</span>
              </div>
              <h3 className="font-semibold text-white text-base">Split Features</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Separate predictor columns by measurement scale: continuous/discrete numerical features vs discrete nominal/ordinal categorical features. Identify target variable <code className="text-cyan-300">y</code>.
              </p>
            </div>
            <button
              onClick={() => onNavigate('explorer')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center justify-between"
            >
              Explore Data Schema <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-teal-500/40 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/30">
                  2
                </span>
                <span className="text-[11px] font-mono uppercase text-slate-500">Numerical</span>
              </div>
              <h3 className="font-semibold text-white text-base">Pearson Correlation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Measure linear co-dependence using covariance normalized by standard deviations. Compute <span className="text-teal-300 font-mono">r</span> values, filter weak features (|r| &lt; 0.05), and detect collinear redundancy.
              </p>
            </div>
            <button
              onClick={() => onNavigate('correlation')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center justify-between"
            >
              View Correlation Matrix <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                  3
                </span>
                <span className="text-[11px] font-mono uppercase text-slate-500">Categorical</span>
              </div>
              <h3 className="font-semibold text-white text-base">Chi-Square Independence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Formulate contingency tables comparing Observed (O) versus Expected (E) frequencies. Calculate <span className="text-blue-300 font-mono">χ²</span> and p-values against significance level <span className="text-blue-300 font-mono">α = 0.05</span>.
              </p>
            </div>
            <button
              onClick={() => onNavigate('chisquare')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center justify-between"
            >
              Inspect Contingency Tables <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-purple-500/40 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
                  4
                </span>
                <span className="text-[11px] font-mono uppercase text-slate-500">ML Validation</span>
              </div>
              <h3 className="font-semibold text-white text-base">Select & Validate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synthesize final feature sets with manual override flexibility. Train benchmarked Random Forest classifiers on All vs Selected features with strict train-only preprocessing to prove accuracy.
              </p>
            </div>
            <button
              onClick={() => onNavigate('models')}
              className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center justify-between"
            >
              Compare ML Classifiers <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Domain Context & Leakage Warning Alert Card */}
      <div className="rounded-2xl p-6 bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
            Critical Data Science Consideration: Post-Call Leakage in Bank Marketing
          </h4>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            The UCI Bank Marketing dataset includes a continuous feature named <code className="text-amber-200 font-mono bg-amber-950/60 px-1 py-0.5 rounded">duration</code> (call duration in seconds). While it has an extremely high correlation with the target (<span className="text-amber-300 font-mono">r ≈ 0.40</span>), its value is only known <em>after</em> the call terminates. In a real-world pre-call customer propensity model, this attribute is unavailable at inference time and constitutes <strong>severe target leakage</strong>. FeatureLab allows you to selectively include or drop it to test real-world generalization!
          </p>
        </div>
      </div>
    </div>
  );
};
