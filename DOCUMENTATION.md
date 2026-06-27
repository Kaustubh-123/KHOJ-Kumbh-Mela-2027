# 📚 KHOJ System Documentation

## Architecture Overview
KHOJ is designed as a distributed edge-AI triage network for extreme high-density crowd environments (specifically built for the Nashik Kumbh Mela 2027). The system shifts the burden from centralized cloud processing to localized, privacy-first edge nodes.

### 1. The Edge Kiosk Nodes (Frontend)
Built in **Next.js 14**, **React**, and **Tailwind CSS**, the physical Kiosk serves two simultaneous purposes:
- **Active Mode (Triage):** An accessible, highly visual Wizard interface for panicked families to report missing persons or for lost individuals to seek emergency aid.
- **Passive Mode (CCTV):** A continuous monitoring node that extracts clothing color vectors and crowd density metrics without storing biometric facial data.

### 2. Privacy-Safe Visual Scanning
A core innovation of KHOJ is its approach to subject identification.
Instead of relying on facial recognition (which fails in crowds of 100M+ people and violates privacy), KHOJ uses:
1. **Apparel Vectorization:** Extracting dominant color hexes, patterns, and clothing types.
2. **Spatio-Temporal Constraints:** Limiting searches to geographically relevant zones based on time elapsed and walking speed equations.

### 3. Real-World Data Integration
The KHOJ mapping interface integrates authentic Hackathon datasets:
- **CCTV Locations (KML):** Live mapping of 18 strategic camera positions.
- **Police Stations (KML):** 8 localized deployment zones.
- **Chokepoint Overlays:** Identifying high-risk stampede zones for crowd redirection.

## State Management & Local Storage Demo
For the purposes of the Hackathon presentation, the backend ML routing is simulated entirely within the client's browser using `localStorage`.

- `khoj_passive_capture`: Stores the simulated metadata vector when the passive CCTV is triggered.
- `khoj_lost_person`: Stores the active missing person report.

The `RecommendationEngine` logic determines Haversine distance bounds between these local variables to output the "MATCH FOUND" alert.

## Design System & UI/UX
The UI is strictly designed for **high-stress situations**:
- Massive, legible typography (Inter/Outfit).
- High-contrast colors (Red/Blue/Orange) for immediate cognitive mapping.
- Glassmorphic elements and spring animations (`framer-motion`) to provide a premium, assuring, and futuristic user experience that calms the reporting user.
