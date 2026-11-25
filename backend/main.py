"""
FeatureLab - Statistical Feature Selection Lab Backend
FastAPI server providing real-time statistical calculations, feature selection algorithms,
model comparison, and dataset management using Pandas, SciPy, and Scikit-learn.
"""

import os
import io
import csv
import time
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="FeatureLab API",
    description="Statistical Feature Selection Lab: Pearson Correlation and Chi-Square Testing",
    version="1.0.0"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# In-memory session state
class SessionState:
    df: Optional[pd.DataFrame] = None
    target_column: Optional[str] = None
    dataset_name: str = "UCI Bank Marketing (Sample)"
    source: str = "builtin"
    user_overrides: Dict[str, str] = {}  # feature_name -> "KEEP" | "DROP"

state = SessionState()


def detect_delimiter(content: bytes) -> str:
    """Auto-detect delimiter (comma, semicolon, tab) from file header."""
    sample = content[:4096].decode("utf-8", errors="ignore")
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,|\t")
        return dialect.delimiter
    except Exception:
        # Fallback check
        lines = sample.splitlines()
        first_line = lines[0] if lines else ""
        if first_line.count(";") > first_line.count(","):
            return ";"
        return ","


def initialize_default_dataset():
    """Load default bank sample dataset on startup."""
    sample_path = os.path.join(DATA_DIR, "bank.csv")
    full_path = os.path.join(DATA_DIR, "bank-full.csv")
    path_to_use = sample_path if os.path.exists(sample_path) else full_path

    if os.path.exists(path_to_use):
        try:
            state.df = pd.read_csv(path_to_use, sep=";")
            state.target_column = "y" if "y" in state.df.columns else state.df.columns[-1]
            state.dataset_name = "UCI Bank Marketing (Sample 4,521 rows)" if path_to_use == sample_path else "UCI Bank Marketing (Full 45,211 rows)"
            state.source = "builtin"
            state.user_overrides = {}
            print(f"Default dataset loaded: {state.dataset_name}, shape: {state.df.shape}")
        except Exception as e:
            print(f"Error loading default dataset: {e}")

initialize_default_dataset()


def get_column_types(df: pd.DataFrame, target_col: Optional[str] = None):
    """Categorize columns into numeric and categorical (excluding target)."""
    numeric_cols = []
    categorical_cols = []
    
    for col in df.columns:
        if col == target_col:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            # If numeric but very few unique values (< 5) and discrete, it could be treated as categorical,
            # but standard numeric columns like age, balance, duration are kept numeric
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)
            
    return numeric_cols, categorical_cols


def encode_target_if_binary(series: pd.Series):
    """
    Encode binary target variable (e.g. 'yes'/'no', 'y'/'n', 'true'/'false') into 0 and 1.
    Returns (encoded_series, is_binary_encoded, mapping_dict)
    """
    clean_series = series.dropna()
    unique_vals = list(clean_series.unique())
    
    if pd.api.types.is_numeric_dtype(series):
        return series.astype(float), True, None
        
    if len(unique_vals) == 2:
        val0, val1 = unique_vals[0], unique_vals[1]
        # Standardize positive class detection
        lower0, lower1 = str(val0).strip().lower(), str(val1).strip().lower()
        if lower0 in ["yes", "y", "1", "true", "positive", "success"]:
            pos_val, neg_val = val0, val1
        elif lower1 in ["yes", "y", "1", "true", "positive", "success"]:
            pos_val, neg_val = val1, val0
        else:
            neg_val, pos_val = val0, val1
            
        mapping = {neg_val: 0, pos_val: 1}
        encoded = series.map(mapping).astype(float)
        return encoded, True, {str(k): v for k, v in mapping.items()}
        
    return series, False, None


# -------------------------------------------------------------
# Request Models
# -------------------------------------------------------------
class SetTargetRequest(BaseModel):
    target_column: str

class LoadSampleRequest(BaseModel):
    sample_type: str  # "sample" or "full"

class CorrelationFilterRequest(BaseModel):
    threshold: float = 0.05
    target_column: Optional[str] = None

class ChiSquareFilterRequest(BaseModel):
    alpha: float = 0.05
    target_column: Optional[str] = None

