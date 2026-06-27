"""
KHOJ AI Kiosk - AI Summary Generator
Deterministic template-based natural language generation.
No LLM dependency — produces professional, structured search recommendations.
"""


def _urgency_label(minutes_since: int) -> str:
    """Return an urgency label based on elapsed time."""
    if minutes_since <= 15:
        return "IMMEDIATE"
    elif minutes_since <= 30:
        return "URGENT"
    elif minutes_since <= 60:
        return "HIGH"
    elif minutes_since <= 120:
        return "ELEVATED"
    else:
        return "STANDARD"


def _age_profile(age: int) -> str:
    """Return a descriptive age profile string."""
    if age < 5:
        return "toddler"
    elif age < 12:
        return "child"
    elif age < 18:
        return "adolescent"
    elif age < 60:
        return "adult"
    elif age < 75:
        return "senior citizen"
    else:
        return "elderly individual"


def _time_description(minutes_since: int) -> str:
    """Convert minutes to a human-readable time duration."""
    if minutes_since < 60:
        return f"approximately {minutes_since} minutes ago"
    hours = minutes_since // 60
    remaining = minutes_since % 60
    if remaining == 0:
        return f"approximately {hours} hour{'s' if hours > 1 else ''} ago"
    return f"approximately {hours} hour{'s' if hours > 1 else ''} and {remaining} minutes ago"


def _special_notes(age: int, gender: str, minutes_since: int) -> list[str]:
    """Generate context-specific advisory notes."""
    notes = []

    if age > 60:
        notes.append(
            "For elderly subjects, prioritize medical aid points and rest areas. "
            "Coordinate with medical volunteers stationed along the ghats."
        )
    if age < 12:
        notes.append(
            "For child subjects, immediately activate the Child Safety Protocol. "
            "Alert all volunteer checkpoints and Lost & Found centers."
        )
    if age > 60 or age < 12:
        notes.append(
            "Subject falls in a vulnerable demographic — escalate to zone commander if not located within 30 minutes."
        )

    if minutes_since > 120:
        notes.append(
            "Extended elapsed time detected. Consider expanding search radius and "
            "coordinating with adjacent zone patrol teams."
        )
    elif minutes_since > 60:
        notes.append(
            "Elapsed time exceeds 1 hour. Recommend broadening search perimeter "
            "and reviewing CCTV footage from neighboring zones."
        )

    if gender == "female":
        notes.append(
            "Deploy female volunteer escorts for sensitive outreach. "
            "Check women's rest areas and family waiting zones."
        )

    return notes


def generate_ai_summary(
    person_name: str,
    age: int,
    gender: str,
    clothing: str,
    zone_name: str | None,
    nearest_police: str,
    police_distance_m: float,
    nearby_cctv_count: int,
    nearby_chokepoint_count: int,
    priority_zones: list[dict],
    search_radius_m: int,
    confidence: str,
    minutes_since: int,
) -> str:
    """
    Generate a professional, natural-language search recommendation summary.
    Fully deterministic — no LLM dependency. Reads like AI-generated analysis.

    Args:
        person_name: Full name of missing person
        age: Age in years
        gender: Gender string (male/female/other)
        clothing: Clothing description
        zone_name: Name of the zone where person was last seen (or None)
        nearest_police: Name of nearest police station
        police_distance_m: Distance to nearest police station in meters
        nearby_cctv_count: Number of CCTV cameras in search radius
        nearby_chokepoint_count: Number of crowd chokepoints in search radius
        priority_zones: List of dicts with zone_name, score, reason
        search_radius_m: Recommended search radius in meters
        confidence: Confidence level string (e.g., "High (87%)")
        minutes_since: Minutes since person was last seen

    Returns:
        A multi-paragraph professional search recommendation string.
    """

    urgency = _urgency_label(minutes_since)
    profile = _age_profile(age)
    time_desc = _time_description(minutes_since)
    zone_display = zone_name if zone_name else "an unidentified zone"
    police_dist_display = f"{police_distance_m:.0f}m"

    # --- Section 1: Situation Analysis ---
    section_analysis = (
        f"Based on the report analysis, {person_name} ({gender}, {age} years old, "
        f"{profile}, wearing {clothing}) was last seen {time_desc} "
        f"in the {zone_display}. Given the elapsed time and the subject's "
        f"age profile, this case has been classified as {urgency} PRIORITY."
    )

    # --- Section 2: Immediate Actions ---
    actions = []
    actions.append(
        f"1. Alert {nearest_police} ({police_dist_display} from last known location)"
    )

    if nearby_cctv_count > 0:
        actions.append(
            f"2. Review feeds from {nearby_cctv_count} CCTV camera{'s' if nearby_cctv_count > 1 else ''} "
            f"within the {search_radius_m}m search radius"
        )
    else:
        actions.append(
            f"2. No CCTV cameras within {search_radius_m}m — deploy visual patrol teams immediately"
        )

    if nearby_chokepoint_count > 0:
        actions.append(
            f"3. Deploy search teams to {nearby_chokepoint_count} nearby crowd chokepoint{'s' if nearby_chokepoint_count > 1 else ''}"
        )
    else:
        actions.append(
            "3. No major chokepoints nearby — focus on main pedestrian corridors and entry/exit points"
        )

    actions.append(
        "4. Broadcast descriptive alert to all zone volunteer coordinators via radio"
    )

    section_actions = "IMMEDIATE ACTIONS RECOMMENDED:\n" + "\n".join(actions)

    # --- Section 3: Priority Search Zones ---
    zone_lines = []
    for idx, zone in enumerate(priority_zones[:5], start=1):
        z_name = zone.get("zone_name", f"Zone {idx}")
        z_score = zone.get("score", 0)
        z_reason = zone.get("reason", "Proximity-based scoring")
        zone_lines.append(
            f"  {idx}. {z_name} (Score: {z_score:.0f}) — {z_reason}"
        )

    if zone_lines:
        section_zones = (
            "PRIORITY SEARCH ZONES (ranked by probability):\n" + "\n".join(zone_lines)
        )
    else:
        section_zones = (
            "PRIORITY SEARCH ZONES:\n"
            "  Insufficient zone data available. Recommend manual assessment by zone commander."
        )

    # --- Section 4: Confidence & Radius ---
    section_confidence = (
        f"Search confidence: {confidence} | "
        f"Recommended search radius: {search_radius_m}m"
    )

    # --- Section 5: Special Notes ---
    notes = _special_notes(age, gender, minutes_since)
    if notes:
        section_notes = "ADVISORY NOTES:\n" + "\n".join(
            f"• {note}" for note in notes
        )
    else:
        section_notes = ""

    # --- Section 6: Resource Summary ---
    section_resources = (
        f"RESOURCE SUMMARY:\n"
        f"• Nearest police station: {nearest_police} ({police_dist_display})\n"
        f"• CCTV cameras in range: {nearby_cctv_count}\n"
        f"• Crowd chokepoints monitored: {nearby_chokepoint_count}\n"
        f"• Active search radius: {search_radius_m}m"
    )

    # --- Assemble Final Summary ---
    parts = [
        section_analysis,
        "",
        section_actions,
        "",
        section_zones,
        "",
        section_confidence,
        "",
        section_resources,
    ]

    if section_notes:
        parts.append("")
        parts.append(section_notes)

    return "\n".join(parts)
