import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  Table,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  Activity,
  Info,
  Scale,
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
  ReferenceLine,
} from 'recharts';
import { DatasetSummary, ChiSquareResponse, ContingencyTable } from '../types';
import { api } from '../services/api';
import { MathFormula } from '../components/common/MathFormula';

interface ChiSquareAnalysisProps {
  summary: DatasetSummary | null;
}

export const ChiSquareAnalysis: React.FC<ChiSquareAnalysisProps> = ({ summary }) => {
  const [alpha, setAlpha] = useState<number>(0.05);
  const [chiData, setChiData] = useState<ChiSquareResponse | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [tableMode, setTableMode] = useState<'observed' | 'expected' | 'residuals'>('observed');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchChiSquare = async (a = alpha) => {
    setIsLoading(true);
    try {
      const res = await api.getChiSquare(a, summary?.target_column);
      setChiData(res);
      if (res.results.length > 0 && (!selectedFeature || !res.results.some((r) => r.feature === selectedFeature))) {
        setSelectedFeature(res.results[0].feature);
      }
    } catch (err) {
      console.error('Failed to fetch Chi-Square analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (summary?.loaded) {
      fetchChiSquare(alpha);
    }
  }, [summary?.dataset_name, summary?.target_column, alpha]);

  const activeResult = chiData?.results.find((r) => r.feature === selectedFeature);
  const activeTable: ContingencyTable | undefined = chiData?.contingency_tables[selectedFeature];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Concept */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-cyan-400" />
            Chi-Square Test of Independence (χ²)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Testing statistical dependence between categorical predictors and target classification outcome
          </p>
        </div>

        {/* Significance Alpha Slider */}
        <div className="flex items-center gap-3 p-3 rounded-2xl glass-panel border border-slate-700/80">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Significance Level (α):</span>
              <span className="font-mono text-cyan-300 font-bold ml-2">{alpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-36 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Formula & Theory Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Scale className="w-4 h-4" />
            Hypothesis Testing Framework
          </div>
          <h2 className="text-xl font-bold text-white">Pearson's Chi-Square Test for Categorical Independence</h2>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            The Chi-Square Test determines whether the distribution of categorical features is statistically independent of the target classes. The null hypothesis (<span className="font-mono text-cyan-300">H₀</span>) states the two variables are completely independent. When the test statistic is sufficiently large (<span className="font-mono text-teal-300">p &lt; α</span>), we reject <span className="font-mono">H₀</span> in favor of significant association (<span className="font-mono text-teal-300">H₁</span>).
          </p>

          <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">Test Statistic:</div>
              <MathFormula formula="\chi^2 = \sum_{i=1}^r \sum_{j=1}^c \frac{(O_{ij} - E_{ij})^2}{E_{ij}}" />
            </div>
            <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0">
              <div className="text-[11px] font-mono text-slate-400 mb-1">Expected Frequency:</div>
              <MathFormula formula="E_{ij} = \frac{R_i \cdot C_j}{N}" />
            </div>
            <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0">
              <div className="text-[11px] font-mono text-slate-400 mb-1">Degrees of Freedom:</div>
              <MathFormula formula="df = (r - 1)(c - 1)" />
            </div>
          </div>
        </div>

        {/* Decision Rule Guide */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Rigorous Decision Rules
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Threshold benchmark based on p-value vs significance level <span className="font-mono text-cyan-300">α = {alpha}</span>:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>p-value &lt; {alpha}</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">KEEP</span>
                </div>
                <p className="text-[11px] text-teal-200/80">
                  Statistically significant association. Reject H₀; feature carries meaningful predictive signal.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>p-value ≥ {alpha}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">DROP/REVIEW</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  Insufficient evidence of dependence. Fail to reject H₀; feature is statistically independent of target.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong>Cramer's V Effect Size:</strong> In addition to the p-value, Cramer's V measures the practical strength of association normalized between 0 (no association) and 1 (perfect association).
          </div>
        </div>
      </div>

      {/* Categorical Feature Relevance Bar Chart */}
      {chiData && chiData.results.length > 0 && (
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Categorical Feature Relevance (Chi-Square Statistic χ²)
              </h3>
              <p className="text-xs text-slate-400">
                Ranked by magnitude of deviation from independent expectation against <code className="text-cyan-300">{chiData.target_column}</code>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-teal-300">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Significant (p &lt; {alpha})
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Not Significant (p ≥ {alpha})
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chiData.results} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="feature" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl font-mono text-xs space-y-1">
                          <p className="font-bold text-white">{data.feature}</p>
                          <p className="text-cyan-300">χ²: {data.chi2_score}</p>
                          <p className="text-slate-300">p-value: {data.p_value}</p>
                          <p className="text-slate-400">df: {data.dof}</p>
                          <p className="text-slate-400">Cramer's V: {data.cramers_v}</p>
                          <p className={`font-semibold ${data.recommendation === 'KEEP' ? 'text-teal-400' : 'text-rose-400'}`}>
                            {data.recommendation}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="chi2_score" radius={[4, 4, 0, 0]}>
                  {chiData.results.map((entry) => (
                    <Cell
                      key={entry.feature}
                      fill={entry.recommendation === 'KEEP' ? '#06b6d4' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selected Feature Contingency Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Feature Selector & Statistical Decision Card */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Categorical Feature to Inspect
            </label>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer shadow-inner"
            >
              {chiData?.results.map((r) => (
                <option key={r.feature} value={r.feature}>
                  {r.feature} (χ² = {r.chi2_score})
                </option>
              ))}
            </select>
          </div>

          {activeResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Chi-Square (χ²)</span>
                  <span className="text-xl font-bold text-cyan-300">{activeResult.chi2_score}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Degrees of Freedom (df)</span>
                  <span className="text-white">{activeResult.dof}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">p-value</span>
                  <span className="text-teal-300 font-bold">{activeResult.p_value}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cramer's V (Effect Size)</span>
                  <span className="text-slate-200">{activeResult.cramers_v}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-sans">Statistical Decision</span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans ${
                      activeResult.recommendation === 'KEEP'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {activeResult.recommendation}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                <strong>Explanation:</strong> {activeResult.decision_explanation}
              </div>
            </div>
          )}
        </div>

        {/* Right: Interactive Contingency Table (Observed vs Expected vs Residuals) */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-cyan-400" />
                Contingency Table Matrix: {selectedFeature} × {chiData?.target_column}
              </h3>
              <p className="text-xs text-slate-400">
                Detailed cell frequencies and residual deviation calculations
              </p>
            </div>

            {/* Matrix View Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setTableMode('observed')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  tableMode === 'observed'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Observed (O)
              </button>
              <button
                onClick={() => setTableMode('expected')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  tableMode === 'expected'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Expected (E)
              </button>
              <button
                onClick={() => setTableMode('residuals')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  tableMode === 'residuals'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Residuals (O-E)²/E
              </button>
            </div>
          </div>

          {activeTable ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-center text-xs font-mono">
                <thead className="bg-navy-900/90 text-slate-300 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-left font-semibold text-slate-400">
                      {selectedFeature} / Target:
                    </th>
                    {activeTable.columns.map((c) => (
                      <th key={c} className="p-3 text-cyan-400 font-semibold whitespace-nowrap">
                        {chiData?.target_column} = "{c}"
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-navy-950/40">
                  {activeTable[tableMode].map((row, idx) => (
                    <tr key={row.category || idx} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 text-left font-semibold text-white whitespace-nowrap bg-navy-900/30">
                        {row.category}
                      </td>
                      {activeTable.columns.map((colCat) => {
                        const val = row[colCat];
                        return (
                          <td
                            key={colCat}
                            className={`p-3 whitespace-nowrap ${
                              tableMode === 'residuals' && val > 5
                                ? 'text-teal-300 font-bold bg-teal-500/10'
                                : 'text-slate-300'
                            }`}
                          >
                            {typeof val === 'number' ? (tableMode === 'observed' ? val.toLocaleString() : val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Loading contingency frequencies...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