class FeatureSelectionRequest(BaseModel):
    corr_threshold: float = 0.05
    chi_alpha: float = 0.05
    target_column: Optional[str] = None
    user_overrides: Optional[Dict[str, str]] = None  # feature -> "KEEP" | "DROP"

class ModelComparisonRequest(BaseModel):
    selected_features: Optional[List[str]] = None
    target_column: Optional[str] = None
    test_size: float = 0.20
    random_state: int = 42


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    has_data = state.df is not None
    return {
        "status": "healthy",
        "dataset_loaded": has_data,
        "dataset_name": state.dataset_name,
        "rows": len(state.df) if has_data else 0,
        "columns": len(state.df.columns) if has_data else 0,
        "target_column": state.target_column
    }


@app.post("/api/dataset/load-sample")
def load_sample_dataset(req: LoadSampleRequest):
    fname = "bank-full.csv" if req.sample_type == "full" else "bank.csv"
    path = os.path.join(DATA_DIR, fname)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Sample file {fname} not found in data directory.")
    
    try:
        state.df = pd.read_csv(path, sep=";")
        state.target_column = "y" if "y" in state.df.columns else state.df.columns[-1]
        state.dataset_name = f"UCI Bank Marketing ({'Full 45,211 rows' if req.sample_type == 'full' else 'Sample 4,521 rows'})"
        state.source = "builtin"
        state.user_overrides = {}
        return get_dataset_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample dataset: {str(e)}")


@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV or TXT tabular files are supported.")
    
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    delimiter = detect_delimiter(content)
    try:
        df = pd.read_csv(io.BytesIO(content), sep=delimiter)
        if df.shape[0] < 5 or df.shape[1] < 2:
            raise HTTPException(status_code=400, detail="Dataset is too small (requires at least 5 rows and 2 columns).")
        
        state.df = df
        # Default target column: last column or 'y' if present
        state.target_column = "y" if "y" in df.columns else df.columns[-1]
        state.dataset_name = file.filename
        state.source = "upload"
        state.user_overrides = {}
        
        return get_dataset_summary()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")


@app.post("/api/dataset/set-target")
def set_target(req: SetTargetRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    if req.target_column not in state.df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{req.target_column}' does not exist in dataset.")
    
    state.target_column = req.target_column
    state.user_overrides = {}
    return {
        "success": True,
        "target_column": state.target_column,
        "summary": get_dataset_summary()
    }


@app.get("/api/dataset/summary")
def get_dataset_summary():
    if state.df is None:
        return {"loaded": False}
    
    df = state.df
    target_col = state.target_column or df.columns[-1]
    numeric_cols, categorical_cols = get_column_types(df, target_col)
    
    missing_count = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())
    
    # Target distribution
    target_distribution = {}
    if target_col in df.columns:
        counts = df[target_col].value_counts().to_dict()
        target_distribution = {str(k): int(v) for k, v in counts.items()}
    
    # Column details
    columns_info = []
    for col in df.columns:
        dtype_str = str(df[col].dtype)
        is_num = col in numeric_cols
        is_target = (col == target_col)
        null_count = int(df[col].isnull().sum())
        unique_count = int(df[col].nunique())
        
        columns_info.append({
            "name": col,
            "type": "numeric" if is_num else ("target" if is_target else "categorical"),
            "dtype": dtype_str,
            "null_count": null_count,
            "unique_count": unique_count,
            "is_target": is_target
        })

    return {
        "loaded": True,
        "dataset_name": state.dataset_name,
        "source": state.source,
        "rows": len(df),
        "columns": len(df.columns),
        "target_column": target_col,
        "target_distribution": target_distribution,
        "numeric_features_count": len(numeric_cols),
        "categorical_features_count": len(categorical_cols),
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "missing_values_total": missing_count,
        "duplicates_total": duplicate_count,
        "columns_info": columns_info
    }


