export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'target';
  dtype: string;
  null_count: number;
  unique_count: number;
  is_target: boolean;
}

export interface DatasetSummary {
  loaded: boolean;
  dataset_name: string;
  source: 'builtin' | 'upload';
  rows: number;
  columns: number;
  target_column: string;
  target_distribution: Record<string, number>;
  numeric_features_count: number;
  categorical_features_count: number;
  numeric_features: string[];
  categorical_features: string[];
  missing_values_total: number;
  duplicates_total: number;
  columns_info: ColumnInfo[];
}

export interface NumericStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
}

export interface CategoricalStats {
  unique: number;
  top: string;
  freq: number;
}

export interface DatasetPreview {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  columns: string[];
  data: Record<string, any>[];
  stats: {
    numeric: Record<string, NumericStats>;
    categorical: Record<string, CategoricalStats>;
  };
}

export interface CorrelationResult {
  feature: string;
  correlation: number;
  abs_correlation: number;
  p_value: number;
  strength: string;
  direction: string;
  interpretation: string;
  description: string;
  recommendation: 'KEEP' | 'REVIEW/DROP';
  is_leakage: boolean;
  leakage_warning?: string | null;
}

export interface RedundantPair {
  feature1: string;
  feature2: string;
  correlation: number;
  target_corr_f1: number;
  target_corr_f2: number;
  recommended_keep: string;
  recommended_drop: string;
  explanation: string;
}

export interface CorrelationMatrixData {
  columns: string[];
  rows: {
    feature: string;
    values: Record<string, number | null>;
  }[];
}

export interface CorrelationResponse {
  target_column: string;
  target_mapping?: Record<string, number> | null;
  threshold_applied: number;
  results: CorrelationResult[];
  matrix: CorrelationMatrixData;
  redundant_pairs: RedundantPair[];
  error?: string;
}

export interface ScatterResponse {
  feature: string;
  target: string;
  r_value: number;
  r_squared: number;
  slope: number;
  intercept: number;
  p_value: number;
  points: { x: number; y: number }[];
  trend_line: { x: number; y: number }[];
}

export interface ContingencyCellRow {
  category: string;
  [colCat: string]: any;
}

export interface ContingencyTable {
  rows: string[];
  columns: string[];
  observed: ContingencyCellRow[];
  expected: ContingencyCellRow[];
  residuals: ContingencyCellRow[];
}

export interface ChiSquareResult {
  feature: string;
  chi2_score: number;
  p_value: number;
  dof: number;
  cramers_v: number;
  is_significant: boolean;
  recommendation: 'KEEP' | 'DROP/REVIEW';
  decision_explanation: string;
}

export interface ChiSquareResponse {
  target_column: string;
  alpha_applied: number;
  results: ChiSquareResult[];
  contingency_tables: Record<string, ContingencyTable>;
  error?: string;
}

export interface FeatureDecision {
  feature: string;
  type: 'Numeric' | 'Categorical';
  test_used: string;
  score_name: string;
  score: number;
  abs_score: number;
  p_value: number;
  system_recommendation: 'KEEP' | 'DROP/REVIEW';
  user_override?: 'KEEP' | 'DROP' | null;
  final_decision: 'KEEP' | 'DROP';
  is_leakage: boolean;
  rationale: string;
}

export interface FeatureSelectionResponse {
  target_column: string;
  corr_threshold: number;
  chi_alpha: number;
  total_evaluated: number;
  selected_count: number;
  rejected_count: number;
  selected_features: string[];
  rejected_features: string[];
  features_table: FeatureDecision[];
  duration_leakage_present: boolean;
}

export interface ModelMetrics {
  features_used: string[];
  feature_count: number;
  train_time_sec: number;
  infer_time_sec: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  classes: string[];
}

export interface ModelComparisonResponse {
  dataset_name: string;
  test_samples: number;
  train_samples: number;
  model_all_features: ModelMetrics;
  model_selected_features: ModelMetrics;
  comparison: {
    features_reduced: number;
    percent_features_reduced: number;
    accuracy_delta: number;
    f1_delta: number;
    time_saved_percent: number;
    conclusion: string;
  };
}
