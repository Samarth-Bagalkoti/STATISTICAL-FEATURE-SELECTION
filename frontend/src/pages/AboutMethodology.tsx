import React from 'react';
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  Scale,
  ShieldAlert,
  Layers,
  HelpCircle,
  CheckCircle2,
  Cpu,
  Zap,
} from 'lucide-react';
import { MathFormula } from '../components/common/MathFormula';

export const AboutMethodology: React.FC = () => {
  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Page Title */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          Academic & Theoretical Foundation
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white">
          Statistical Feature Selection Methodology
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A comprehensive mathematical guide to dimensionality reduction, hypothesis testing, and statistical learning.
        </p>
      </div>

      {/* Comparison Cheat Sheet Table: Pearson vs Chi-Square */}
      <div className="rounded-3xl glass-panel p-6 lg:p-8 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          Methodology Cheat Sheet: Pearson vs Chi-Square
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Dimension</th>
                <th className="p-3.5 text-teal-300">Pearson Correlation Analysis</th>
                <th className="p-3.5 text-cyan-300">Chi-Square Test of Independence (χ²)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-navy-950/40 font-mono">
              <tr>
                <td className="p-3.5 font-sans font-bold text-slate-300">Target Feature Type</td>
                <td className="p-3.5 text-teal-300">Continuous / Numerical (or Binary {'{0, 1}'})</td>
                <td className="p-3.5 text-cyan-300">Discrete Nominal / Categorical</td>
              </tr>
              <tr>
                <td className="p-3.5 font-sans font-bold text-slate-300">Predictor Feature Type</td>
                <td className="p-3.5 text-teal-300">Continuous / Numerical (e.g., Age, Balance)</td>
                <td className="p-3.5 text-cyan-300">Categorical (e.g., Job, Marital, Education)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-sans font-bold text-slate-300">Core Mathematical Metric</td>
                <td className="p-3.5 text-slate-200">Covariance scaled by standard deviations (r ∈ [-1, +1])</td>
                <td className="p-3.5 text-slate-200">Sum of normalized squared deviations (χ² ≥ 0)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-sans font-bold text-slate-300">Theoretical Hypothesis</td>
                <td className="p-3.5 text-slate-400">H₀: ρ = 0 (No linear correlation)</td>
                <td className="p-3.5 text-slate-400">H₀: Variables are statistically independent</td>
              </tr>
              <tr>
                <td className="p-3.5 font-sans font-bold text-slate-300">Key Decision Rule</td>
                <td className="p-3.5 text-teal-300 font-sans">
                  Keep if <strong>|r| ≥ threshold</strong> (e.g., 0.05)
                </td>
                <td className="p-3.5 text-cyan-300 font-sans">
                  Keep if <strong>p-value &lt; α</strong> (e.g., 0.05)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 10 Core Questions & Educational Topics */}
      <div className="space-y-6">
        {/* Q1: What is a feature? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              1
            </span>
            What is a Feature in Machine Learning?
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            In supervised machine learning, a <strong>feature</strong> (or independent variable, attribute, or covariate) is an individual measurable property or characteristic of a phenomenon being observed. In our Bank Marketing dataset, features describe customer demographics (e.g., <code className="text-cyan-300 font-mono">age</code>, <code className="text-cyan-300 font-mono">job</code>, <code className="text-cyan-300 font-mono">education</code>), financial indicators (e.g., <code className="text-cyan-300 font-mono">balance</code>, <code className="text-cyan-300 font-mono">loan</code>), and past campaign interactions (e.g., <code className="text-cyan-300 font-mono">previous</code>, <code className="text-cyan-300 font-mono">poutcome</code>).
          </p>
        </div>

        {/* Q2: What is feature selection? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              2
            </span>
            What is Feature Selection? (Filter vs Wrapper vs Embedded)
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            <strong>Feature Selection</strong> is the process of isolating the most relevant subset of original features to be used in model construction. It differs from dimensionality reduction techniques like PCA because it preserves the original feature identities, maintaining complete domain interpretability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
              <strong className="text-cyan-300 block mb-1">Filter Methods (Our Lab)</strong>
              Evaluates features using purely statistical measures (Pearson r, Chi-Square χ²) independent of any ML model. Extremely fast and scalable.
            </div>
            <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
              <strong className="text-teal-300 block mb-1">Wrapper Methods</strong>
              Uses a predictive model as an evaluation engine (e.g., Recursive Feature Elimination). Highly computationally intensive.
            </div>
            <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
              <strong className="text-purple-300 block mb-1">Embedded Methods</strong>
              Feature selection occurs naturally during model training (e.g., LASSO L1 regularization, Tree Gini importance).
            </div>
          </div>
        </div>

        {/* Q3: Why is feature selection necessary? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              3
            </span>
            Why is Feature Selection Necessary? (The Curse of Dimensionality)
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            As the number of features <span className="font-mono text-cyan-300">p</span> grows, the volume of the feature space increases exponentially, causing the available data points to become extremely sparse. This phenomenon is known as the <strong>Curse of Dimensionality</strong>. Without feature selection:
          </p>
          <ul className="list-disc pl-5 text-xs lg:text-sm text-slate-400 space-y-1">
            <li>Machine learning models require exponentially more observations to achieve statistical confidence.</li>
            <li>Noisy variables mislead decision algorithms and inflate prediction variance.</li>
            <li>Computational training and inference latency multiply significantly.</li>
          </ul>
        </div>

        {/* Q4: What is overfitting? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              4
            </span>
            What is Overfitting and How Does Selection Prevent It?
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            <strong>Overfitting</strong> occurs when a machine learning algorithm memorizes random noise and idiosyncrasies in the training set rather than learning true underlying population relationships. By filtering out uninformative features (those with near-zero Pearson correlation or non-significant Chi-Square p-values), we reduce model complexity and promote <strong>Occam's Razor (parsimony)</strong>, leading to superior generalization on unseen test data.
          </p>
        </div>

        {/* Q5: What is redundant data and multicollinearity? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              5
            </span>
            What is Redundant Data & Multicollinearity?
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            Two features are <strong>redundant</strong> if they convey essentially identical predictive information. In statistical terms, when two predictor variables share a high Pearson correlation (<span className="font-mono text-amber-300">|r| ≥ 0.70</span>), they exhibit <strong>multicollinearity</strong>. In linear models, multicollinearity destabilizes coefficient estimates; in tree-based ensembles, it splits importance artificially between correlated variables. Detecting and removing the redundant feature with lower target correlation solves this problem cleanly.
          </p>
        </div>

        {/* Q6: What is Pearson Correlation? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold font-mono">
              6
            </span>
            What is Pearson Correlation? Mathematical Derivation & Assumptions
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            Formulated by Karl Pearson, the correlation coefficient measures the degree of linear relationship between two continuous variables:
          </p>
          <div className="p-4 rounded-xl bg-navy-950 text-center">
            <MathFormula formula="r_{xy} = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2 \sum_{i=1}^n (y_i - \bar{y})^2}}" />
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <strong className="text-slate-200">Key Assumptions:</strong>
            <p>1. Continuous interval or ratio measurement scale (or binary encoded 0/1).</p>
            <p>2. Linear relationship (Pearson cannot detect non-linear curves like parabolas).</p>
            <p>3. Minimal extreme outliers, as squared differences make r sensitive to extreme values.</p>
          </div>
        </div>

        {/* Q7: What is the Chi-Square test? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              7
            </span>
            What is the Chi-Square Test of Independence?
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            The Chi-Square test of independence assesses whether observed cell frequencies in a contingency table deviate from what would be expected under pure statistical independence:
          </p>
          <div className="p-4 rounded-xl bg-navy-950 text-center">
            <MathFormula formula="\chi^2 = \sum_{i=1}^r \sum_{j=1}^c \frac{(O_{ij} - E_{ij})^2}{E_{ij}}, \quad E_{ij} = \frac{(\text{Row Total}_i) \cdot (\text{Column Total}_j)}{\text{Grand Total } N}" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If <span className="font-mono text-cyan-300">O ≈ E</span> everywhere, <span className="font-mono">χ² ≈ 0</span>, meaning the feature and target are independent. As observed frequencies diverge from expected values, <span className="font-mono text-cyan-300">χ²</span> increases, driving the p-value down toward 0.
          </p>
        </div>

        {/* Q8: What is a p-value? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              8
            </span>
            What is a p-value and Statistical Significance?
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            The <strong>p-value</strong> is the probability of observing a test statistic as extreme as, or more extreme than, the observed value, assuming the null hypothesis (<span className="font-mono text-cyan-300">H₀</span>) is completely true.
            <br />• When <span className="font-mono text-teal-300">p &lt; 0.05</span>, it is highly unlikely that the observed pattern occurred by pure random chance. We reject the null hypothesis and conclude there is a statistically significant association.
            <br />• When <span className="font-mono text-rose-300">p ≥ 0.05</span>, the evidence is insufficient to distinguish the pattern from random sampling noise.
          </p>
        </div>

        {/* Q9: Real-world case study: Bank Marketing Duration Leakage */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-amber-500/30 bg-amber-950/15 space-y-3">
          <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Case Study: The Bank Marketing "Duration" Leakage Trap
          </h3>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
            In the UCI Bank Marketing dataset, call <code className="text-amber-200 font-mono">duration</code> has the highest correlation (<span className="font-mono text-amber-300">r ≈ 0.40</span>) with deposit subscription. However, the UCI dataset documentation specifically warns:
          </p>
          <blockquote className="p-3 rounded-xl bg-navy-950/80 border-l-4 border-amber-500 text-xs italic text-slate-300">
            "This input highly affects the output target (e.g., if duration=0 then y='no'). Yet, the duration is not known before a call is performed. Also, after the end of the call y is obviously known. Thus, this input should only be included for benchmark purposes and should be discarded if the intention is to have a realistic predictive model."
          </blockquote>
          <p className="text-xs text-slate-300 leading-relaxed">
            This teaches an essential data science principle: <strong>statistical correlation does not equal practical feasibility</strong>. Always consider the temporal order of data collection!
          </p>
        </div>

        {/* Q10: How does feature selection improve ML? */}
        <div className="rounded-3xl glass-panel p-6 lg:p-7 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              10
            </span>
            How Does Feature Selection Improve Machine Learning?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-1">
              <span className="text-teal-300 font-bold text-xs uppercase tracking-wider block">1. Higher Generalization</span>
              <p className="text-xs text-slate-400">Removing noisy, uninformative features prevents the model from fitting spurious patterns in training data.</p>
            </div>
            <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider block">2. Faster Training & Serving</span>
              <p className="text-xs text-slate-400">Fewer columns translates to smaller memory footprints, faster batch processing, and lower latency real-time API inference.</p>
            </div>
            <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-1">
              <span className="text-purple-300 font-bold text-xs uppercase tracking-wider block">3. Model Interpretability</span>
              <p className="text-xs text-slate-400">Models with 6-8 meaningful features can be audited and understood by domain stakeholders and compliance teams.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
