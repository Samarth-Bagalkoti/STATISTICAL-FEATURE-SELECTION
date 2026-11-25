import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { DatasetExplorer } from './pages/DatasetExplorer';
import { CorrelationAnalysis } from './pages/CorrelationAnalysis';
import { ChiSquareAnalysis } from './pages/ChiSquareAnalysis';
import { FeatureSelection } from './pages/FeatureSelection';
import { ModelComparison } from './pages/ModelComparison';
import { AboutMethodology } from './pages/AboutMethodology';
import { ReportModal } from './components/common/ReportModal';
import { DatasetSummary, FeatureSelectionResponse } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [selectionResult, setSelectionResult] = useState<FeatureSelectionResponse | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize dataset summary and initial selection evaluation
  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      const summaryData = await api.getSummary();
      setSummary(summaryData);
      if (summaryData.loaded) {
        const selectionData = await api.evaluateFeatureSelection(0.05, 0.05, summaryData.target_column);
        setSelectionResult(selectionData);
      }
    } catch (err) {
      console.error('Failed to load dataset summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleTargetChange = async (newTarget: string) => {
    setIsLoading(true);
    try {
      await api.setTarget(newTarget);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to change target:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async (type: 'sample' | 'full') => {
    setIsLoading(true);
    try {
      await api.loadSample(type);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to load sample dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReport = async () => {
    try {
      const res = await api.exportReport(
        selectionResult?.corr_threshold || 0.05,
        selectionResult?.chi_alpha || 0.05
      );
      setReportMarkdown(res.report_markdown);
      setIsReportOpen(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        datasetName={summary?.dataset_name}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all">
        {/* Top Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          summary={summary}
          onTargetChange={handleTargetChange}
          onOpenReport={handleOpenReport}
          onLoadSample={handleLoadSample}
          isLoading={isLoading}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              summary={summary}
              selectionResult={selectionResult}
              onNavigate={setCurrentTab}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'explorer' && (
            <DatasetExplorer
              summary={summary}
              onRefreshSummary={refreshAllData}
              onTargetChange={handleTargetChange}
              onLoadSample={handleLoadSample}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'correlation' && (
            <CorrelationAnalysis summary={summary} />
          )}

          {currentTab === 'chisquare' && (
            <ChiSquareAnalysis summary={summary} />
          )}

          {currentTab === 'selection' && (
            <FeatureSelection
              summary={summary}
              selectionResult={selectionResult}
              onUpdateSelection={setSelectionResult}
              onOpenReport={handleOpenReport}
            />
          )}

          {currentTab === 'models' && (
            <ModelComparison
              summary={summary}
              selectionResult={selectionResult}
            />
          )}

          {currentTab === 'methodology' && (
            <AboutMethodology />
          )}
        </main>
      </div>

      {/* Global Audit Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportMarkdown={reportMarkdown}
        datasetName={summary?.dataset_name || 'Active Dataset'}
      />
    </div>
  );
};

export default App;
