"""Quick validation of all backend data files and modules."""
import json
import sys
sys.path.insert(0, ".")

from app.geo_utils import (
    haversine_distance, find_nearest_points, find_points_in_radius,
    point_in_polygon, find_zone, get_centroid,
)

# Load all data files
cctv = json.load(open("data/cctv.geojson"))
ps = json.load(open("data/police_stations.geojson"))
cp = json.load(open("data/chokepoints.geojson"))
zones = json.load(open("data/zones.geojson"))

print(f"CCTV features:        {len(cctv['features'])}")
print(f"Police stations:      {len(ps['features'])}")
print(f"Chokepoints:          {len(cp['features'])}")
print(f"Zones:                {len(zones['features'])}")

# Test haversine
d = haversine_distance(19.9975, 73.7898, 20.0050, 73.7750)
print(f"\nRamkund -> Tapovan:   {d:.0f}m")

# Test nearest points
near = find_nearest_points(19.9975, 73.7898, cctv["features"], 3)
print(f"Nearest 3 CCTV:       {[n['id'] for n in near]}")

# Test radius search
within = find_points_in_radius(19.9975, 73.7898, ps["features"], 500)
print(f"Police within 500m:   {[p['id'] for p in within]}")

# Test zone lookup
z = find_zone(19.9975, 73.7898, zones["features"])
print(f"Ramkund zone:         {z['name'] if z else 'None'}")

# Test centroid
c = get_centroid(zones["features"][0]["geometry"]["coordinates"])
print(f"Zone A centroid:      lat={c[0]:.4f}, lon={c[1]:.4f}")

# Test recommendation engine
from app.recommendation import RecommendationEngine
engine = RecommendationEngine()
rec = engine.get_recommendation(19.9975, 73.7898, age=8, gender="male", minutes_since=45)
print(f"\n--- Recommendation (8yo child, 45 min) ---")
print(f"Priority:             {rec['priority_level']}")
print(f"Confidence:           {rec['confidence']}")
print(f"Search radius:        {rec['search_radius_m']}m")
print(f"Current zone:         {rec['current_zone']}")
print(f"Nearest police:       {rec['nearest_police'].name} ({rec['nearest_police'].distance_m:.0f}m)")
print(f"Nearby CCTV:          {len(rec['nearby_cctv'])} cameras")
print(f"Nearby chokepoints:   {len(rec['nearby_chokepoints'])} points")
print(f"Priority zones:       {[(z.zone_name, z.score) for z in rec['priority_zones']]}")
print("\n✅ All tests passed!")
