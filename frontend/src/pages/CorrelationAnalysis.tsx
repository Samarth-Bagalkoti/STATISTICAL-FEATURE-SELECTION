import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import { DatasetSummary, CorrelationResponse, ScatterResponse } from '../types';
import { api } from '../services/api';
import { MathFormula } from '../components/common/MathFormula';

interface CorrelationAnalysisProps {
  summary: DatasetSummary | null;
}

export const CorrelationAnalysis: React.FC<CorrelationAnalysisProps> = ({ summary }) => {
  const [threshold, setThreshold] = useState<number>(0.05);
  const [corrData, setCorrData] = useState<CorrelationResponse | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [scatterData, setScatterData] = useState<ScatterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScatterLoading, setIsScatterLoading] = useState<boolean>(false);

  // Load correlation data
  const fetchCorrelations = async (t = threshold) => {
    setIsLoading(true);
    try {
      const res = await api.getCorrelation(t, summary?.target_column);
      setCorrData(res);
      if (res.results.length > 0 && (!selectedFeature || !res.results.some(r => r.feature === selectedFeature))) {
        setSelectedFeature(res.results[0].feature);
      }
    } catch (err) {
      console.error('Failed to fetch correlation analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (summary?.loaded) {
      fetchCorrelations(threshold);
    }
  }, [summary?.dataset_name, summary?.target_column, threshold]);

  // Load scatter data when selectedFeature changes
  useEffect(() => {
    if (!selectedFeature) return;
    const fetchScatter = async () => {
      setIsScatterLoading(true);
      try {
        const res = await api.getScatter(selectedFeature, summary?.target_column);
        setScatterData(res);
      } catch (err) {
        console.error('Failed to load scatter data:', err);
      } finally {
        setIsScatterLoading(false);
      }
    };
    fetchScatter();
  }, [selectedFeature, summary?.target_column]);

  const activeResult = corrData?.results.find((r) => r.feature === selectedFeature);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Concept */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-teal-400" />
            Pearson Correlation Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Measuring linear co-dependency between numerical continuous features and target outcome
          </p>
        </div>

        {/* Threshold Slider Control */}
        <div className="flex items-center gap-3 p-3 rounded-2xl glass-panel border border-slate-700/80">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Keep Threshold (|r|):</span>
              <span className="font-mono text-cyan-300 font-bold ml-2">≥ {threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.40"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-36 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Formula & Theory Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
            <Sparkles className="w-4 h-4" />
            Mathematical Foundation
          </div>
          <h2 className="text-xl font-bold text-white">Pearson Product-Moment Correlation Coefficient</h2>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            Pearson's <span className="font-mono text-cyan-300">r</span> assesses whether two variables change together linearly. For binary outcomes (such as Bank Marketing's <code className="text-cyan-300">y</code>: "yes"/"no"), encoding the target as <span className="font-mono text-cyan-300">&#123;0, 1&#125;</span> yields the mathematically equivalent <strong>Point-Biserial correlation coefficient</strong>.
          </p>

          <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800/80 flex flex-col md:flex-row items-center justify-around gap-4 text-center">
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">Theoretical Formulation:</div>
              <MathFormula formula="r = \frac{\text{Cov}(X, Y)}{\sigma_X \cdot \sigma_Y}" />
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-800" />
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">Computational Expansion:</div>
              <MathFormula formula="r = \frac{\sum_{i=1}^n (X_i - \bar{X})(Y_i - \bar{Y})}{\sqrt{\sum_{i=1}^n (X_i - \bar{X})^2 \sum_{i=1}^n (Y_i - \bar{Y})^2}}" />
            </div>
          </div>
        </div>

        {/* Interpretation Ranges Guide */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Standard Interpretation Ranges
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Correlation ranges strictly between <span className="font-mono text-cyan-300">-1.0</span> and <span className="font-mono text-cyan-300">+1.0</span>:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
                <span>+0.7 to +1.0</span>
                <span className="font-sans font-semibold">Strong positive</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span>+0.3 to +0.7</span>
                <span className="font-sans">Moderate positive</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                <span>-0.3 to +0.3</span>
                <span className="font-sans text-rose-400/90 font-medium">Little or no relation</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span>-0.7 to -0.3</span>
                <span className="font-sans">Moderate negative</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <span>-1.0 to -0.7</span>
                <span className="font-sans font-semibold">Strong negative</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 leading-relaxed">
            <strong>Key Statistical Insight:</strong> A strong negative correlation (<span className="font-mono">r &lt; -0.7</span>) is just as predictive as a strong positive correlation! Features with negative slopes should <em>never</em> be dropped purely because of their negative sign.
          </div>
        </div>
      </div>

      {/* Target Correlation Ranking Bar Chart */}
      {corrData && corrData.results.length > 0 && (
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-400" />
                Target Correlation Ranking (Signed & Absolute |r|)
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by magnitude of association with target variable <code className="text-cyan-300">{corrData.target_column}</code>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-teal-300">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Keep (|r| ≥ {threshold})
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Drop / Review
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corrData.results} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="feature" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[-0.5, 0.5]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#475569" />
                <ReferenceLine y={threshold} stroke="#14b8a6" strokeDasharray="3 3" label={{ value: `+${threshold}`, fill: '#14b8a6', fontSize: 10 }} />
                <ReferenceLine y={-threshold} stroke="#14b8a6" strokeDasharray="3 3" label={{ value: `-${threshold}`, fill: '#14b8a6', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl font-mono text-xs space-y-1">
                          <p className="font-bold text-white">{data.feature}</p>
                          <p className="text-cyan-300">r: {data.correlation}</p>
                          <p className="text-slate-400">|r|: {data.abs_correlation}</p>
                          <p className="text-slate-400">p-value: {data.p_value}</p>
                          <p className={`font-semibold ${data.recommendation === 'KEEP' ? 'text-teal-400' : 'text-rose-400'}`}>
                            {data.recommendation}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="correlation" radius={[4, 4, 0, 0]}>
                  {corrData.results.map((entry) => (
                    <Cell
                      key={entry.feature}
                      fill={entry.recommendation === 'KEEP' ? (entry.is_leakage ? '#f59e0b' : '#14b8a6') : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selected Feature Deep Dive & Interactive Scatter Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Feature Selector & Interpretation Box */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Feature to Inspect
            </label>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer shadow-inner"
            >
              {corrData?.results.map((r) => (
                <option key={r.feature} value={r.feature}>
                  {r.feature} (r = {r.correlation})
                </option>
              ))}
            </select>
          </div>

          {activeResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Pearson r</span>
                  <span className={`text-xl font-bold ${activeResult.correlation >= 0 ? 'text-teal-300' : 'text-cyan-300'}`}>
                    {activeResult.correlation > 0 ? `+${activeResult.correlation}` : activeResult.correlation}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">p-value</span>
                  <span className="text-slate-200">{activeResult.p_value}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Relationship Strength</span>
                  <span className="text-white font-semibold font-sans">{activeResult.strength}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Direction</span>
                  <span className="text-white font-semibold font-sans">{activeResult.direction}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-sans">Recommendation</span>
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

              {activeResult.is_leakage && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="w-4 h-4" /> Leakage Caution
                  </div>
                  <p>{activeResult.leakage_warning}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Scatter Plot with Linear Regression Line */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Scatter Plot & Fitted Regression Trendline
              </h3>
              <p className="text-xs text-slate-400">
                {selectedFeature} vs target ({summary?.target_column})
              </p>
            </div>
            {scatterData && (
              <div className="text-right font-mono text-xs text-cyan-300">
                <div>y = {scatterData.slope}x + {scatterData.intercept}</div>
                <div className="text-slate-400 text-[11px]">R² = {scatterData.r_squared}</div>
              </div>
            )}
          </div>

          <div className="h-72 w-full">
            {isScatterLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Generating downsampled coordinates...
              </div>
            ) : scatterData && scatterData.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name={selectedFeature}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={[-0.1, 1.1]}
                    ticks={[0, 1]}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => (val === 1 ? 'Yes (1)' : 'No (0)')}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs shadow-xl">
                            <p className="text-white">
                              {selectedFeature}: <strong>{pt.x}</strong>
                            </p>
                            <p className="text-cyan-300">
                              Target: <strong>{pt.y === 1 ? '1 (Subscribed)' : '0 (No)'}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Observations"
                    data={scatterData.points}
                    fill="#06b6d4"
                    fillOpacity={0.65}
                  />
                  <Line
                    type="linear"
                    dataKey="y"
                    data={scatterData.trend_line}
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={false}
                    name="OLS Regression"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No scatter coordinates available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multicollinearity & Redundancy Detector */}
      {corrData && corrData.redundant_pairs.length > 0 && (
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-amber-500/30 bg-amber-950/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-300">
                Multicollinearity & Redundancy Alert (|r| ≥ 0.70 between predictors)
              </h3>
              <p className="text-xs text-slate-400">
                Highly correlated predictor pairs introduce redundant signal and inflate coefficient variance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {corrData.redundant_pairs.map((pair, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-bold">
                    {pair.feature1} <span className="text-slate-500 font-normal">vs</span> {pair.feature2}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    r = {pair.correlation}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">{pair.explanation}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-teal-400 font-semibold">
                    Keep: <strong className="font-mono">{pair.recommended_keep}</strong>
                  </span>
                  <span className="text-rose-400 font-semibold">
                    Drop: <strong className="font-mono">{pair.recommended_drop}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Correlation Heatmap Table */}
      {corrData && corrData.matrix && corrData.matrix.columns.length > 0 && (
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Inter-Feature Correlation Heatmap Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Pairwise Pearson coefficients across all numerical columns and target variable
              </p>
            </div>
            {/* Color Legend */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <span className="text-rose-400">-1.0 (Neg)</span>
              <div className="w-24 h-2.5 rounded bg-gradient-to-r from-rose-500 via-slate-800 to-teal-400" />
              <span className="text-teal-300">+1.0 (Pos)</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead className="bg-navy-900/90 text-slate-300">
                <tr>
                  <th className="p-2.5 text-left text-slate-400 font-semibold">Feature</th>
                  {corrData.matrix.columns.map((c) => (
                    <th key={c} className="p-2.5 text-slate-300 font-semibold whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-navy-950/40">
                {corrData.matrix.rows.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-800/30 transition">
                    <td className="p-2.5 text-left font-semibold text-white whitespace-nowrap bg-navy-900/40">
                      {row.feature}
                    </td>
                    {corrData.matrix.columns.map((col) => {
                      const val = row.values[col];
                      if (val === null || val === undefined) {
                        return <td key={col} className="p-2.5 text-slate-600">-</td>;
                      }

                      // Dynamic color interpolation
                      let bgStyle = 'bg-transparent';
                      let textCol = 'text-slate-400';
                      if (val > 0.6) {
                        bgStyle = 'bg-teal-500/40 text-teal-200 font-bold';
                      } else if (val > 0.25) {
                        bgStyle = 'bg-teal-500/20 text-teal-300';
                      } else if (val > 0.05) {
                        bgStyle = 'bg-teal-500/10 text-teal-400';
                      } else if (val < -0.6) {
                        bgStyle = 'bg-rose-500/40 text-rose-200 font-bold';
                      } else if (val < -0.25) {
                        bgStyle = 'bg-rose-500/20 text-rose-300';
                      } else if (val < -0.05) {
                        bgStyle = 'bg-rose-500/10 text-rose-400';
                      }

                      return (
                        <td
                          key={col}
                          title={`${row.feature} × ${col}: ${val}`}
                          className={`p-2.5 transition whitespace-nowrap ${bgStyle}`}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
