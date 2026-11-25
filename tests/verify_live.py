import urllib.request
import json

def post(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print("1. Testing /api/health...")
h = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/api/health").read().decode())
print(f"   Loaded dataset: {h['dataset_name']}, rows: {h['rows']}")

print("2. Testing /api/analysis/correlation...")
corr = post("http://127.0.0.1:8000/api/analysis/correlation", {"threshold": 0.05})
print(f"   Evaluated {len(corr['results'])} numerical features. Top: {corr['results'][0]['feature']} (r = {corr['results'][0]['correlation']})")

print("3. Testing /api/analysis/chisquare...")
chi = post("http://127.0.0.1:8000/api/analysis/chisquare", {"alpha": 0.05})
print(f"   Evaluated {len(chi['results'])} categorical features. Top: {chi['results'][0]['feature']} (chi2 = {chi['results'][0]['chi2_score']})")

print("4. Testing /api/feature-selection/evaluate...")
sel = post("http://127.0.0.1:8000/api/feature-selection/evaluate", {"corr_threshold": 0.05, "chi_alpha": 0.05, "user_overrides": {"duration": "DROP"}})
print(f"   Total evaluated: {sel['total_evaluated']}, Kept: {sel['selected_count']}, Dropped: {sel['rejected_count']}")

print("5. Testing /api/models/compare...")
mc = post("http://127.0.0.1:8000/api/models/compare", {"test_size": 0.20, "random_state": 42})
print(f"   Model All Features Acc: {mc['model_all_features']['accuracy']}, F1: {mc['model_all_features']['f1_score']}")
print(f"   Model Selected Features Acc: {mc['model_selected_features']['accuracy']}, F1: {mc['model_selected_features']['f1_score']}")
print(f"   Features reduced: {mc['comparison']['features_reduced']} ({mc['comparison']['percent_features_reduced']}%)")

print("All API endpoints verified successfully!")
