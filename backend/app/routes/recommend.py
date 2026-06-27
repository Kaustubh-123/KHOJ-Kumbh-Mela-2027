"""
KHOJ AI Kiosk - Standalone Recommendation Endpoint
Direct access to the recommendation engine without creating a case.
"""

from fastapi import APIRouter, Query
from ..models import SearchRecommendation
from ..recommendation import RecommendationEngine
from ..ai_summary import generate_ai_summary

router = APIRouter(prefix="/api/recommend", tags=["recommendation"])

# Shared recommendation engine instance
engine = RecommendationEngine()


@router.get("/", response_model=SearchRecommendation)
async def get_recommendation(
    lat: float = Query(..., ge=-90, le=90, description="Latitude of last seen location"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude of last seen location"),
    age: int = Query(30, ge=0, le=120, description="Age of the missing person"),
    gender: str = Query("male", description="Gender: male, female, or other"),
    minutes_since: int = Query(30, ge=0, description="Minutes since the person was last seen"),
) -> SearchRecommendation:
    """
    Get a search recommendation without creating a full case.

    Useful for:
    - Quick lookups by volunteers in the field
    - Testing the recommendation engine
    - Pre-screening before formal report submission
    """
    # Run recommendation engine
    rec_data = engine.get_recommendation(
        lat=lat,
        lon=lon,
        age=age,
        gender=gender,
        minutes_since=minutes_since,
    )

    # Extract zone name
    zone_name = None
    if rec_data["current_zone"]:
        zone_name = rec_data["current_zone"].get("name") or rec_data["current_zone"].get("Name")

    # Build priority zone dicts for summary
    priority_zone_dicts = [
        {
            "zone_name": z.zone_name,
            "score": z.score,
            "reason": z.reason,
        }
        for z in rec_data["priority_zones"]
    ]

    # Generate AI summary
    ai_summary = generate_ai_summary(
        person_name="Unknown Subject",
        age=age,
        gender=gender,
        clothing="not specified",
        zone_name=zone_name,
        nearest_police=rec_data["nearest_police"].name,
        police_distance_m=rec_data["nearest_police"].distance_m,
        nearby_cctv_count=len(rec_data["nearby_cctv"]),
        nearby_chokepoint_count=len(rec_data["nearby_chokepoints"]),
        priority_zones=priority_zone_dicts,
        search_radius_m=rec_data["search_radius_m"],
        confidence=rec_data["confidence"],
        minutes_since=minutes_since,
    )

    return SearchRecommendation(
        current_zone=rec_data["current_zone"],
        nearest_police=rec_data["nearest_police"],
        nearby_cctv=rec_data["nearby_cctv"],
        nearby_chokepoints=rec_data["nearby_chokepoints"],
        priority_zones=rec_data["priority_zones"],
        search_radius_m=rec_data["search_radius_m"],
        confidence=rec_data["confidence"],
        priority_level=rec_data["priority_level"],
        ai_summary=ai_summary,
    )
