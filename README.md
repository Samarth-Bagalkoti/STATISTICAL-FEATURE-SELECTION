# FeatureLab - Statistical Feature Selection Lab

> **Discover the mathematics behind smarter machine learning.**

FeatureLab is a modern, interactive educational and data science platform designed to teach and demonstrate how statistical methods select high-signal features from machine learning datasets using:
1. **Pearson Correlation Analysis** for numerical features ($r = \frac{\text{Cov}(X,Y)}{\sigma_X \sigma_Y}$)
2. **Chi-Square Test of Independence** for categorical features ($\chi^2 = \sum \frac{(O-E)^2}{E}$)

Built with an academic mathematics focus, the platform pairs rigorous theoretical foundations with live, real-time computation on the **UCI Bank Marketing Dataset** (45,211 rows) alongside drag-and-drop custom CSV upload support (auto-detecting both semicolon `;` and comma `,` separators).

---

## 🌟 Key Features

- **Dashboard / Home**:
  - Live dataset KPI cards (Total Records, Numerical Features, Categorical Features, Selected Features, Rejected Features).
  - Interactive visual walkthrough of the complete 4-step feature selection pipeline.
- **Dataset Explorer**:
  - One-click loading of the official **UCI Bank Marketing Dataset** (Full: 45,211 rows or Sample: 4,521 rows).
  - Drag-and-drop CSV uploader with auto-delimiter detection (`;` and `,`).
  - Automatic detection of numerical vs. categorical data types.
  - Identification of missing cells and duplicate rows.
  - Interactive target variable selector with live class distribution preview.
  - Data preview table with pagination and search.
  - Parametric and non-parametric descriptive statistics (Mean, Std, Min, Quartiles, Max, Cardinality, Mode).
- **Pearson Correlation Analysis**:
  - Exact mathematical formulas with KaTeX display.
  - Live calculation of Pearson correlation coefficient $r$ and two-tailed p-values against the target.
  - Configurable $|r|$ threshold slider with instant re-calculation.
  - Interactive scatter plot with fitted Ordinary Least Squares (OLS) linear regression trend line ($y = mx + b$).
  - Full $N \times N$ interactive correlation heatmap matrix with cell tooltips.
  - Multicollinearity and redundancy detector flagging predictor pairs with $|r| \ge 0.70$.
  - Explanation of strong negative correlation ($r \in [-1.0, -0.7]$) as high predictive signal.
- **Chi-Square Test Analysis**:
  - Theory and hypothesis testing framework ($H_0$ independence vs $H_1$ association).
  - Configurable significance level $\alpha$ slider (default $0.05$).
  - Categorical feature relevance bar chart ranking features by $\chi^2$ statistic.
  - Interactive contingency tables displaying **Observed Frequencies ($O$)**, **Expected Frequencies ($E$)**, and **Cell Residuals ($\frac{(O-E)^2}{E}$)**.
  - Safe numerical computation handling zero frequencies and sparse distributions.
- **4-Step Feature Selection Workflow**:
  - **Step 1: Feature Splitting & Target Isolation**
  - **Step 2: Pearson Correlation Filter** (configurable threshold $|r| \ge \text{threshold}$)
  - **Step 3: Chi-Square Independence Filter** (configurable $\alpha$ cutoff)
  - **Step 4: Decision & Override Matrix** (Feature, Type, Score, P-Value, System Recommendation, Manual Override, Detailed Rationale).
  - **Data Leakage Warning**: Highlights the post-call nature of the Bank Marketing `duration` feature, offering a one-click toggle to exclude it from pre-call prediction models.
- **Empirical Model Comparison (Machine Learning)**:
  - Trains two Random Forest classifiers on the exact same stratified 80/20 train/test split:
    1. **Model A**: All Eligible Features
    2. **Model B**: Statistically Selected Features
  - Strict data science methodology: preprocessors (imputation, standard scaling, one-hot encoding) are fitted *strictly on the training partition only* to guarantee zero test leakage.
  - Metrics comparison: Accuracy, Weighted Precision, Weighted Recall, Weighted F1-Score, Training Speed, and Confusion Matrices.
- **Educational Section (About & Methodology)**:
  - Answers 10 fundamental data science questions: What is a feature? What is feature selection? Overfitting, Multicollinearity, Pearson derivation, Chi-Square derivation, p-values, and the Bank Marketing duration case study.
  - Comprehensive comparison matrix table between Pearson Correlation and Chi-Square.
- **Export & Downloads**:
  - Download selected-features dataset as CSV.
  - Download statistical decisions matrix as CSV.
  - Interactive modal to view, copy, print, or download a complete Markdown Audit Report.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, KaTeX |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Python-Multipart |
| **Data Processing** | Pandas, NumPy |
| **Statistical Computations** | SciPy Stats (`pearsonr`, `chi2_contingency`, `linregress`) |
| **Machine Learning** | Scikit-Learn (`RandomForestClassifier`, `Pipeline`, `ColumnTransformer`, `StandardScaler`, `OneHotEncoder`) |

---

## 🚀 Installation & Running

### Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher (v20+ recommended) and npm

### 1. Backend Setup

From the project root:

```bash
# Create and activate virtual environment (optional but recommended)
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` (interactive API documentation at `http://localhost:8000/docs`).

### 2. Frontend Setup

In a new terminal window, navigate to the `frontend` directory:

```bash
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173` to explore **FeatureLab**.

---

## 🧪 Running Automated Tests

Run the backend unit test suite verifying Pearson calculations, Chi-Square contingency matrices, feature selection logic, and model training:

```bash
python -m unittest tests/test_backend.py
```

---

## 📊 Dataset Attribution

- **Dataset**: Bank Marketing Dataset
- **Source**: [UCI Machine Learning Repository (ID: 222)](https://archive.ics.uci.edu/dataset/222/bank+marketing)
- **Reference**: S. Moro, P. Cortez and P. Rita. *A Data-Driven Approach to Predict the Success of Bank Telemarketing.* Decision Support Systems, Elsevier, 62:22-31, June 2014.
- **Files bundled**:
  - `data/bank.csv`: 4,521 rows (10% sample)
  - `data/bank-full.csv`: 45,211 rows (full dataset)
