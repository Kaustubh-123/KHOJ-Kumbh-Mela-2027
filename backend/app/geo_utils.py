"""
Geospatial utility functions for KHOJ AI Kiosk.

Provides haversine distance calculation, nearest-point search,
radius-based search, point-in-polygon tests, zone lookup, and
polygon centroid computation.
"""

import math
from typing import Any


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance in **meters** between two points
    given as (latitude, longitude) in decimal degrees.

    Uses the standard haversine formula with Earth radius = 6_371_000 m.
    """
    R = 6_371_000  # Earth radius in meters

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


def find_nearest_points(
    lat: float,
    lon: float,
    geojson_features: list[dict],
    n: int = 5,
) -> list[dict]:
    """Return the *n* nearest GeoJSON **Point** features to *(lat, lon)*.

    Each returned dict contains all original feature ``properties`` plus an
    added ``distance_m`` key with the distance in meters.  Results are sorted
    nearest-first.

    Non-Point geometries in *geojson_features* are silently skipped.
    """
    scored: list[tuple[float, dict]] = []

    for feature in geojson_features:
        geom = feature.get("geometry", {})
        if geom.get("type") != "Point":
            continue
        coords = geom["coordinates"]  # [lon, lat]
        feat_lon, feat_lat = coords[0], coords[1]
        dist = haversine_distance(lat, lon, feat_lat, feat_lon)
        scored.append((dist, feature))

    scored.sort(key=lambda x: x[0])

    results: list[dict] = []
    for dist, feature in scored[:n]:
        entry = dict(feature["properties"])
        entry["distance_m"] = round(dist, 2)
        results.append(entry)

    return results


def find_points_in_radius(
    lat: float,
    lon: float,
    geojson_features: list[dict],
    radius_m: float,
) -> list[dict]:
    """Return all GeoJSON **Point** features within *radius_m* metres of
    *(lat, lon)*.

    Each returned dict contains all original feature ``properties`` plus
    ``distance_m``.  Results are sorted nearest-first.
    """
    results: list[dict] = []

    for feature in geojson_features:
        geom = feature.get("geometry", {})
        if geom.get("type") != "Point":
            continue
        coords = geom["coordinates"]
        feat_lon, feat_lat = coords[0], coords[1]
        dist = haversine_distance(lat, lon, feat_lat, feat_lon)
        if dist <= radius_m:
            entry = dict(feature["properties"])
            entry["distance_m"] = round(dist, 2)
            results.append(entry)

    results.sort(key=lambda x: x["distance_m"])
    return results


def point_in_polygon(lat: float, lon: float, polygon_coords: list) -> bool:
    """Ray-casting algorithm to test whether the point *(lat, lon)* lies
    inside *polygon_coords*.

    *polygon_coords* is expected in GeoJSON polygon format, i.e. a list
    of rings where each ring is a list of ``[lon, lat]`` pairs.  Only the
    outer ring (index 0) is considered.
    """
    ring = polygon_coords[0]  # outer ring
    n = len(ring)
    inside = False

    # Use lon as x, lat as y to stay consistent with GeoJSON ordering.
    px, py = lon, lat

    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]

        # Check if the ray from (px, py) going in +x direction crosses
        # the edge (xi, yi)-(xj, yj).
        if ((yi > py) != (yj > py)) and (
            px < (xj - xi) * (py - yi) / (yj - yi) + xi
        ):
            inside = not inside

        j = i

    return inside


def find_zone(
    lat: float, lon: float, zones_features: list[dict]
) -> dict | None:
    """Return the ``properties`` dict of the zone that contains *(lat, lon)*,
    or ``None`` if the point is not inside any zone.
    """
    for feature in zones_features:
        geom = feature.get("geometry", {})
        if geom.get("type") != "Polygon":
            continue
        if point_in_polygon(lat, lon, geom["coordinates"]):
            return dict(feature["properties"])
    return None


def get_centroid(polygon_coords: list) -> tuple[float, float]:
    """Compute the centroid of a polygon and return *(lat, lon)*.

    *polygon_coords* follows GeoJSON format (list of rings of
    ``[lon, lat]`` pairs).  Uses the signed-area centroid formula for
    simple polygons.  Only the outer ring is considered.
    """
    ring = polygon_coords[0]
    n = len(ring)

    # If the ring is closed (first == last), drop the duplicate.
    if n > 1 and ring[0][0] == ring[-1][0] and ring[0][1] == ring[-1][1]:
        ring = ring[:-1]
        n = len(ring)

    if n == 0:
        return (0.0, 0.0)

    signed_area = 0.0
    cx = 0.0
    cy = 0.0

    for i in range(n):
        x0, y0 = ring[i][0], ring[i][1]       # lon, lat
        x1, y1 = ring[(i + 1) % n][0], ring[(i + 1) % n][1]
        cross = x0 * y1 - x1 * y0
        signed_area += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross

    signed_area *= 0.5

    if abs(signed_area) < 1e-12:
        # Degenerate polygon – fall back to simple average.
        avg_lon = sum(p[0] for p in ring) / n
        avg_lat = sum(p[1] for p in ring) / n
        return (avg_lat, avg_lon)

    factor = 1.0 / (6.0 * signed_area)
    cx *= factor  # centroid longitude
    cy *= factor  # centroid latitude

    return (cy, cx)  # (lat, lon)
