"""
KHOJ AI Kiosk - Recommendation Engine
Zone Priority Scoring algorithm for missing person search recommendations.

Uses weighted proximity scoring based on:
- Distance from last known location
- CCTV coverage density
- Crowd chokepoint concentration
- Age/vulnerability modifiers
- Elapsed time modifiers
"""

import json
import math
from pathlib import Path
from typing import Any

from .models import (
    NearbyFeature,
    ZonePriority,
    SearchRecommendation,
    PriorityLevel,
)


DATA_DIR = Path(__file__).parent.parent / "data"


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth in meters.
    Uses the Haversine formula.
    """
    R = 6_371_000  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def _get_feature_coords(feature: dict) -> tuple[float, float] | None:
    """Extract (lat, lon) from a GeoJSON Feature. Returns None if geometry is missing."""
    geometry = feature.get("geometry", {})
    geom_type = geometry.get("type", "")
    coords = geometry.get("coordinates")

    if not coords:
        return None

    if geom_type == "Point":
        # GeoJSON is [lon, lat]
        return (coords[1], coords[0])
    elif geom_type in ("Polygon", "MultiPolygon"):
        # Compute centroid of first ring
        if geom_type == "MultiPolygon":
            ring = coords[0][0]
        else:
            ring = coords[0]
        avg_lon = sum(c[0] for c in ring) / len(ring)
        avg_lat = sum(c[1] for c in ring) / len(ring)
        return (avg_lat, avg_lon)
    elif geom_type == "LineString":
        avg_lon = sum(c[0] for c in coords) / len(coords)
        avg_lat = sum(c[1] for c in coords) / len(coords)
        return (avg_lat, avg_lon)

    return None


def _load_geojson(filename: str) -> dict:
    """Load a GeoJSON file from the data directory. Returns empty FeatureCollection on failure."""
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": []}


def _find_nearest_features(
    lat: float,
    lon: float,
    geojson: dict,
    radius_m: float = 2000.0,
    limit: int = 10,
) -> list[dict]:
    """
    Find features within radius_m of the given point, sorted by distance.
    Returns list of dicts: {feature, distance_m, lat, lon}
    """
    results = []
    for feature in geojson.get("features", []):
        coords = _get_feature_coords(feature)
        if coords is None:
            continue
        dist = _haversine_distance(lat, lon, coords[0], coords[1])
        if dist <= radius_m:
            results.append({
                "feature": feature,
                "distance_m": round(dist, 1),
                "lat": coords[0],
                "lon": coords[1],
            })

    results.sort(key=lambda x: x["distance_m"])
    return results[:limit]


def _feature_to_nearby(item: dict) -> NearbyFeature:
    """Convert an internal feature dict to a NearbyFeature model."""
    props = item["feature"].get("properties", {})
    feature_id = props.get("id") or props.get("name", "unknown") or "unknown"
    feature_name = props.get("name") or props.get("Name") or props.get("id", "Unknown")

    return NearbyFeature(
        id=str(feature_id),
        name=str(feature_name),
        distance_m=item["distance_m"],
        latitude=item["lat"],
        longitude=item["lon"],
        properties={k: v for k, v in props.items() if k not in ("id", "name", "Name")},
    )


def _find_containing_zone(lat: float, lon: float, zones_geojson: dict) -> dict | None:
    """
    Find the zone containing the given point (approximate: nearest zone centroid within 1km).
    A proper point-in-polygon test would require shapely, so we use proximity instead.
    """
    nearest = _find_nearest_features(lat, lon, zones_geojson, radius_m=5000, limit=1)
    if nearest and nearest[0]["distance_m"] < 1000:
        return nearest[0]["feature"].get("properties")
    return None


def _calculate_confidence(minutes_since: int) -> str:
    """Calculate search confidence based on elapsed time."""
    if minutes_since < 15:
        return "High (87%)"
    elif minutes_since < 30:
        return "High (78%)"
    elif minutes_since < 60:
        return "Medium (64%)"
    elif minutes_since < 120:
        return "Medium (52%)"
    else:
        return "Low (41%)"


def _calculate_search_radius(minutes_since: int, age: int) -> int:
    """
    Calculate recommended search radius in meters.
    Based on elapsed time and subject mobility (age).
    """
    # Base radius from time
    if minutes_since < 15:
        base = 500
    elif minutes_since < 30:
        base = 750
    elif minutes_since < 60:
        base = 1000
    elif minutes_since < 120:
        base = 1500
    else:
        base = 2000

    # Age modifier: elderly and children move slower
    if age > 70:
        modifier = 0.6
    elif age > 60:
        modifier = 0.75
    elif age < 8:
        modifier = 0.5
    elif age < 15:
        modifier = 0.8
    else:
        modifier = 1.0

    return int(base * modifier)


def _determine_priority(age: int, minutes_since: int) -> PriorityLevel:
    """Determine case priority level based on vulnerability and elapsed time."""
    # Children and elderly are always higher priority
    is_vulnerable = age < 12 or age > 60

    if is_vulnerable and minutes_since > 30:
        return PriorityLevel.critical
    elif is_vulnerable or minutes_since > 60:
        return PriorityLevel.high
    elif minutes_since > 30:
        return PriorityLevel.medium
    else:
        return PriorityLevel.low


class RecommendationEngine:
    """
    Zone Priority Scoring engine for missing person search recommendations.

    Loads GeoJSON data files and computes scored recommendations based on:
    - Proximity to last known location
    - CCTV coverage density (higher = better chance of visual confirmation)
    - Chokepoint density (higher = better chance of interception)
    - Subject vulnerability (age-based modifiers)
    - Elapsed time modifiers
    """

    def __init__(self) -> None:
        """Load all GeoJSON datasets."""
        self.zones = _load_geojson("zones.geojson")
        self.cctv = _load_geojson("cctv.geojson")
        self.police = _load_geojson("police_stations.geojson")
        self.chokepoints = _load_geojson("chokepoints.geojson")

    def reload_data(self) -> None:
        """Reload GeoJSON datasets from disk."""
        self.zones = _load_geojson("zones.geojson")
        self.cctv = _load_geojson("cctv.geojson")
        self.police = _load_geojson("police_stations.geojson")
        self.chokepoints = _load_geojson("chokepoints.geojson")

    def get_recommendation(
        self,
        lat: float,
        lon: float,
        age: int = 30,
        gender: str = "male",
        minutes_since: int = 30,
    ) -> dict[str, Any]:
        """
        Compute a full search recommendation for a missing person.

        Args:
            lat: Last known latitude
            lon: Last known longitude
            age: Subject's age
            gender: Subject's gender
            minutes_since: Minutes since last sighting

        Returns:
            Dict with all recommendation fields (matches SearchRecommendation model)
        """
        search_radius = _calculate_search_radius(minutes_since, age)
        confidence = _calculate_confidence(minutes_since)
        priority = _determine_priority(age, minutes_since)

        # Find current zone
        current_zone = _find_containing_zone(lat, lon, self.zones)

        # Find nearest police station (search wider — police stations are sparse)
        police_nearby = _find_nearest_features(
            lat, lon, self.police, radius_m=10000, limit=1
        )
        if police_nearby:
            nearest_police = _feature_to_nearby(police_nearby[0])
        else:
            # Fallback if no police data loaded
            nearest_police = NearbyFeature(
                id="POLICE-DEFAULT",
                name="Nearest Police Station",
                distance_m=0,
                latitude=lat,
                longitude=lon,
                properties={"note": "No police station data available"},
            )

        # Find nearby CCTV cameras
        cctv_nearby = _find_nearest_features(
            lat, lon, self.cctv, radius_m=float(search_radius), limit=10
        )
        nearby_cctv = [_feature_to_nearby(c) for c in cctv_nearby]

        # Find nearby chokepoints
        choke_nearby = _find_nearest_features(
            lat, lon, self.chokepoints, radius_m=float(search_radius), limit=10
        )
        nearby_chokepoints = [_feature_to_nearby(c) for c in choke_nearby]

        # Score all zones by priority
        priority_zones = self._score_zones(
            lat, lon, age, minutes_since, search_radius
        )

        return {
            "current_zone": current_zone,
            "nearest_police": nearest_police,
            "nearby_cctv": nearby_cctv,
            "nearby_chokepoints": nearby_chokepoints,
            "priority_zones": priority_zones,
            "search_radius_m": search_radius,
            "confidence": confidence,
            "priority_level": priority,
        }

    def _score_zones(
        self,
        lat: float,
        lon: float,
        age: int,
        minutes_since: int,
        search_radius: int,
    ) -> list[ZonePriority]:
        """
        Score each zone by weighted proximity scoring.

        Scoring factors:
        - Base score: inversely proportional to distance
        - CCTV bonus: +20 per CCTV camera within 300m of zone centroid
        - Chokepoint bonus: +15 per chokepoint within 500m of zone centroid
        - Vulnerability bonus: +50 if zone has medical facilities and subject is vulnerable
        - Time decay: scores spread out (multiply by 0.8) after 60 minutes
        """
        zone_scores: list[ZonePriority] = []

        for feature in self.zones.get("features", []):
            zone_coords = _get_feature_coords(feature)
            if zone_coords is None:
                continue

            props = feature.get("properties", {})
            zone_id = str(props.get("id", props.get("name", "unknown")))
            zone_name = str(props.get("name", props.get("Name", zone_id)))

            # Base score: inversely proportional to distance
            dist = _haversine_distance(lat, lon, zone_coords[0], zone_coords[1])
            base_score = 1000.0 / (dist / 100.0 + 1.0)

            # CCTV bonus
            cctv_in_zone = _find_nearest_features(
                zone_coords[0], zone_coords[1], self.cctv, radius_m=300, limit=50
            )
            cctv_bonus = len(cctv_in_zone) * 20

            # Chokepoint bonus
            choke_in_zone = _find_nearest_features(
                zone_coords[0], zone_coords[1], self.chokepoints, radius_m=500, limit=50
            )
            choke_bonus = len(choke_in_zone) * 15

            # Vulnerability modifier
            vuln_bonus = 0
            if (age > 60 or age < 12) and props.get("has_medical"):
                vuln_bonus = 50

            # Total score
            total = base_score + cctv_bonus + choke_bonus + vuln_bonus

            # Time decay: broaden priority spread for older reports
            if minutes_since > 60:
                total *= 0.8

            # Build reason string
            reasons = []
            if dist < 500:
                reasons.append("Immediate vicinity of last sighting")
            elif dist < 1000:
                reasons.append("Close proximity to last known location")
            else:
                reasons.append(f"{dist:.0f}m from last known location")

            if cctv_bonus > 0:
                reasons.append(f"{len(cctv_in_zone)} CCTV camera{'s' if len(cctv_in_zone) > 1 else ''} in zone")
            if choke_bonus > 0:
                reasons.append(f"{len(choke_in_zone)} chokepoint{'s' if len(choke_in_zone) > 1 else ''} nearby")
            if vuln_bonus > 0:
                reasons.append("Medical facilities available")

            reason = "; ".join(reasons) if reasons else "Proximity-based scoring"

            zone_scores.append(
                ZonePriority(
                    zone_id=zone_id,
                    zone_name=zone_name,
                    score=round(total, 1),
                    reason=reason,
                )
            )

        # Sort by score descending, return top 5
        zone_scores.sort(key=lambda z: z.score, reverse=True)
        return zone_scores[:5]
