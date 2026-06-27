"""
KHOJ AI Kiosk - GeoJSON Data Endpoints
Serves static GeoJSON data for the frontend map layers.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
from pathlib import Path

router = APIRouter(prefix="/api/geodata", tags=["geodata"])

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def _load_geojson_file(filename: str) -> dict:
    """
    Load a GeoJSON file from the data directory.

    Args:
        filename: Name of the GeoJSON file (e.g., "cctv.geojson")

    Returns:
        Parsed GeoJSON dict

    Raises:
        HTTPException 404 if the file doesn't exist
        HTTPException 500 if the file can't be parsed
    """
    filepath = DATA_DIR / filename
    if not filepath.exists():
        raise HTTPException(
            status_code=404,
            detail=f"GeoJSON file '{filename}' not found. "
            f"Ensure the file exists at: {filepath}",
        )
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse '{filename}': {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading '{filename}': {str(e)}",
        )


@router.get("/cctv")
async def get_cctv() -> JSONResponse:
    """
    Get all CCTV camera locations as GeoJSON.

    Returns a FeatureCollection with Point features, each containing:
    - coordinates (lat/lon)
    - properties: id, zone, coverage_radius_m, active status
    """
    data = _load_geojson_file("cctv.geojson")
    return JSONResponse(content=data)


@router.get("/police")
async def get_police() -> JSONResponse:
    """
    Get all police station locations as GeoJSON.

    Returns a FeatureCollection with Point features, each containing:
    - coordinates (lat/lon)
    - properties: name, phone, jurisdiction
    """
    data = _load_geojson_file("police_stations.geojson")
    return JSONResponse(content=data)


@router.get("/chokepoints")
async def get_chokepoints() -> JSONResponse:
    """
    Get all crowd chokepoint locations as GeoJSON.

    Returns a FeatureCollection with Point/LineString features, each containing:
    - coordinates (lat/lon)
    - properties: name, type, capacity estimate
    """
    data = _load_geojson_file("chokepoints.geojson")
    return JSONResponse(content=data)


@router.get("/zones")
async def get_zones() -> JSONResponse:
    """
    Get all Kumbh Mela zone boundaries as GeoJSON.

    Returns a FeatureCollection with Polygon features, each containing:
    - boundary coordinates
    - properties: id, name, area_sq_m, has_medical, crowd_density_level
    """
    data = _load_geojson_file("zones.geojson")
    return JSONResponse(content=data)