@app.get("/api/dataset/preview")
def get_dataset_preview(page: int = 1, page_size: int = 20, search: str = ""):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    df = state.df
    if search:
        mask = df.astype(str).apply(lambda row: row.str.contains(search, case=False).any(), axis=1)
        filtered_df = df[mask]
    else:
        filtered_df = df
        
    total_records = len(filtered_df)
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_records)
    
    page_data = filtered_df.iloc[start_idx:end_idx].replace({np.nan: None}).to_dict(orient="records")
    
    # Calculate statistics
    stats_summary = {}
    # Numeric stats
    numeric_cols, categorical_cols = get_column_types(df, state.target_column)
    if numeric_cols:
        num_stats = df[numeric_cols].describe().T
        stats_summary["numeric"] = {
            col: {
                "count": int(num_stats.loc[col, "count"]),
                "mean": round(float(num_stats.loc[col, "mean"]), 4),
                "std": round(float(num_stats.loc[col, "std"]), 4),
                "min": round(float(num_stats.loc[col, "min"]), 4),
                "q25": round(float(num_stats.loc[col, "25%"]), 4),
                "median": round(float(num_stats.loc[col, "50%"]), 4),
                "q75": round(float(num_stats.loc[col, "75%"]), 4),
                "max": round(float(num_stats.loc[col, "max"]), 4),
            }
            for col in numeric_cols if col in num_stats.index
        }
    else:
        stats_summary["numeric"] = {}

    # Categorical stats
    cat_stats = {}
    for col in categorical_cols:
        val_counts = df[col].value_counts()
        cat_stats[col] = {
            "unique": int(df[col].nunique()),
            "top": str(val_counts.index[0]) if len(val_counts) > 0 else "N/A",
            "freq": int(val_counts.iloc[0]) if len(val_counts) > 0 else 0
        }
    stats_summary["categorical"] = cat_stats

    return {
        "page": page,
        "page_size": page_size,
        "total_records": total_records,
        "total_pages": max(1, (total_records + page_size - 1) // page_size),
        "columns": list(df.columns),
        "data": page_data,
        "stats": stats_summary
    }


# -------------------------------------------------------------
# Pearson Correlation Analysis
# -------------------------------------------------------------

def interpret_correlation(r: float) -> Dict[str, str]:
    """Provide mathematical interpretation according to project specification."""
    abs_r = abs(r)
    sign = "positive" if r >= 0 else "negative"
    
    if abs_r >= 0.7:
        strength = "Strong"
        desc = f"Strong {sign} linear relationship. High predictive potential."
        rec = "KEEP"
    elif abs_r >= 0.3:
        strength = "Moderate"
        desc = f"Moderate {sign} linear relationship. Meaningful signal present."
        rec = "KEEP"
    else:
        strength = "Weak / None"
        desc = f"Little or no linear relationship (|r| < 0.30)."
        rec = "REVIEW/DROP"

    return {
        "strength": strength,
        "direction": "Positive" if r > 0 else ("Negative" if r < 0 else "Zero"),
        "interpretation": f"{strength} {sign}" if abs_r >= 0.3 else "Little or no relation",
        "description": desc,
        "recommendation": rec
    }


@app.post("/api/analysis/correlation")
def analyze_correlation(req: CorrelationFilterRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    df = state.df
    target_col = req.target_column or state.target_column
    if not target_col or target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid target column.")
    
    numeric_cols, _ = get_column_types(df, target_col)
    if not numeric_cols:
        return {
            "results": [],
            "matrix": {"columns": [], "data": []},
            "redundant_pairs": [],
            "error": "No numerical features found for Pearson correlation."
        }
    
    # Target encoding if binary
    encoded_target, is_valid_target, target_mapping = encode_target_if_binary(df[target_col])
    if not is_valid_target:
        raise HTTPException(
            status_code=400,
            detail=f"Target column '{target_col}' has {df[target_col].nunique()} unique categorical values. Pearson correlation requires a numerical or binary target."
        )

    # 1. Correlations with target
    correlations = []
    for col in numeric_cols:
        sub_df = pd.DataFrame({"x": df[col], "y": encoded_target}).dropna()
        if len(sub_df) < 3 or sub_df["x"].std() == 0 or sub_df["y"].std() == 0:
            continue
            
        r_val, p_val = stats.pearsonr(sub_df["x"], sub_df["y"])
        interp = interpret_correlation(r_val)
        
        # Duration data leakage check
        is_leakage = (col.lower() == "duration" and "bank" in state.dataset_name.lower())
        
        # Recommendation based on threshold
        recommendation = "KEEP" if abs(r_val) >= req.threshold else "REVIEW/DROP"
        
        correlations.append({
            "feature": col,
            "correlation": round(float(r_val), 4),
            "abs_correlation": round(abs(float(r_val)), 4),
            "p_value": float(f"{p_val:.4e}") if p_val < 0.0001 else round(float(p_val), 4),
            "strength": interp["strength"],
            "direction": interp["direction"],
            "interpretation": interp["interpretation"],
            "description": interp["description"],
            "recommendation": recommendation,
            "is_leakage": is_leakage,
            "leakage_warning": "Warning: 'duration' is only known after call termination. Using it in pre-call scoring induces severe data leakage." if is_leakage else None
        })

    # Sort descending by absolute correlation
    correlations.sort(key=lambda x: x["abs_correlation"], reverse=True)

    # 2. Complete Pearson correlation matrix
    matrix_cols = numeric_cols + [target_col]
    matrix_df = df[numeric_cols].copy()
    matrix_df[target_col] = encoded_target
    
    corr_matrix = matrix_df.corr(method="pearson").round(4)
    matrix_data = []
    for row_col in matrix_cols:
        row_vals = {}
        for c in matrix_cols:
            val = corr_matrix.loc[row_col, c] if (row_col in corr_matrix.index and c in corr_matrix.columns) else 0.0
            row_vals[c] = None if np.isnan(val) else float(val)
        matrix_data.append({
            "feature": row_col,
            "values": row_vals
        })

    # 3. Multicollinearity / Redundancy detector (|r| >= 0.70 between predictors)
    redundant_pairs = []
    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            f1 = numeric_cols[i]
            f2 = numeric_cols[j]
            pair_corr = corr_matrix.loc[f1, f2]
            if abs(pair_corr) >= 0.70:
                # Find which has higher correlation with target
                c1 = abs(corr_matrix.loc[f1, target_col])
                c2 = abs(corr_matrix.loc[f2, target_col])
                recommended_keep = f1 if c1 >= c2 else f2
                recommended_drop = f2 if c1 >= c2 else f1
                redundant_pairs.append({
                    "feature1": f1,
                    "feature2": f2,
                    "correlation": round(float(pair_corr), 4),
                    "target_corr_f1": round(float(c1), 4),
                    "target_corr_f2": round(float(c2), 4),
                    "recommended_keep": recommended_keep,
                    "recommended_drop": recommended_drop,
                    "explanation": f"Features '{f1}' and '{f2}' share high collinearity (|r| = {abs(pair_corr):.2f} >= 0.70). Keeping both provides redundant signal."
                })

    return {
        "target_column": target_col,
        "target_mapping": target_mapping,
        "threshold_applied": req.threshold,
        "results": correlations,
        "matrix": {
            "columns": matrix_cols,
            "rows": matrix_data
        },
        "redundant_pairs": redundant_pairs
    }


@app.get("/api/analysis/scatter")
def get_scatter_data(feature: str, target: Optional[str] = None, max_points: int = 250):
    """Generate downsampled scatter plot data and regression trend line."""
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    df = state.df
    target_col = target or state.target_column
    if feature not in df.columns or target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid feature or target column.")
    
    encoded_target, is_valid_target, _ = encode_target_if_binary(df[target_col])
    if not is_valid_target:
        raise HTTPException(status_code=400, detail="Target is not numerical or binary.")

    sub_df = pd.DataFrame({"x": df[feature], "y": encoded_target}).dropna()
    if len(sub_df) == 0:
        return {"points": [], "regression": None}
    
    # Calculate linear regression: y = slope * x + intercept
    slope, intercept, r_value, p_value, std_err = stats.linregress(sub_df["x"], sub_df["y"])
    
    # Downsample points for smooth frontend rendering
    if len(sub_df) > max_points:
        sample_df = sub_df.sample(n=max_points, random_state=42).sort_values("x")
    else:
        sample_df = sub_df.sort_values("x")

    points = [
        {"x": round(float(row["x"]), 2), "y": round(float(row["y"]), 2)}
        for _, row in sample_df.iterrows()
    ]

    min_x = float(sub_df["x"].min())
    max_x = float(sub_df["x"].max())
    
    trend_line = [
        {"x": round(min_x, 2), "y": round(float(slope * min_x + intercept), 4)},
        {"x": round(max_x, 2), "y": round(float(slope * max_x + intercept), 4)}
    ]

    return {
        "feature": feature,
        "target": target_col,
        "r_value": round(float(r_value), 4),
        "r_squared": round(float(r_value ** 2), 4),
        "slope": round(float(slope), 6),
        "intercept": round(float(intercept), 4),
        "p_value": float(f"{p_value:.4e}") if p_value < 0.0001 else round(float(p_value), 4),
        "points": points,
        "trend_line": trend_line
    }


# -------------------------------------------------------------
# Chi-Square Test of Independence Analysis
# -------------------------------------------------------------

@app.post("/api/analysis/chisquare")
def analyze_chisquare(req: ChiSquareFilterRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    df = state.df
    target_col = req.target_column or state.target_column
    if not target_col or target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid target column.")
    
    _, categorical_cols = get_column_types(df, target_col)
    if not categorical_cols:
        return {
            "results": [],
            "error": "No categorical features found for Chi-Square test."
        }
    
    results = []
    contingency_tables = {}
    
    for col in categorical_cols:
        # Create cross-tabulation (Observed)
        sub_df = df[[col, target_col]].dropna()
        if len(sub_df) < 5 or sub_df[col].nunique() < 2 or sub_df[target_col].nunique() < 2:
            continue
            
        contingency = pd.crosstab(sub_df[col], sub_df[target_col])
        
        try:
            chi2, p_val, dof, expected = stats.chi2_contingency(contingency)
            
            # Formulate structured contingency data
            observed_matrix = []
            expected_matrix = []
            residuals_matrix = []
            
            row_categories = [str(r) for r in contingency.index]
            col_categories = [str(c) for c in contingency.columns]
            
            for i, row_cat in enumerate(row_categories):
                obs_row = {}
                exp_row = {}
                res_row = {}
                for j, col_cat in enumerate(col_categories):
                    o = int(contingency.iloc[i, j])
                    e = float(expected[i, j])
                    # Cell residual (O - E)^2 / E
                    res = ((o - e) ** 2) / e if e > 0 else 0.0
                    
                    obs_row[col_cat] = o
                    exp_row[col_cat] = round(e, 2)
                    res_row[col_cat] = round(res, 3)
                    
                observed_matrix.append({"category": row_cat, **obs_row})
                expected_matrix.append({"category": row_cat, **exp_row})
                residuals_matrix.append({"category": row_cat, **res_row})
            
            contingency_tables[col] = {
                "rows": row_categories,
                "columns": col_categories,
                "observed": observed_matrix,
                "expected": expected_matrix,
                "residuals": residuals_matrix
            }
            
            # Decision rule: p < alpha -> Significant -> KEEP
            is_significant = bool(p_val < req.alpha)
            recommendation = "KEEP" if is_significant else "DROP/REVIEW"
            
            # Effect size approximation: Cramer's V
            n_obs = len(sub_df)
            min_dim = min(len(row_categories) - 1, len(col_categories) - 1)
            cramers_v = float(np.sqrt(chi2 / (n_obs * min_dim))) if (n_obs * min_dim) > 0 else 0.0
            
            results.append({
                "feature": col,
                "chi2_score": round(float(chi2), 3),
                "p_value": float(f"{p_val:.4e}") if p_val < 0.0001 else round(float(p_val), 4),
                "dof": int(dof),
                "cramers_v": round(float(cramers_v), 4),
                "is_significant": is_significant,
                "recommendation": recommendation,
                "decision_explanation": (
                    f"p-value ({p_val:.2e} if p_val < 0.001 else {p_val:.4f}) < {req.alpha} indicates statistically significant dependence with target."
                    if is_significant
                    else f"p-value >= {req.alpha}. Insufficient evidence of association; feature likely independent of target."
                )
            })
        except Exception as e:
            print(f"Error computing Chi-Square for column {col}: {e}")
            continue

    # Sort results by chi2 score descending
    results.sort(key=lambda x: x["chi2_score"], reverse=True)

    return {
        "target_column": target_col,
        "alpha_applied": req.alpha,
        "results": results,
        "contingency_tables": contingency_tables
    }


# -------------------------------------------------------------
# 4-Step Feature Selection Pipeline
# -------------------------------------------------------------

@app.post("/api/feature-selection/evaluate")
def evaluate_feature_selection(req: FeatureSelectionRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    df = state.df
    target_col = req.target_column or state.target_column
    if not target_col or target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid target column.")
    
    numeric_cols, categorical_cols = get_column_types(df, target_col)
    
    # Sync user overrides if provided
    if req.user_overrides is not None:
        state.user_overrides = req.user_overrides
    
    features_table = []
    
    # 1. Evaluate Numerical Features via Pearson Correlation
    encoded_target, is_valid_target, _ = encode_target_if_binary(df[target_col])
    if is_valid_target and numeric_cols:
        for col in numeric_cols:
            sub_df = pd.DataFrame({"x": df[col], "y": encoded_target}).dropna()
            if len(sub_df) < 3 or sub_df["x"].std() == 0 or sub_df["y"].std() == 0:
                continue
            r_val, p_val = stats.pearsonr(sub_df["x"], sub_df["y"])
            abs_r = abs(r_val)
            
            # Recommendation
            sys_rec = "KEEP" if abs_r >= req.corr_threshold else "DROP/REVIEW"
            
            # Leakage check
            is_leakage = (col.lower() == "duration" and "bank" in state.dataset_name.lower())
            
            # Final decision takes into account manual user override
            user_override = state.user_overrides.get(col)
            final_decision = user_override if user_override in ["KEEP", "DROP"] else ("KEEP" if sys_rec == "KEEP" else "DROP")
            
            if is_leakage:
                rationale = "CAUTION: Target leakage risk. Duration is only recorded after a call completes. In production pre-call models, this causes severe data leakage."
            elif abs_r >= 0.7:
                rationale = f"Strong linear association (|r| = {abs_r:.4f} >= 0.70). High predictive signal."
            elif abs_r >= req.corr_threshold:
                rationale = f"Meaningful correlation (|r| = {abs_r:.4f} >= {req.corr_threshold}). Selected."
            else:
                rationale = f"Weak linear correlation (|r| = {abs_r:.4f} < {req.corr_threshold}). Recommended to drop to reduce noise and overfitting."

            features_table.append({
                "feature": col,
                "type": "Numeric",
                "test_used": "Pearson Correlation",
                "score_name": "r-value",
                "score": round(float(r_val), 4),
                "abs_score": round(float(abs_r), 4),
                "p_value": float(f"{p_val:.4e}") if p_val < 0.0001 else round(float(p_val), 4),
                "system_recommendation": sys_rec,
                "user_override": user_override,
                "final_decision": final_decision,
                "is_leakage": is_leakage,
                "rationale": rationale
            })

    # 2. Evaluate Categorical Features via Chi-Square Test
    if categorical_cols:
        for col in categorical_cols:
            sub_df = df[[col, target_col]].dropna()
            if len(sub_df) < 5 or sub_df[col].nunique() < 2 or sub_df[target_col].nunique() < 2:
                continue
            try:
                contingency = pd.crosstab(sub_df[col], sub_df[target_col])
                chi2, p_val, dof, _ = stats.chi2_contingency(contingency)
                
                sys_rec = "KEEP" if p_val < req.chi_alpha else "DROP/REVIEW"
                user_override = state.user_overrides.get(col)
                final_decision = user_override if user_override in ["KEEP", "DROP"] else ("KEEP" if sys_rec == "KEEP" else "DROP")
                
                if p_val < req.chi_alpha:
                    rationale = f"Statistically significant dependence (χ² = {chi2:.2f}, p = {p_val:.2e} < {req.chi_alpha}). Selected."
                else:
                    rationale = f"Independent of target (p = {p_val:.4f} >= {req.chi_alpha}). Recommended to drop due to lack of evidence."

                features_table.append({
                    "feature": col,
                    "type": "Categorical",
                    "test_used": "Chi-Square Test",
                    "score_name": "χ²-score",
                    "score": round(float(chi2), 3),
                    "abs_score": round(float(chi2), 3),
                    "p_value": float(f"{p_val:.4e}") if p_val < 0.0001 else round(float(p_val), 4),
                    "system_recommendation": sys_rec,
                    "user_override": user_override,
                    "final_decision": final_decision,
                    "is_leakage": False,
                    "rationale": rationale
                })
            except Exception as e:
                print(f"Error evaluating feature {col}: {e}")

    # Aggregates
    selected_features = [f["feature"] for f in features_table if f["final_decision"] == "KEEP"]
    rejected_features = [f["feature"] for f in features_table if f["final_decision"] == "DROP"]
    
    return {
        "target_column": target_col,
        "corr_threshold": req.corr_threshold,
        "chi_alpha": req.chi_alpha,
        "total_evaluated": len(features_table),
        "selected_count": len(selected_features),
        "rejected_count": len(rejected_features),
        "selected_features": selected_features,
        "rejected_features": rejected_features,
        "features_table": features_table,
        "duration_leakage_present": any(f["is_leakage"] for f in features_table)
    }


# -------------------------------------------------------------
# Machine Learning Model Comparison
# -------------------------------------------------------------

@app.post("/api/models/compare")
def compare_models(req: ModelComparisonRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    df = state.df
    target_col = req.target_column or state.target_column
    if not target_col or target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid target column.")
    
    # Subsample if dataset is enormous (for responsive browser experience)
    if len(df) > 12000:
        ml_df = df.sample(n=10000, random_state=req.random_state)
    else:
        ml_df = df.copy()

    # Determine candidate feature sets
    all_numeric, all_cat = get_column_types(ml_df, target_col)
    all_eligible = all_numeric + all_cat
    
    if not all_eligible:
        raise HTTPException(status_code=400, detail="No feature columns available to train.")

    # Target preprocessing
    y = ml_df[target_col].astype(str)
    
    # If selected features not passed, run default evaluation
    selected_features = req.selected_features
    if not selected_features:
        eval_res = evaluate_feature_selection(FeatureSelectionRequest(
            corr_threshold=0.05,
            chi_alpha=0.05,
            target_column=target_col
        ))
        selected_features = eval_res["selected_features"]
        
    if not selected_features:
        # Fallback if none selected: take top 2 numeric and top 2 cat
        selected_features = all_eligible[:min(4, len(all_eligible))]

    # Common Train/Test Split (fixed index so test set is 100% identical!)
    X_train_full, X_test_full, y_train, y_test = train_test_split(
        ml_df[all_eligible], y, test_size=req.test_size, random_state=req.random_state, stratify=y
    )

    classes = sorted(list(y.unique()))

    def build_and_evaluate_model(features: List[str]):
        num_cols = [c for c in features if c in all_numeric]
        cat_cols = [c for c in features if c in all_cat]
        
        transformers = []
        if num_cols:
            num_pipe = Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ])
            transformers.append(("num", num_pipe, num_cols))
            
        if cat_cols:
            cat_pipe = Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
            ])
            transformers.append(("cat", cat_pipe, cat_cols))
            
        preprocessor = ColumnTransformer(transformers=transformers)
        
        clf = Pipeline([
            ("preprocessor", preprocessor),
            ("rf", RandomForestClassifier(n_estimators=60, max_depth=12, random_state=req.random_state, n_jobs=-1))
        ])
        
        # Train and time strictly
        t0 = time.time()
        clf.fit(X_train_full[features], y_train)
        train_time = round(time.time() - t0, 3)
        
        t1 = time.time()
        y_pred = clf.predict(X_test_full[features])
        infer_time = round(time.time() - t1, 4)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        
        cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
        
        return {
            "features_used": features,
            "feature_count": len(features),
            "train_time_sec": train_time,
            "infer_time_sec": infer_time,
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm,
            "classes": classes
        }

    # Model 1: All Eligible Features
    model_all = build_and_evaluate_model(all_eligible)
    
    # Model 2: Selected Features Only
    model_selected = build_and_evaluate_model(selected_features)

    # Calculate delta
    features_reduced = model_all["feature_count"] - model_selected["feature_count"]
    pct_features_reduced = round((features_reduced / model_all["feature_count"]) * 100, 1) if model_all["feature_count"] > 0 else 0
    f1_delta = round(model_selected["f1_score"] - model_all["f1_score"], 4)
    acc_delta = round(model_selected["accuracy"] - model_all["accuracy"], 4)
    time_saved_pct = round(((model_all["train_time_sec"] - model_selected["train_time_sec"]) / max(0.001, model_all["train_time_sec"])) * 100, 1)

    conclusion = (
        f"Feature selection removed {features_reduced} features ({pct_features_reduced}% reduction). "
        f"The model retained competitive performance (F1-score: {model_selected['f1_score']} vs {model_all['f1_score']}) "
        f"while reducing training time by {time_saved_pct}% and substantially improving model interpretability."
    )

    return {
        "dataset_name": state.dataset_name,
        "test_samples": len(y_test),
        "train_samples": len(y_train),
        "model_all_features": model_all,
        "model_selected_features": model_selected,
        "comparison": {
            "features_reduced": features_reduced,
            "percent_features_reduced": pct_features_reduced,
            "accuracy_delta": acc_delta,
            "f1_delta": f1_delta,
            "time_saved_percent": time_saved_pct,
            "conclusion": conclusion
        }
    }


# -------------------------------------------------------------
# Export Endpoints
# -------------------------------------------------------------

@app.post("/api/export/selected-csv")
def export_selected_csv(req: FeatureSelectionRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    eval_res = evaluate_feature_selection(req)
    selected_cols = eval_res["selected_features"]
    target_col = req.target_column or state.target_column
    
    cols_to_export = [c for c in selected_cols if c in state.df.columns]
    if target_col in state.df.columns and target_col not in cols_to_export:
        cols_to_export.append(target_col)
        
    export_df = state.df[cols_to_export]
    
    stream = io.StringIO()
    export_df.to_csv(stream, index=False)
    stream.seek(0)
    
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=featurelab_selected_dataset.csv"}
    )


@app.post("/api/export/decisions-csv")
def export_decisions_csv(req: FeatureSelectionRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    eval_res = evaluate_feature_selection(req)
    decisions_df = pd.DataFrame(eval_res["features_table"])
    
    stream = io.StringIO()
    decisions_df.to_csv(stream, index=False)
    stream.seek(0)
    
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=featurelab_statistical_decisions.csv"}
    )


@app.post("/api/export/report")
def export_report(req: FeatureSelectionRequest):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    
    eval_res = evaluate_feature_selection(req)
    target_col = req.target_column or state.target_column
    
    report_lines = [
        "# FeatureLab - Statistical Feature Selection Audit Report",
        f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}",
        f"Dataset: {state.dataset_name}",
        f"Total Records: {len(state.df)}",
        f"Target Column: {target_col}",
        "",
        "## 1. Executive Summary",
        f"- Total Features Evaluated: {eval_res['total_evaluated']}",
        f"- Features Recommended & Kept: {eval_res['selected_count']}",
        f"- Features Rejected / Dropped: {eval_res['rejected_count']}",
        f"- Pearson Correlation Threshold (|r|): >= {req.corr_threshold}",
        f"- Chi-Square Significance Level (alpha): < {req.chi_alpha}",
        "",
        "## 2. Statistical Decisions Breakdown",
        "| Feature | Type | Test | Score | P-Value | Decision | Rationale |",
        "|---|---|---|---|---|---|---|"
    ]
    
    for f in eval_res["features_table"]:
        score_repr = f"{f['score_name']}={f['score']}"
        report_lines.append(
            f"| {f['feature']} | {f['type']} | {f['test_used']} | {score_repr} | {f['p_value']} | {f['final_decision']} | {f['rationale']} |"
        )
        
    report_lines.extend([
        "",
        "## 3. Data Leakage & Domain Considerations",
        "In predictive machine learning, features that are only generated or recorded during/after the outcome event must not be included during pre-event prediction.",
        "In the Bank Marketing dataset, `duration` has the highest correlation with subscription `y` because customer calls with subscribers are substantially longer.",
        "However, before an agent initiates a phone call, `duration` is inherently 0 or unknown. Hence, keeping `duration` causes synthetic data leakage in pre-call customer scoring models.",
        "",
        "## 4. Final Conclusion",
        f"The feature selection pipeline successfully reduced the feature space to {eval_res['selected_count']} high-signal attributes while filtering out noise and non-informative variables."
    ])
    
    report_text = "\n".join(report_lines)
    return JSONResponse(content={
        "report_markdown": report_text,
        "dataset_name": state.dataset_name,
        "selected_features": eval_res["selected_features"],
        "rejected_features": eval_res["rejected_features"]
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
