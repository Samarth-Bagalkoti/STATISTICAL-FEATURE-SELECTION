import axios from 'axios';
import {
  DatasetSummary,
  DatasetPreview,
  CorrelationResponse,
  ScatterResponse,
  ChiSquareResponse,
  FeatureSelectionResponse,
  ModelComparisonResponse,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Dataset
  getSummary: async (): Promise<DatasetSummary> => {
    const res = await client.get('/dataset/summary');
    return res.data;
  },

  loadSample: async (sampleType: 'sample' | 'full'): Promise<DatasetSummary> => {
    const res = await client.post('/dataset/load-sample', { sample_type: sampleType });
    return res.data;
  },

  uploadCSV: async (file: File): Promise<DatasetSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/dataset/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  setTarget: async (targetColumn: string) => {
    const res = await client.post('/dataset/set-target', { target_column: targetColumn });
    return res.data;
  },

  getPreview: async (page = 1, pageSize = 15, search = ''): Promise<DatasetPreview> => {
    const res = await client.get('/dataset/preview', {
      params: { page, page_size: pageSize, search },
    });
    return res.data;
  },

  // Pearson Correlation
  getCorrelation: async (threshold = 0.05, targetColumn?: string): Promise<CorrelationResponse> => {
    const res = await client.post('/analysis/correlation', {
      threshold,
      target_column: targetColumn,
    });
    return res.data;
  },

  getScatter: async (feature: string, target?: string): Promise<ScatterResponse> => {
    const res = await client.get('/analysis/scatter', {
      params: { feature, target },
    });
    return res.data;
  },

  // Chi-Square Test
  getChiSquare: async (alpha = 0.05, targetColumn?: string): Promise<ChiSquareResponse> => {
    const res = await client.post('/analysis/chisquare', {
      alpha,
      target_column: targetColumn,
    });
    return res.data;
  },

  // Feature Selection 4-Step Pipeline
  evaluateFeatureSelection: async (
    corrThreshold = 0.05,
    chiAlpha = 0.05,
    targetColumn?: string,
    userOverrides?: Record<string, string>
  ): Promise<FeatureSelectionResponse> => {
    const res = await client.post('/feature-selection/evaluate', {
      corr_threshold: corrThreshold,
      chi_alpha: chiAlpha,
      target_column: targetColumn,
      user_overrides: userOverrides,
    });
    return res.data;
  },

  // Model Comparison
  compareModels: async (
    selectedFeatures?: string[],
    targetColumn?: string,
    testSize = 0.20
  ): Promise<ModelComparisonResponse> => {
    const res = await client.post('/models/compare', {
      selected_features: selectedFeatures,
      target_column: targetColumn,
      test_size: testSize,
    });
    return res.data;
  },

  // Export functions (trigger browser download)
  downloadSelectedCSV: (corrThreshold = 0.05, chiAlpha = 0.05, userOverrides?: Record<string, string>) => {
    return client.post('/export/selected-csv', {
      corr_threshold: corrThreshold,
      chi_alpha: chiAlpha,
      user_overrides: userOverrides,
    }, { responseType: 'blob' });
  },

  downloadDecisionsCSV: (corrThreshold = 0.05, chiAlpha = 0.05, userOverrides?: Record<string, string>) => {
    return client.post('/export/decisions-csv', {
      corr_threshold: corrThreshold,
      chi_alpha: chiAlpha,
      user_overrides: userOverrides,
    }, { responseType: 'blob' });
  },

  exportReport: async (corrThreshold = 0.05, chiAlpha = 0.05, userOverrides?: Record<string, string>) => {
    const res = await client.post('/export/report', {
      corr_threshold: corrThreshold,
      chi_alpha: chiAlpha,
      user_overrides: userOverrides,
    });
    return res.data;
  },
};
