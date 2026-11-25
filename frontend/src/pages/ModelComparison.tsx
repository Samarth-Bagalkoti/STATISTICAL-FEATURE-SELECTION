import React, { useState } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart2,
  Table,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DatasetSummary, FeatureSelectionResponse, ModelComparisonResponse } from '../types';
import { api } from '../services/api';

interface ModelComparisonProps {
  summary: DatasetSummary | null;
  selectionResult: FeatureSelectionResponse | null;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  summary,
  selectionResult,
}) => {
  const [modelData, setModelData] = useState<ModelComparisonResponse | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrainModels = async () => {
    setIsTraining(true);
    setError(null);
    try {
      const selected = selectionResult?.selected_features || [];
      const res = await api.compareModels(
        selected.length > 0 ? selected : undefined,
        summary?.target_column,
        0.20
      );
      setModelData(res);
    } catch (err: any) {
      console.error('Failed to train models:', err);
      setError(err.response?.data?.detail || 'An error occurred while training models.');
    } finally {
      setIsTraining(false);
    }
  };

  const chartData = modelData
    ? [
        {
          metric: 'Accuracy',
          'All Features': (modelData.model_all_features.accuracy * 100).toFixed(1),
          'Selected Features': (modelData.model_selected_features.accuracy * 100).toFixed(1),
        },
        {
          metric: 'Precision',
          'All Features': (modelData.model_all_features.precision * 100).toFixed(1),
          'Selected Features': (modelData.model_selected_features.precision * 100).toFixed(1),
        },
        {
          metric: 'Recall',
          'All Features': (modelData.model_all_features.recall * 100).toFixed(1),
          'Selected Features': (modelData.model_selected_features.recall * 100).toFixed(1),
        },
        {
          metric: 'F1-Score',
          'All Features': (modelData.model_all_features.f1_score * 100).toFixed(1),
          'Selected Features': (modelData.model_selected_features.f1_score * 100).toFixed(1),
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
            <Cpu className="w-7 h-7 text-purple-400" />
            Empirical Machine Learning Benchmarking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare Random Forest classification performance with All Features vs Statistically Selected Features
          </p>
        </div>

        <button
          onClick={handleTrainModels}
          disabled={isTraining}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTraining ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              Fitting Classifiers...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              Train & Benchmark Classifiers
            </>
          )}
        </button>
      </div>

      {/* Experimental Setup & Rigor Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
          <ShieldCheck className="w-4 h-4" />
          Strict Data Science Methodology
        </div>
        <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
          To ensure scientific integrity:
          <br />• <strong>Identical Evaluation Split:</strong> Both models are tested on the exact same stratified 20% test partition (<span className="text-cyan-300 font-mono">random_state=42</span>).
          <br />• <strong>Zero Data Leakage:</strong> Categorical One-Hot Encoders and numerical standard scalers are fitted <em>strictly</em> on training samples only, completely preventing test distribution leakage.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Benchmarking Results */}
      {modelData && (
        <div className="space-y-6">
          {/* 4 Metric Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Accuracy */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-400">Test Accuracy</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {(modelData.model_selected_features.accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  vs {(modelData.model_all_features.accuracy * 100).toFixed(1)}% (All)
                </span>
              </div>
              <p className="text-[11px] text-teal-300 mt-1">
                Delta: {modelData.comparison.accuracy_delta >= 0 ? '+' : ''}
                {(modelData.comparison.accuracy_delta * 100).toFixed(2)}%
              </p>
            </div>

            {/* F1-Score */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-400">Weighted F1-Score</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-cyan-300 font-mono">
                  {(modelData.model_selected_features.f1_score * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  vs {(modelData.model_all_features.f1_score * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 mt-1">
                Delta: {modelData.comparison.f1_delta >= 0 ? '+' : ''}
                {(modelData.comparison.f1_delta * 100).toFixed(2)}%
              </p>
            </div>

            {/* Features Count */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-400">Features Used</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-teal-400 font-mono">
                  {modelData.model_selected_features.feature_count}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  vs {modelData.model_all_features.feature_count} (All)
                </span>
              </div>
              <p className="text-[11px] text-teal-300 mt-1">
                {modelData.comparison.percent_features_reduced}% dimensionality reduction
              </p>
            </div>

            {/* Training Time */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-400">Training Speed</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-purple-400 font-mono">
                  {modelData.model_selected_features.train_time_sec}s
                </span>
                <span className="text-xs font-mono text-slate-400">
                  vs {modelData.model_all_features.train_time_sec}s
                </span>
              </div>
              <p className="text-[11px] text-purple-300 mt-1">
                {modelData.comparison.time_saved_percent}% faster training
              </p>
            </div>
          </div>

          {/* Performance Comparison Bar Chart */}
          <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              Side-by-Side Metric Comparison (Percentage %)
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="metric" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[50, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl font-mono text-xs space-y-1">
                            <p className="font-bold text-white">{payload[0].payload.metric}</p>
                            <p className="text-slate-400">All Features: {payload[0].value}%</p>
                            <p className="text-cyan-300">Selected Features: {payload[1].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  <Bar dataKey="All Features" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Selected Features" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side-by-Side Confusion Matrices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confusion Matrix: All Features */}
            <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300">
                  Confusion Matrix: Model with All Features ({modelData.model_all_features.feature_count} cols)
                </h4>
                <span className="text-xs font-mono text-slate-500">
                  Acc: {(modelData.model_all_features.accuracy * 100).toFixed(1)}%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono border-collapse">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="p-2 text-left">Actual \ Pred</th>
                      {modelData.model_all_features.classes.map((cls) => (
                        <th key={cls} className="p-2 text-slate-300">
                          Pred: "{cls}"
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelData.model_all_features.confusion_matrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-2 text-left text-slate-300 font-semibold">
                          Actual: "{modelData.model_all_features.classes[rIdx]}"
                        </td>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 font-bold border border-slate-800 ${
                              rIdx === cIdx ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900/60 text-slate-400'
                            }`}
                          >
                            {val.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confusion Matrix: Selected Features */}
            <div className="rounded-3xl glass-panel p-6 border border-teal-500/30 bg-teal-950/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-teal-300">
                  Confusion Matrix: Selected Features ({modelData.model_selected_features.feature_count} cols)
                </h4>
                <span className="text-xs font-mono text-teal-400">
                  Acc: {(modelData.model_selected_features.accuracy * 100).toFixed(1)}%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono border-collapse">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="p-2 text-left">Actual \ Pred</th>
                      {modelData.model_selected_features.classes.map((cls) => (
                        <th key={cls} className="p-2 text-teal-300">
                          Pred: "{cls}"
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelData.model_selected_features.confusion_matrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-2 text-left text-teal-300 font-semibold">
                          Actual: "{modelData.model_selected_features.classes[rIdx]}"
                        </td>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 font-bold border border-slate-800 ${
                              rIdx === cIdx ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-900/60 text-slate-400'
                            }`}
                          >
                            {val.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Educational Conclusion Box */}
          <div className="rounded-2xl p-6 bg-cyan-500/10 border border-cyan-500/30 space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Machine Learning Takeaway: Parsimony & Generalization
            </h4>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              {modelData.comparison.conclusion}
            </p>
          </div>
        </div>
      )}

      {!modelData && !isTraining && (
        <div className="rounded-3xl glass-panel p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Ready to Benchmark</h3>
          <p className="text-xs lg:text-sm text-slate-400 max-w-md mx-auto">
            Click the "Train & Benchmark Classifiers" button above to execute a real-time machine learning experiment comparing all features versus statistically selected features.
          </p>
        </div>
      )}
    </div>
  );
};
