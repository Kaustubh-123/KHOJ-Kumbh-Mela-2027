"""
KHOJ AI Kiosk - Pydantic v2 Models
All request/response models for the KHOJ API.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class PriorityLevel(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class CaseStatus(str, Enum):
    active = "active"
    found = "found"
    closed = "closed"


class PersonDetails(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    age: int = Field(..., ge=0, le=120)
    gender: Gender
    height: str | None = None
    clothing_description: str = Field(..., min_length=5, max_length=500)
    distinguishing_features: str | None = None


class LastSeenInfo(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    landmark: str | None = None
    time: str  # HH:MM format
    minutes_since: int = Field(..., ge=0)


class ContactInfo(BaseModel):
    name: str
    phone: str = Field(..., pattern=r'^\+?[0-9\-\s]{7,15}$')
    relation: str


class MissingPersonReport(BaseModel):
    person: PersonDetails
    last_seen: LastSeenInfo
    contact: ContactInfo


class NearbyFeature(BaseModel):
    id: str
    name: str
    distance_m: float
    latitude: float
    longitude: float
    properties: dict = {}


class ZonePriority(BaseModel):
    zone_id: str
    zone_name: str
    score: float
    reason: str


class SearchRecommendation(BaseModel):
    current_zone: dict | None
    nearest_police: NearbyFeature
    nearby_cctv: list[NearbyFeature]
    nearby_chokepoints: list[NearbyFeature]
    priority_zones: list[ZonePriority]
    search_radius_m: int
    confidence: str
    priority_level: PriorityLevel
    ai_summary: str


class CaseResponse(BaseModel):
    case_id: str
    created_at: datetime
    report: MissingPersonReport
    recommendation: SearchRecommendation
    qr_code_base64: str
    status: CaseStatus = CaseStatus.active


class CaseStatusUpdate(BaseModel):
    status: CaseStatus


class StatsResponse(BaseModel):
    total_cases: int
    active_cases: int
    found_cases: int
    closed_cases: int
    cases_by_zone: dict[str, int]
    avg_response_time_min: float
    cctv_count: int = 0
    chokepoint_count: int = 0
    police_count: int = 0
