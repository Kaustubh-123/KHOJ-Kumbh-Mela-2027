"""
KHOJ AI Kiosk - Fuzzy Search Route

Exposes Kho-Ya-Paya's rapidfuzz matching engine as an API endpoint so the
admin dashboard (and any other client) can search live KHOJ cases by name,
phone, age or description — far beyond a simple exact-match filter.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from rapidfuzz import fuzz

from .. import db

router = APIRouter(prefix="/api/search", tags=["search"])


class FuzzyQuery(BaseModel):
    name: str = ""
    phone: str = ""
    gender: str = ""
    age_band: str = ""
    description: str = ""


class FuzzyResult(BaseModel):
    case_id: str
    name: str
    gender: str
    age: int
    last_seen: str
    status: str
    score: float


def _norm_phone(p: str) -> str:
    digits = "".join(c for c in p if c.isdigit())
    return digits[2:] if digits.startswith("91") and len(digits) > 10 else digits


def _age_band(age: int) -> str:
    if age <= 12:  return "0-12"
    if age <= 17:  return "13-17"
    if age <= 40:  return "18-40"
    if age <= 60:  return "41-60"
    if age <= 70:  return "61-70"
    if age <= 80:  return "71-80"
    return "80+"


def _score(q: FuzzyQuery, c) -> float:
    weights = {"name": 0.50, "phone": 0.25, "age": 0.10, "gender": 0.08, "desc": 0.07}
    s = {}

    # Name similarity
    q_name = q.name.strip().lower()
    c_name = (c.report.person.name or "").strip().lower()
    s["name"] = fuzz.token_set_ratio(q_name, c_name) / 100 if q_name and c_name else 0.5

    # Phone exact / partial
    q_ph = _norm_phone(q.phone)
    c_ph = _norm_phone(c.report.contact.phone)
    if q_ph and c_ph:
        s["phone"] = 1.0 if q_ph == c_ph else (0.6 if q_ph[-6:] == c_ph[-6:] else 0.0)
    else:
        s["phone"] = 0.5

    # Age band
    c_band = _age_band(c.report.person.age)
    s["age"] = 1.0 if (q.age_band and q.age_band == c_band) else (0.5 if not q.age_band else 0.0)

    # Gender
    q_g = q.gender.strip().lower()
    c_g = c.report.person.gender.value.lower()
    s["gender"] = 1.0 if not q_g or q_g == c_g else 0.0

    # Description
    q_desc = q.description.strip().lower()
    c_desc = (c.report.person.clothing_description or "").strip().lower()
    s["desc"] = fuzz.token_set_ratio(q_desc, c_desc) / 100 if q_desc and c_desc else 0.5

    # If no fields given at all, return 0
    has_any = bool(q.name or q.phone or q.gender or q.age_band or q.description)
    if not has_any:
        return 0.0

    # Redistribute weights away from blank fields
    active = {
        "name": q.name,
        "phone": q.phone,
        "age": q.age_band,
        "gender": q.gender,
        "desc": q.description,
    }
    total_w = sum(weights[k] for k, v in active.items() if v)
    if total_w == 0:
        return 0.0
    score = sum(
        weights[k] * s[k] / total_w
        for k, v in active.items()
        if v
    )
    return round(score, 4)


@router.post("/fuzzy", response_model=list[FuzzyResult])
async def fuzzy_search(query: FuzzyQuery, top_k: int = 5) -> list[FuzzyResult]:
    """
    Search live KHOJ cases using fuzzy name + phone + description matching.

    Scores every case against the query, returns top_k results above 0.40.
    Empty fields are ignored (weight redistributed to provided fields).
    """
    scored = []
    for case in db.list_all():
        sc = _score(query, case)
        if sc >= 0.40:
            scored.append(FuzzyResult(
                case_id=case.case_id,
                name=case.report.person.name,
                gender=case.report.person.gender.value,
                age=case.report.person.age,
                last_seen=case.report.last_seen.landmark or "",
                status=case.status.value,
                score=sc,
            ))

    scored.sort(key=lambda r: r.score, reverse=True)
    return scored[:top_k]
