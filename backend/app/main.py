"""
KHOJ AI Kiosk - FastAPI Application Entry Point
Missing Person Search & Recommendation System for Kumbh Mela 2027, Nashik
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import cases, recommend, geodata, stats, search

app = FastAPI(
    title="KHOJ AI Kiosk API",
    description=(
        "Missing Person Search & Recommendation System for Kumbh Mela 2027, Nashik.\n\n"
        "KHOJ is a geospatial triage tool that turns a missing person report into "
        "an immediate, data-driven search recommendation — visualised on a live "
        "Kumbh Mela map.\n\n"
        "## Features\n"
        "- **Case Management**: Create, track, and update missing person cases\n"
        "- **Recommendation Engine**: Zone priority scoring based on proximity, "
        "CCTV coverage, and chokepoint density\n"
        "- **GeoJSON Data API**: Serve map layer data (zones, CCTV, police, chokepoints)\n"
        "- **Dashboard Stats**: Real-time aggregate statistics\n"
        "- **QR Code Generation**: Case tracking via QR codes\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",  # Vite default
        "http://localhost:5500",  # Live Server
        "http://127.0.0.1:5500",
        "http://127.0.0.1:3000",
        "http://localhost:8501",  # Kho-Ya-Paya (native)
        "http://localhost:7860",  # Kho-Ya-Paya (Docker)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(cases.router)
app.include_router(recommend.router)
app.include_router(geodata.router)
app.include_router(stats.router)
app.include_router(search.router)


@app.get("/", tags=["root"])
async def root() -> dict:
    """Root endpoint — API info and status."""
    return {
        "name": "KHOJ AI Kiosk",
        "version": "1.0.0",
        "status": "operational",
        "description": "Missing Person Search & Recommendation System — Kumbh Mela 2027",
        "docs": "/docs",
    }


@app.get("/health", tags=["root"])
async def health() -> dict:
    """Health check endpoint for monitoring and load balancers."""
    return {"status": "healthy"}
