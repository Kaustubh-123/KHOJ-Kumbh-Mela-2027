"""
KHOJ AI Kiosk - Dashboard Statistics Endpoint
Computes aggregate stats from the SQLite case store + live GeoJSON infrastructure counts.
"""

import json
from pathlib import Path
from fastapi import APIRouter
from ..models import StatsResponse, CaseStatus
from .. import db

router = APIRouter(prefix="/api/stats", tags=["stats"])

DATA_DIR = Path(__file__).parent.parent.parent / "data"

# Cache infrastructure counts (files never change at runtime)
_infra: dict[str, int] = {}


def _infra_counts() -> dict[str, int]:
    global _infra
    if _infra:
        return _infra
    for key, fname in [
        ("cctv",        "cctv.geojson"),
        ("chokepoints", "chokepoints.geojson"),
        ("police",      "police_stations.geojson"),
    ]:
        try:
            with open(DATA_DIR / fname, encoding="utf-8") as f:
                data = json.load(f)
            _infra[key] = len(data.get("features", []))
        except Exception:
            _infra[key] = 0
    return _infra


@router.get("/", response_model=StatsResponse)
async def get_stats() -> StatsResponse:
    """
    Get aggregated dashboard statistics.

    Returns live case counts from SQLite + real infrastructure counts from GeoJSON.
    """
    all_cases = db.list_all()
    total = len(all_cases)
    active = 0
    found = 0
    closed = 0
    cases_by_zone: dict[str, int] = {}
    response_times: list[float] = []

    for case in all_cases:
        if case.status == CaseStatus.active:
            active += 1
        elif case.status == CaseStatus.found:
            found += 1
        elif case.status == CaseStatus.closed:
            closed += 1

        zone_name = "Unknown"
        if case.recommendation.current_zone:
            zone_name = (
                case.recommendation.current_zone.get("name")
                or case.recommendation.current_zone.get("Name")
                or "Unknown"
            )
        cases_by_zone[zone_name] = cases_by_zone.get(zone_name, 0) + 1

        if case.status in (CaseStatus.found, CaseStatus.closed):
            response_times.append(float(case.report.last_seen.minutes_since))

    avg_response_time = round(sum(response_times) / len(response_times), 1) if response_times else 0.0
    infra = _infra_counts()

    return StatsResponse(
        total_cases=total,
        active_cases=active,
        found_cases=found,
        closed_cases=closed,
        cases_by_zone=cases_by_zone,
        avg_response_time_min=avg_response_time,
        cctv_count=infra.get("cctv", 0),
        chokepoint_count=infra.get("chokepoints", 0),
        police_count=infra.get("police", 0),
    )
