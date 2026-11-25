"""
Test suite for FeatureLab backend calculations and endpoints.
"""

import os
import sys
import unittest

# Add project root and backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app, state


class TestFeatureLabBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_and_default_load(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["dataset_loaded"])
        self.assertGreater(data["rows"], 0)
        self.assertEqual(data["target_column"], "y")

    def test_02_dataset_summary(self):
        res = self.client.get("/api/dataset/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["loaded"])
        self.assertIn("age", data["numeric_features"])
        self.assertIn("job", data["categorical_features"])
        self.assertEqual(data["target_column"], "y")

    def test_03_dataset_preview(self):
        res = self.client.get("/api/dataset/preview?page=1&page_size=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["page"], 1)
        self.assertEqual(len(data["data"]), 10)
        self.assertIn("numeric", data["stats"])
        self.assertIn("categorical", data["stats"])
        self.assertIn("mean", data["stats"]["numeric"]["age"])

    def test_04_pearson_correlation(self):
        res = self.client.post("/api/analysis/correlation", json={"threshold": 0.05})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        self.assertIn("matrix", data)
        self.assertIn("redundant_pairs", data)
        
        # Verify duration is present and flagged as leakage
        results = {r["feature"]: r for r in data["results"]}
        self.assertIn("duration", results)
        self.assertTrue(results["duration"]["is_leakage"])
        self.assertGreaterEqual(abs(results["duration"]["correlation"]), 0.3)

    def test_05_scatter_endpoint(self):
        res = self.client.get("/api/analysis/scatter?feature=age")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("points", data)
        self.assertIn("trend_line", data)
        self.assertIn("r_value", data)
        self.assertIn("slope", data)

    def test_06_chisquare_analysis(self):
        res = self.client.post("/api/analysis/chisquare", json={"alpha": 0.05})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        self.assertIn("contingency_tables", data)
        
        cat_features = [r["feature"] for r in data["results"]]
        self.assertIn("job", cat_features)
        self.assertIn("poutcome", cat_features)
        
        # Check contingency table structure for 'job'
        job_table = data["contingency_tables"]["job"]
        self.assertIn("observed", job_table)
        self.assertIn("expected", job_table)
        self.assertIn("residuals", job_table)

    def test_07_feature_selection_evaluation(self):
        res = self.client.post("/api/feature-selection/evaluate", json={
            "corr_threshold": 0.05,
            "chi_alpha": 0.05
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_evaluated"], 0)
        self.assertGreater(data["selected_count"], 0)
        self.assertIn("features_table", data)
        
        # Test manual override
        override_res = self.client.post("/api/feature-selection/evaluate", json={
            "corr_threshold": 0.05,
            "chi_alpha": 0.05,
            "user_overrides": {"duration": "DROP"}
        })
        override_data = override_res.json()
        duration_row = next(f for f in override_data["features_table"] if f["feature"] == "duration")
        self.assertEqual(duration_row["final_decision"], "DROP")

    def test_08_model_comparison(self):
        res = self.client.post("/api/models/compare", json={
            "test_size": 0.20,
            "random_state": 42
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("model_all_features", data)
        self.assertIn("model_selected_features", data)
        self.assertIn("comparison", data)
        self.assertIn("accuracy", data["model_all_features"])
        self.assertIn("f1_score", data["model_selected_features"])

    def test_09_exports(self):
        res = self.client.post("/api/export/report", json={"corr_threshold": 0.05, "chi_alpha": 0.05})
        self.assertEqual(res.status_code, 200)
        self.assertIn("report_markdown", res.json())

        csv_res = self.client.post("/api/export/selected-csv", json={"corr_threshold": 0.05, "chi_alpha": 0.05})
        self.assertEqual(csv_res.status_code, 200)
        self.assertTrue(csv_res.headers["content-type"].startswith("text/csv"))


if __name__ == "__main__":
    unittest.main()
