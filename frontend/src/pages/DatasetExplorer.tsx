import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Database,
  FileCheck,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Layers,
  Sparkles,
  TrendingUp,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { DatasetSummary, DatasetPreview } from '../types';
import { api } from '../services/api';

interface DatasetExplorerProps {
  summary: DatasetSummary | null;
  onRefreshSummary: () => Promise<void>;
  onTargetChange: (targetCol: string) => Promise<void>;
  onLoadSample: (type: 'sample' | 'full') => Promise<void>;
  isLoading: boolean;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  summary,
  onRefreshSummary,
  onTargetChange,
  onLoadSample,
  isLoading,
}) => {
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'stats'>('preview');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch preview data when page, search, or dataset changes
  const fetchPreview = async (page = currentPage, search = searchQuery) => {
    try {
      const data = await api.getPreview(page, 15, search);
      setPreviewData(data);
    } catch (err: any) {
      console.error('Error fetching preview:', err);
    }
  };

  useEffect(() => {
    if (summary?.loaded) {
      fetchPreview(1, searchQuery);
      setCurrentPage(1);
    }
  }, [summary?.dataset_name, summary?.target_column]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchPreview(1, val);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (previewData && newPage > previewData.total_pages)) return;
    setCurrentPage(newPage);
    fetchPreview(newPage, searchQuery);
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      await api.uploadCSV(file);
      await onRefreshSummary();
      await fetchPreview(1, '');
      setSearchQuery('');
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload and parse CSV file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-cyan-400" />
            Dataset Explorer & Data Profiler
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live inspection, delimiter parsing, type inference, and descriptive statistics
          </p>
        </div>

        {/* Action buttons: Load sample or custom */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLoadSample('sample')}
            disabled={isLoading || isUploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Load Bank Sample (4.5k)
          </button>
          <button
            onClick={() => onLoadSample('full')}
            disabled={isLoading || isUploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition"
          >
            Load Bank Full (45.2k)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 transition shadow-lg shadow-cyan-500/20"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl p-6 border-2 border-dashed transition-all text-center ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-navy-900/50'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Drag & drop your CSV dataset here, or click upload
          </h3>
          <p className="text-xs text-slate-400">
            Automatic delimiter detection for semicolon (<code className="text-cyan-300 font-mono">;</code>), comma (<code className="text-cyan-300 font-mono">,</code>), or tab separators.
          </p>
          {isUploading && (
            <div className="inline-flex items-center gap-2 text-xs text-cyan-400 font-medium pt-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Parsing file & computing statistical distributions...
            </div>
          )}
          {uploadError && (
            <div className="flex items-center justify-center gap-2 text-xs text-rose-400 pt-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* Dataset Summary Cards */}
      {summary && summary.loaded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Rows</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {summary.rows.toLocaleString()}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Columns</span>
            <div className="text-xl font-bold text-white font-mono mt-1">{summary.columns}</div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-teal-400">Numeric Cols</span>
            <div className="text-xl font-bold text-teal-300 font-mono mt-1">
              {summary.numeric_features_count}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-cyan-400">Categorical Cols</span>
            <div className="text-xl font-bold text-cyan-300 font-mono mt-1">
              {summary.categorical_features_count}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Missing Values</span>
            <div className="text-xl font-bold text-slate-300 font-mono mt-1">
              {summary.missing_values_total}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Duplicate Rows</span>
            <div className="text-xl font-bold text-slate-300 font-mono mt-1">
              {summary.duplicates_total}
            </div>
          </div>
        </div>
      )}

      {/* Target Column Selector & Schema Details */}
      {summary && summary.loaded && (
        <div className="glass-panel rounded-3xl p-6 lg:p-7 border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Target Variable Specification</h3>
                <p className="text-xs text-slate-400">
                  Select the prediction outcome column. All statistical tests will evaluate features against this target.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Selected Target:</span>
              <select
                value={summary.target_column}
                onChange={(e) => onTargetChange(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer shadow-inner"
              >
                {summary.columns_info.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.dtype})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target class distribution preview */}
          {summary.target_distribution && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Distribution ({summary.target_column}):
              </span>
              {Object.entries(summary.target_distribution).map(([cls, count]) => (
                <span
                  key={cls}
                  className="px-3 py-1 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-slate-700/80 text-cyan-300"
                >
                  "{cls}": {count.toLocaleString()} (
                  {((count / summary.rows) * 100).toFixed(1)}%)
                </span>
              ))}
            </div>
          )}

          {/* Columns Schema Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Detected Feature Schema & Data Types
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {summary.columns_info.map((col) => {
                const isTarget = col.is_target;
                const isNum = col.type === 'numeric';
                return (
                  <div
                    key={col.name}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isTarget
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold'
                        : isNum
                        ? 'bg-teal-950/20 border-teal-500/30 text-teal-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold truncate" title={col.name}>
                        {col.name}
                      </span>
                      {isTarget ? (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-400 text-slate-950 font-bold">
                          TARGET
                        </span>
                      ) : isNum ? (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono">
                          NUM
                        </span>
                      ) : (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          CAT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{col.dtype}</span>
                      <span>{col.unique_count} unq</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Data Preview vs Descriptive Statistics */}
      <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Sub-tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data Preview ({previewData?.total_records.toLocaleString()} rows)
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'stats'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Descriptive Statistics Summary
            </button>
          </div>

          {/* Search filter for data table */}
          {activeTab === 'preview' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search values in rows..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          )}
        </div>

        {/* TAB 1: DATA PREVIEW TABLE */}
        {activeTab === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-900/90 text-slate-300 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-3.5 py-3 text-slate-500 font-mono text-[10px]">#</th>
                    {previewData.columns.map((col) => {
                      const isTarget = col === summary?.target_column;
                      return (
                        <th
                          key={col}
                          className={`px-3.5 py-3 font-mono whitespace-nowrap ${
                            isTarget ? 'text-cyan-400 bg-cyan-950/30' : ''
                          }`}
                        >
                          {col}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-navy-950/40 font-mono">
                  {previewData.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="px-3.5 py-2.5 text-slate-600 text-[10px]">
                        {(currentPage - 1) * 15 + idx + 1}
                      </td>
                      {previewData.columns.map((col) => {
                        const val = row[col];
                        const isTarget = col === summary?.target_column;
                        return (
                          <td
                            key={col}
                            className={`px-3.5 py-2.5 whitespace-nowrap ${
                              isTarget ? 'text-cyan-300 font-semibold bg-cyan-950/20' : 'text-slate-300'
                            }`}
                          >
                            {val !== null && val !== undefined ? String(val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{previewData.total_pages}</strong> (
                {previewData.total_records.toLocaleString()} total filtered records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-cyan-300 px-2 font-semibold">{currentPage}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= previewData.total_pages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESCRIPTIVE STATISTICS TABLE */}
        {activeTab === 'stats' && previewData?.stats && (
          <div className="space-y-6">
            {/* Numerical Features Summary */}
            <div>
              <h4 className="text-sm font-bold text-teal-300 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" />
                Numerical Features Descriptive Statistics (Parametric)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-navy-900/90 text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Feature</th>
                      <th className="px-4 py-2.5">Count</th>
                      <th className="px-4 py-2.5">Mean</th>
                      <th className="px-4 py-2.5">Std Dev</th>
                      <th className="px-4 py-2.5">Min</th>
                      <th className="px-4 py-2.5">25% (Q1)</th>
                      <th className="px-4 py-2.5">Median (Q2)</th>
                      <th className="px-4 py-2.5">75% (Q3)</th>
                      <th className="px-4 py-2.5">Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-navy-950/40">
                    {Object.entries(previewData.stats.numeric).map(([col, s]) => (
                      <tr key={col} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-2.5 text-teal-300 font-semibold">{col}</td>
                        <td className="px-4 py-2.5 text-slate-400">{s.count.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-white">{s.mean.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-slate-300">{s.std.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-slate-400">{s.min}</td>
                        <td className="px-4 py-2.5 text-slate-300">{s.q25}</td>
                        <td className="px-4 py-2.5 text-cyan-300 font-semibold">{s.median}</td>
                        <td className="px-4 py-2.5 text-slate-300">{s.q75}</td>
                        <td className="px-4 py-2.5 text-white">{s.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Categorical Features Summary */}
            <div>
              <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                Categorical Features Frequency & Cardinality (Non-Parametric)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-navy-900/90 text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Feature</th>
                      <th className="px-4 py-2.5">Distinct Categories</th>
                      <th className="px-4 py-2.5">Modal Category (Top)</th>
                      <th className="px-4 py-2.5">Modal Frequency</th>
                      <th className="px-4 py-2.5">Dominance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-navy-950/40">
                    {Object.entries(previewData.stats.categorical).map(([col, s]) => (
                      <tr key={col} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-2.5 text-cyan-300 font-semibold">{col}</td>
                        <td className="px-4 py-2.5 text-white">{s.unique}</td>
                        <td className="px-4 py-2.5 text-teal-300 font-medium">"{s.top}"</td>
                        <td className="px-4 py-2.5 text-slate-300">{s.freq.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {summary?.rows ? ((s.freq / summary.rows) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
