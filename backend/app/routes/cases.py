"""
KHOJ AI Kiosk - Case Management Routes
CRUD operations for missing person cases.
"""

from fastapi import APIRouter, HTTPException
from ..models import (
    MissingPersonReport,
    CaseResponse,
    CaseStatusUpdate,
    CaseStatus,
    SearchRecommendation,
)
from ..recommendation import RecommendationEngine
from ..ai_summary import generate_ai_summary
from ..qr_generator import generate_case_id, generate_qr_code
from .. import db
from datetime import datetime, timezone

router = APIRouter(prefix="/api/cases", tags=["cases"])

engine = RecommendationEngine()


@router.post("/", response_model=CaseResponse)
async def create_case(report: MissingPersonReport) -> CaseResponse:
    """
    Create a new missing person case.

    Performs the full pipeline:
    1. Generate unique case ID
    2. Run the recommendation engine on last-seen location
    3. Generate deterministic AI summary
    4. Generate QR code for case tracking
    5. Assemble and store the CaseResponse
    """
    # 1. Generate unique case ID
    case_id = generate_case_id()

    # 2. Run recommendation engine
    rec_data = engine.get_recommendation(
        lat=report.last_seen.latitude,
        lon=report.last_seen.longitude,
        age=report.person.age,
        gender=report.person.gender.value,
        minutes_since=report.last_seen.minutes_since,
    )

    # 3. Generate AI summary
    # Extract zone name from current_zone if available
    zone_name = None
    if rec_data["current_zone"]:
        zone_name = rec_data["current_zone"].get("name") or rec_data["current_zone"].get("Name")

    # Extract priority zone data for summary
    priority_zone_dicts = [
        {
            "zone_name": z.zone_name,
            "score": z.score,
            "reason": z.reason,
        }
        for z in rec_data["priority_zones"]
    ]

    ai_summary = generate_ai_summary(
        person_name=report.person.name,
        age=report.person.age,
        gender=report.person.gender.value,
        clothing=report.person.clothing_description,
        zone_name=zone_name,
        nearest_police=rec_data["nearest_police"].name,
        police_distance_m=rec_data["nearest_police"].distance_m,
        nearby_cctv_count=len(rec_data["nearby_cctv"]),
        nearby_chokepoint_count=len(rec_data["nearby_chokepoints"]),
        priority_zones=priority_zone_dicts,
        search_radius_m=rec_data["search_radius_m"],
        confidence=rec_data["confidence"],
        minutes_since=report.last_seen.minutes_since,
    )

    # Build SearchRecommendation model
    recommendation = SearchRecommendation(
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

    # 4. Generate QR code
    case_url = f"https://khoj.app/case/{case_id}"
    qr_base64 = generate_qr_code(case_id, case_url)

    # 5. Create and store CaseResponse
    case_response = CaseResponse(
        case_id=case_id,
        created_at=datetime.now(timezone.utc),
        report=report,
        recommendation=recommendation,
        qr_code_base64=qr_base64,
        status=CaseStatus.active,
    )

    db.save(case_response)
    return case_response


@router.get("/", response_model=list[CaseResponse])
async def list_cases(status: CaseStatus | None = None) -> list[CaseResponse]:
    return db.list_all(status.value if status else None)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str) -> CaseResponse:
    case = db.get(case_id)
    if not case:
        raise HTTPException(
            status_code=404,
            detail=f"Case '{case_id}' not found.",
        )
    return case


@router.patch("/{case_id}/status", response_model=CaseResponse)
async def update_case_status(case_id: str, update: CaseStatusUpdate) -> CaseResponse:
    case = db.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    current = case.status
    new = update.status

    if current == new:
        raise HTTPException(status_code=400, detail=f"Case is already '{current.value}'.")
    if current == CaseStatus.closed and new != CaseStatus.closed:
        raise HTTPException(status_code=400, detail="Cannot reopen a closed case.")

    updated = db.update_status(case_id, new.value)
    return updated
