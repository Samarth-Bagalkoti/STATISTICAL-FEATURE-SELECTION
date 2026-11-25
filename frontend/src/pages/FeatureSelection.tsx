import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { DatasetSummary, FeatureSelectionResponse, FeatureDecision } from '../types';
import { api } from '../services/api';

interface FeatureSelectionProps {
  summary: DatasetSummary | null;
  selectionResult: FeatureSelectionResponse | null;
  onUpdateSelection: (result: FeatureSelectionResponse) => void;
  onOpenReport: () => void;
}

export const FeatureSelection: React.FC<FeatureSelectionProps> = ({
  summary,
  selectionResult,
  onUpdateSelection,
  onOpenReport,
}) => {
  const [corrThreshold, setCorrThreshold] = useState<number>(0.05);
  const [chiAlpha, setChiAlpha] = useState<number>(0.05);
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<number>(4);
  const [filterType, setFilterType] = useState<'all' | 'numeric' | 'categorical'>('all');
  const [filterDecision, setFilterDecision] = useState<'all' | 'keep' | 'drop'>('all');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Evaluate features whenever thresholds or overrides change
  const evaluate = async (
    ct = corrThreshold,
    ca = chiAlpha,
    overrides = userOverrides
  ) => {
    setIsEvaluating(true);
    try {
      const res = await api.evaluateFeatureSelection(
        ct,
        ca,
        summary?.target_column,
        overrides
      );
      onUpdateSelection(res);
    } catch (err) {
      console.error('Failed to evaluate feature selection:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (summary?.loaded) {
      evaluate(corrThreshold, chiAlpha, userOverrides);
    }
  }, [summary?.dataset_name, summary?.target_column, corrThreshold, chiAlpha]);

  const handleToggleOverride = (feature: string, currentDecision: 'KEEP' | 'DROP') => {
    const newDecision = currentDecision === 'KEEP' ? 'DROP' : 'KEEP';
    const updated = { ...userOverrides, [feature]: newDecision };
    setUserOverrides(updated);
    evaluate(corrThreshold, chiAlpha, updated);
  };

  const handleResetOverrides = () => {
    setUserOverrides({});
    evaluate(corrThreshold, chiAlpha, {});
  };

  const handleDownloadSelectedCSV = async () => {
    setIsDownloading(true);
    try {
      const res = await api.downloadSelectedCSV(corrThreshold, chiAlpha, userOverrides);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `featurelab_selected_features_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading CSV:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDecisionsCSV = async () => {
    try {
      const res = await api.downloadDecisionsCSV(corrThreshold, chiAlpha, userOverrides);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `featurelab_statistical_decisions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading decisions CSV:', err);
    }
  };

  // Filter table rows
  const filteredFeatures = (selectionResult?.features_table || []).filter((f) => {
    if (filterType === 'numeric' && f.type !== 'Numeric') return false;
    if (filterType === 'categorical' && f.type !== 'Categorical') return false;
    if (filterDecision === 'keep' && f.final_decision !== 'KEEP') return false;
    if (filterDecision === 'drop' && f.final_decision !== 'DROP') return false;
    return true;
  });

  const totalEvaluated = selectionResult?.total_evaluated ?? 0;
  const selectedCount = selectionResult?.selected_count ?? 0;
  const rejectedCount = selectionResult?.rejected_count ?? 0;
  const reductionPct = totalEvaluated > 0 ? Math.round((rejectedCount / totalEvaluated) * 100) : 0;

  // Chart data
  const pieData = [
    { name: 'Selected (Keep)', value: selectedCount, fill: '#14b8a6' },
    { name: 'Rejected (Drop)', value: rejectedCount, fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
            <SlidersHorizontal className="w-7 h-7 text-cyan-400" />
            Statistical Feature Selection Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            4-step mathematical filtering pipeline synthesizing Pearson Correlation and Chi-Square tests
          </p>
        </div>

        {/* Global Export Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadDecisionsCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Export Decisions CSV
          </button>
          <button
            onClick={handleDownloadSelectedCSV}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Exporting...' : 'Download Selected Dataset'}
          </button>
        </div>
      </div>

      {/* 4-Step Interactive Stepper Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 */}
        <div
          onClick={() => setActiveStep(1)}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeStep === 1
              ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10'
              : 'bg-navy-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Step 1</span>
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">
              ✓
            </span>
          </div>
          <h4 className="text-sm font-bold text-white">Split Features</h4>
          <p className="text-xs text-slate-400 mt-1">
            {summary?.numeric_features_count} Numeric, {summary?.categorical_features_count} Categorical, Target: <code className="text-cyan-300">{summary?.target_column}</code>
          </p>
        </div>

        {/* Step 2 */}
        <div
          onClick={() => setActiveStep(2)}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeStep === 2
              ? 'bg-teal-500/15 border-teal-500/50 shadow-md shadow-teal-500/10'
              : 'bg-navy-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-teal-400 uppercase font-bold">Step 2</span>
            <span className="text-xs font-mono text-teal-300 font-bold">|r| ≥ {corrThreshold}</span>
          </div>
          <h4 className="text-sm font-bold text-white">Run Correlation</h4>
          <p className="text-xs text-slate-400 mt-1">
            Calculated Pearson r on continuous predictors against encoded target
          </p>
        </div>

        {/* Step 3 */}
        <div
          onClick={() => setActiveStep(3)}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeStep === 3
              ? 'bg-blue-500/15 border-blue-500/50 shadow-md shadow-blue-500/10'
              : 'bg-navy-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-blue-400 uppercase font-bold">Step 3</span>
            <span className="text-xs font-mono text-blue-300 font-bold">p &lt; {chiAlpha}</span>
          </div>
          <h4 className="text-sm font-bold text-white">Run Chi-Square</h4>
          <p className="text-xs text-slate-400 mt-1">
            Contingency tables evaluated for categorical independence
          </p>
        </div>

        {/* Step 4 */}
        <div
          onClick={() => setActiveStep(4)}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeStep === 4
              ? 'bg-purple-500/15 border-purple-500/50 shadow-md shadow-purple-500/10'
              : 'bg-navy-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-purple-400 uppercase font-bold">Step 4</span>
            <span className="text-xs font-mono text-purple-300 font-bold">
              {selectedCount} Kept
            </span>
          </div>
          <h4 className="text-sm font-bold text-white">Synthesize & Override</h4>
          <p className="text-xs text-slate-400 mt-1">
            Decision matrix with human-in-the-loop overrides & leakage guard
          </p>
        </div>
      </div>

      {/* Target Leakage Warning Banner */}
      {selectionResult?.duration_leakage_present && (
        <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Data Leakage Detected: Bank Marketing <code className="text-amber-200 font-mono">duration</code>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 max-w-3xl leading-relaxed">
                Although call duration has a high correlation (<span className="text-amber-300 font-mono">r ≈ 0.40</span>), it is only known after phone call completion. In pre-call telemarketing models, duration is impossible to know beforehand. Keeping it produces an unrealistic model that cannot be used for prospective call targeting.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleOverride('duration', userOverrides['duration'] === 'DROP' ? 'DROP' : 'KEEP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
              userOverrides['duration'] === 'DROP'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            {userOverrides['duration'] === 'DROP' ? '✓ Dropped for Pre-Call Model' : 'Drop "duration" to Prevent Leakage'}
          </button>
        </div>
      )}

      {/* Threshold Tuner & Selection KPI Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threshold Sliders */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              Configurable Thresholds
            </h3>
            {Object.keys(userOverrides).length > 0 && (
              <button
                onClick={handleResetOverrides}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Reset {Object.keys(userOverrides).length} overrides
              </button>
            )}
          </div>

          {/* Slider 1: Pearson r */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-navy-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Pearson (|r|) Min Threshold:
              </span>
              <span className="font-mono text-teal-300 font-bold">≥ {corrThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.30"
              step="0.01"
              value={corrThreshold}
              onChange={(e) => setCorrThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <p className="text-[10px] text-slate-500">
              Features with |r| below this cutoff are flagged as weak linear predictors.
            </p>
          </div>

          {/* Slider 2: Chi-Square alpha */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-navy-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Chi-Square (α) Significance:
              </span>
              <span className="font-mono text-cyan-300 font-bold">&lt; {chiAlpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={chiAlpha}
              onChange={(e) => setChiAlpha(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">
              Categorical features with p ≥ α fail the independence test and are dropped.
            </p>
          </div>
        </div>

        {/* Feature Reduction KPI summary */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Dimensionality Compression Summary
            </span>
            <div className="text-3xl font-extrabold text-white">
              {selectedCount}{' '}
              <span className="text-sm font-normal text-slate-400">of {totalEvaluated} features selected</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Feature selection removed <strong className="text-rose-400">{rejectedCount} redundant/noisy attributes</strong>, achieving a <strong className="text-cyan-400">{reductionPct}% reduction</strong> in dimensionality. This mitigates the curse of dimensionality and guards against overfitting.
            </p>
          </div>

          {/* Mini Donut Chart */}
          <div className="w-48 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={56}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs shadow-xl">
                          <p className="font-bold text-white">{data.name}: {data.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Professional Combined Results Decision Table */}
      <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              Statistical Feature Selection Decision Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Live calculated scores, p-values, algorithmic recommendations, and manual overrides
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter by Type */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType('numeric')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'numeric' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'
                }`}
              >
                Numeric
              </button>
              <button
                onClick={() => setFilterType('categorical')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'categorical' ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-slate-400'
                }`}
              >
                Categorical
              </button>
            </div>

            {/* Filter by Decision */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setFilterDecision('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterDecision === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDecision('keep')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterDecision === 'keep' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'
                }`}
              >
                Kept
              </button>
              <button
                onClick={() => setFilterDecision('drop')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterDecision === 'drop' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                Dropped
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900/90 text-slate-300 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statistical Method</th>
                <th className="px-4 py-3 font-mono">Statistical Score</th>
                <th className="px-4 py-3 font-mono">P-Value</th>
                <th className="px-4 py-3">System Rec.</th>
                <th className="px-4 py-3 text-center">Manual Override</th>
                <th className="px-4 py-3">Final Decision</th>
                <th className="px-4 py-3">Statistical Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-navy-950/40">
              {filteredFeatures.map((row) => {
                const isOverridden = Boolean(row.user_override);
                const isKept = row.final_decision === 'KEEP';

                return (
                  <tr
                    key={row.feature}
                    className={`hover:bg-slate-800/30 transition ${
                      row.is_leakage ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    {/* Feature name */}
                    <td className="px-4 py-3 font-bold text-white font-mono flex items-center gap-2">
                      {row.feature}
                      {row.is_leakage && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          LEAKAGE
                        </span>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          row.type === 'Numeric'
                            ? 'bg-teal-500/20 text-teal-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>

                    {/* Test used */}
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {row.test_used}
                    </td>

                    {/* Statistical Score */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">
                      {row.score_name} = {row.score}
                    </td>

                    {/* P-Value */}
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {row.p_value}
                    </td>

                    {/* System Recommendation */}
                    <td className="px-4 py-3 font-semibold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          row.system_recommendation === 'KEEP' ? 'text-teal-400' : 'text-rose-400'
                        }`}
                      >
                        {row.system_recommendation === 'KEEP' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {row.system_recommendation}
                      </span>
                    </td>

                    {/* Manual Override Button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleOverride(row.feature, row.final_decision)}
                        title="Click to toggle human override"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          isOverridden
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {isKept ? (
                          <ToggleRight className="w-4 h-4 text-teal-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{isOverridden ? 'Overridden' : 'Auto'}</span>
                      </button>
                    </td>

                    {/* Final Decision */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isKept
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {row.final_decision}
                      </span>
                    </td>

                    {/* Rationale */}
                    <td className="px-4 py-3 text-slate-300 max-w-xs text-[11px] leading-relaxed">
                      {row.rationale}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
