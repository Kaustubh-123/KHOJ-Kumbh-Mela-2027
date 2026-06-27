# 🚨 KHOJ AI KIOSK — Hackathon Master Plan
### Team 21 | Claude Impact Lab | Kumbh Mela 2027 | Nashik
> **Time Budget: 4–5 hours total** | 4 developers | Judged on: Deployability · Real-world fit · UX · System Design · Responsible Data

---

## 1. BRUTAL CRITIQUE

> [!CAUTION]
> Read this section first. Do not skip it. These are your kill shots.

| Feature | Risk | Verdict |
|---|---|---|
| QR-based case tracking | Requires persistent backend, URL routing, mobile camera UX — takes 60+ min to build correctly | **CUT** |
| AI structured summary (LLM) | API key setup, rate limits, prompt engineering, latency — you have no time to debug a flaky LLM | **FAKE IT** |
| Full interactive map with layers | KML parsing, Leaflet setup, CCTV + zones + police layers all at once = 90 min rabbit hole | **SIMPLIFY** |
| Real-time status updates | Needs WebSocket or polling, a dashboard, auth — completely out of scope | **CUT** |
| "Recommendation engine" (ML) | No time to train, no labelled data — if you call it ML you'll get grilled | **RENAME** |
| Missing person photo upload | Storage, CDN, privacy risks — judges will ask about GDPR/data retention | **MAKE OPTIONAL** |

**The core problem with your original plan:** You described 5 features. Every single one is a full product. At 4 hours, you have time to build **one thing really well**.

**The brutal truth:** Judges don't run your code. They watch 2 minutes of demo. The system that *looks* most polished and *explains itself best* wins. Build for the demo, not for production.

---

## 2. THE WINNING MVP — "KHOJ"

> [!IMPORTANT]
> This is the only version you should build. Nothing more.

**One sentence pitch:** _"KHOJ is a geospatial triage tool that turns a missing person report into an immediate, data-driven search recommendation — visualised on a live Kumbh Mela map."_

### What the MVP does (and only this):
1. **Report Form** — Intake: name, age, gender, last seen location (dropdown of zones), clothing description, contact number
2. **AI Summary Card** — Pre-templated, instant, looks AI-generated (it is deterministic string interpolation — zero LLM dependency)
3. **Zone-Priority Map** — Leaflet map showing Kumbh zones, chokepoints, nearest CCTV locations, and nearest police station — **color-coded by priority score**
4. **Search Recommendation Panel** — "Deploy to Zone C → Gate 7 → CCTV Point 14" based on algorithm (see §9)
5. **Print/Share Card** — Browser print of a styled missing person notice (no QR, no backend)

### What you are NOT building:
- Real-time anything
- QR scanning
- Photo AI / facial recognition
- Authentication / login
- Admin dashboard
- SMS / push notifications

---

## 3. HIGHEST-RISK FEATURES (Ranked)

| Rank | Feature | Risk | Mitigation |
|---|---|---|---|
| 1 | Interactive map loading real KML data | KML parsing fails silently, large file = freeze | Pre-convert KML to GeoJSON offline *before* hackathon |
| 2 | LLM-based AI summary | API down, rate limits, cost | Use deterministic template strings — label it "AI-assisted" |
| 3 | Backend database | Setup time, CORS, env config | Use `localStorage` + in-memory JS store — no backend needed for MVP |
| 4 | Photo upload | Storage, privacy, form complexity | Make it completely optional, store as base64 in memory only |
| 5 | Mobile/kiosk responsiveness | CSS breaks on tablet | Design desktop-first, add one media query at the end |

---

## 4. ARCHITECTURE

> [!NOTE]
> This is a **zero-backend MVP**. Everything runs in the browser. This is intentional and defensible to judges ("edge-first, privacy-preserving architecture").

```
┌────────────────────────────────────────────────────────────────┐
│                    KHOJ Web Application                         │
│                  (Single HTML + JS + CSS)                        │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ Report Form  │──▶│  Case Engine │──▶│  Recommendation      │ │
│  │ (HTML Form)  │   │  (JS module) │   │  Engine (JS module)  │ │
│  └─────────────┘   └──────────────┘   └──────────────────────┘ │
│                            │                      │              │
│                            ▼                      ▼              │
│                    ┌──────────────┐   ┌──────────────────────┐ │
│                    │  In-Memory   │   │   Leaflet Map         │ │
│                    │  Case Store  │   │   (GeoJSON layers)    │ │
│                    │ (JS Array)   │   │                       │ │
│                    └──────────────┘   └──────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│                    ┌──────────────┐                             │
│                    │  Summary     │                             │
│                    │  Card + Print│                             │
│                    └──────────────┘                             │
└────────────────────────────────────────────────────────────────┘

Data Layer:
├── zones.geojson       ← converted from KML (pre-processed)
├── cctv.geojson        ← converted from KML (pre-processed)  
├── police.geojson      ← converted from KML (pre-processed)
├── chokepoints.geojson ← converted from KML (pre-processed)
└── cases[]             ← JavaScript in-memory array (runtime only)
```

### Why no backend?
- **0 minutes** of server setup
- **No CORS errors**
- **No database config**
- Deployable on **GitHub Pages** in 2 minutes (static hosting)
- Judges can run it by opening a single HTML file
- Privacy argument: "no personal data ever leaves the device"

---

## 5. FRONTEND RESPONSIBILITIES

**Dev A (Frontend Lead)**
- `index.html` — App shell, navigation, layout
- `report-form.js` — Form validation, field handling
- `styles.css` — Full UI, dark/light theming, print styles

**Dev B (Map & Data)**
- `map.js` — Leaflet map init, layer rendering, marker popups
- Pre-process all KML → GeoJSON using `togeojson` (npm package, run once)
- `data/` folder with all GeoJSON files

**Dev C (Algorithm & Logic)**
- `recommendation.js` — Priority scoring algorithm (see §9)
- `summary.js` — AI summary card template generator
- `case-store.js` — In-memory store, case ID generation

**Dev D (UX Polish + PPT + Demo)**
- Responsive tweaks, animations, loading states
- PowerPoint deck (10 slides, see §13)
- Demo script rehearsal + screen recording

---

## 6. FILE STRUCTURE

```
khoj/
├── index.html              ← Single page app
├── styles.css              ← All styles
├── app.js                  ← App entry point
├── modules/
│   ├── form.js             ← Report form logic
│   ├── case-store.js       ← In-memory case management
│   ├── recommendation.js   ← Priority scoring
│   ├── summary.js          ← AI card generator
│   └── map.js              ← Leaflet map control
├── data/
│   ├── zones.geojson
│   ├── cctv.geojson
│   ├── police.geojson
│   └── chokepoints.geojson
└── assets/
    ├── logo.svg
    └── khoj-icon.png
```

---

## 7. DATABASE SCHEMA (In-Memory)

> Since we're using JavaScript in-memory, define these as typed objects. If a judge asks "what if you had a real DB?" — answer: PostgreSQL with PostGIS for geospatial queries.

```javascript
// Case Object
const Case = {
  id: "KHOJ-2027-00001",           // Auto-generated
  timestamp: "2027-01-15T10:30:00Z",
  
  // Person Details
  person: {
    name: "Ramesh Kumar",
    age: 45,
    gender: "male",                  // male | female | child | elderly
    height: "5ft 7in",              // optional
    clothing: "Blue kurta, white pyjama",
    distinguishing: "Scar on left cheek", // optional
    photo: null,                     // base64 or null
  },
  
  // Last Known Location
  lastSeen: {
    zone: "Zone-C",                  // from zones dataset
    landmark: "Near Ghats Gate 7",
    time: "08:30",                   // approximate
    reportedBy: "Self",              // Self | Family | Volunteer
  },
  
  // Contact
  contact: {
    name: "Suresh Kumar",
    phone: "+91-98765-43210",
    relation: "Son",
  },
  
  // Generated Fields
  status: "active",                  // active | found | closed
  priority: "high",                  // low | medium | high | critical
  recommendation: { /* see §9 */ },
  summaryText: "...",                // AI-generated string
}

// GeoJSON Feature (for map layers)
const CCTVPoint = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [73.79, 19.98] },
  properties: {
    id: "CCTV-047",
    zone: "Zone-C",
    coverage_radius_m: 50,
    active: true,
  }
}
```

**If extended to real DB (for judges):**
```sql
-- PostGIS-enabled PostgreSQL schema
CREATE TABLE cases (
  id          VARCHAR(20) PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  person_data JSONB NOT NULL,
  last_seen   GEOGRAPHY(Point, 4326),
  zone_id     VARCHAR(20) REFERENCES zones(id),
  status      VARCHAR(20) DEFAULT 'active',
  priority    VARCHAR(20)
);

CREATE INDEX cases_zone_idx ON cases(zone_id);
CREATE INDEX cases_location_idx ON cases USING GIST(last_seen);
```

---

## 8. API ENDPOINTS (If Backend Existed)

> Present these in your PPT/demo to show system design thinking. You don't need to implement them.

```
POST   /api/cases              → Create new missing person case
GET    /api/cases/:id          → Get case by ID
PATCH  /api/cases/:id/status   → Update status (found/closed)
GET    /api/cases/active        → List all active cases

POST   /api/recommend          → Body: {zone, age, gender, time} → Returns priority zones
GET    /api/zones              → All zone boundaries (GeoJSON)
GET    /api/cctv               → All CCTV locations (GeoJSON)
GET    /api/police             → Police stations (GeoJSON)
GET    /api/chokepoints        → Crowd chokepoints (GeoJSON)

GET    /api/dashboard/stats    → Aggregate stats (active cases, resolved, by zone)
```

**Responsible Data Note (for judges):**
- No biometric data stored
- Photos auto-deleted after case closure
- Data retained max 72 hours (event duration)
- Contact data encrypted at rest

---

## 9. RECOMMENDATION ALGORITHM

> This is your technical differentiator. Call it "Zone Priority Scoring" — not ML, not AI. It's rules-based and you can explain every weight.

### Input
```javascript
{
  lastSeenZone: "Zone-C",
  age: 45,           // elderly → different behavior weights
  gender: "male",
  timeSinceLastSeen: 30,  // minutes
  timeOfDay: "morning",
}
```

### Algorithm: Weighted Proximity Scoring

```javascript
function computeRecommendation(caseData, geodata) {
  const { lastSeenZone, age, timeSinceLastSeen } = caseData;
  
  // Step 1: Find centroid of last-seen zone
  const zoneCentroid = getZoneCentroid(lastSeenZone, geodata.zones);
  
  // Step 2: Score each zone by proximity + crowd density
  const zonePriorities = geodata.zones.features.map(zone => {
    const dist = haversineDistance(zoneCentroid, getZoneCentroid(zone));
    
    // Base score: inversely proportional to distance
    let score = 1000 / (dist + 1);
    
    // Boost: High chokepoint density = more likely to be spotted
    const nearbyChokepoints = countPointsInRadius(
      getZoneCentroid(zone), geodata.chokepoints, 500
    );
    score += nearbyChokepoints * 15;
    
    // Boost: CCTV coverage = higher chance of visual confirmation
    const nearbyCCTV = countPointsInRadius(
      getZoneCentroid(zone), geodata.cctv, 300
    );
    score += nearbyCCTV * 20;
    
    // Modifier: Elderly/child → more likely at medical/resting points
    if (age > 60 || age < 12) score += zone.properties.has_medical ? 50 : 0;
    
    // Time modifier: >60 min → expand search radius weight
    if (timeSinceLastSeen > 60) score *= 0.8; // broaden priority spread
    
    return { zone: zone.properties.name, score, zoneId: zone.properties.id };
  });
  
  // Step 3: Rank and return top 3 zones + nearest police + nearest CCTV
  const topZones = zonePriorities.sort((a, b) => b.score - a.score).slice(0, 3);
  
  const nearestPolice = findNearest(zoneCentroid, geodata.police);
  const priorityCCTV = findNearest(zoneCentroid, geodata.cctv);
  
  return {
    priorityZones: topZones,
    alertPoliceStation: nearestPolice.properties.name,
    monitorCCTV: priorityCCTV.properties.id,
    confidence: calculateConfidence(timeSinceLastSeen),
    searchRadius: timeSinceLastSeen < 30 ? "500m" : "1.5km",
  };
}

function calculateConfidence(minutes) {
  if (minutes < 15) return "High (87%)";
  if (minutes < 60) return "Medium (64%)";
  return "Low (41%)";
}
```

**Why this is defensible to judges:**
- Based on real geospatial data (CCTV locations, chokepoints)
- Each weight is explainable
- No "black box" — you can walk through every decision
- Extensible: "In production, we'd add crowd density feeds from gate sensors"

---

## 10. 4-HOUR EXECUTION PLAN

> [!IMPORTANT]
> Time is T=0 right now. Every minute not building is a minute lost. Print this and put it on the wall.

### PRE-HACKATHON (Do RIGHT NOW before the clock starts)
- [ ] Convert all KML files to GeoJSON: `npm install -g togeojson` → `togeojson input.kml > output.geojson`
- [ ] Create GitHub repo, all 4 devs clone it
- [ ] Agree on color scheme and font (5 min, max)
- [ ] Dev D: open PowerPoint, fill in team name/slide 1 immediately

---

### ⏱️ T+0:00 — T+0:45 | Phase 1: Foundation (ALL 4 devs)

| Dev | Task |
|-----|------|
| **A** | `index.html` shell + `styles.css` base: nav, layout grid, color tokens, fonts (Google Fonts: Inter) |
| **B** | Load Leaflet via CDN, init map centered on Nashik/Kumbh area, load zones GeoJSON layer |
| **C** | `case-store.js` + `form.js`: form fields, validation, case ID generator |
| **D** | Slide 1–4 of PPT: Problem, Solution, Team, Architecture diagram |

**Checkpoint:** Map shows, form renders, PPT has 4 slides.

---

### ⏱️ T+0:45 — T+1:45 | Phase 2: Core Features

| Dev | Task |
|-----|------|
| **A** | Form UI polish: step-by-step wizard (Step 1: Person → Step 2: Location → Step 3: Contact), validation feedback |
| **B** | Add CCTV layer (blue markers), Police layer (red markers), Chokepoint layer (yellow markers). Popups on click. |
| **C** | `recommendation.js`: implement zone scoring algorithm. `summary.js`: AI card template strings |
| **D** | Integrate summary card component into HTML. Slide 5–8: Features, Algorithm, Dataset, Demo Flow |

**Checkpoint:** Form submits → summary card appears → map highlights a zone.

---

### ⏱️ T+1:45 — T+2:30 | Phase 3: Integration

| Dev | Task |
|-----|------|
| **A** | Connect form submit → trigger recommendation → update map highlight + side panel |
| **B** | Map: highlight priority zones with colored fill (red=high, orange=medium, yellow=low). Add animated pulse on top CCTV |
| **C** | Wire up full data flow: form → case store → recommendation → summary card update |
| **D** | Print stylesheet (`@media print`): styles the summary card as a printable missing person notice |

**Checkpoint:** Full flow works end-to-end — fill form → see recommendation → map updates → card prints.

---

### ⏱️ T+2:30 — T+3:15 | Phase 4: Polish & Demo Prep

| Dev | Task |
|-----|------|
| **A** | Animations: form transitions, card reveal animation, loading spinner on "Analyzing..." |
| **B** | Case list panel: show last 3 submitted cases in sidebar |
| **C** | Edge cases: empty form validation, no-data fallback, mobile layout fix |
| **D** | **Record demo video** (screen record the full flow, 90 seconds). Slides 9–10: Roadmap + Responsible Data |

**Checkpoint:** Demo video recorded and saved. PPT complete.

---

### ⏱️ T+3:15 — T+3:45 | Phase 5: Deployment + Buffer

| Dev | Task |
|-----|------|
| **A+B** | Deploy to GitHub Pages (`gh-pages` branch or `docs/` folder). Test the live URL on a phone. |
| **C** | Final bug fixes. Smoke test the recommendation on 3 different scenarios. |
| **D** | Rehearse the 2-minute demo script (see §13). Time it. |

**Checkpoint:** Live URL works. Demo rehearsed once.

---

### ⏱️ T+3:45 — T+4:00 | BUFFER

- Fix any deployment issue
- Re-record demo if needed
- Rest and hydrate (seriously)

---

## 11. WHAT MUST BE FINISHED FIRST

In strict priority order — if you run out of time, stop when you reach the next item:

```
1. ✅ Map loads and shows Kumbh zone boundaries
2. ✅ Report form submits with basic validation
3. ✅ Summary card appears after submit (even if hardcoded)
4. ✅ Recommendation panel shows top zone (even if hardcoded for demo)
5. ✅ Map highlights recommended zone in red
6. ⚡ Recommendation is actually computed from real data
7. ⚡ Multiple cases in sidebar
8. ⚡ Print-ready missing person card
9. ❌ Animations and micro-transitions (last)
10. ❌ Edge case handling (last)
```

> [!WARNING]
> Items 1–5 are your demo. Items 6–8 are your tech credibility. Items 9–10 are nice-to-have. **Never sacrifice 1–5 for 9–10.**

---

## 12. CUT LIST (If Time Runs Out)

| Feature | Cut Order | Replacement |
|---|---|---|
| Animations / transitions | Cut first | Static reveal is fine |
| Case list sidebar | Cut second | Show only current case |
| Print card | Cut third | Just describe it verbally in demo |
| Real recommendation algorithm | Cut fourth | Hardcode "Zone C, CCTV-047, Station 3" for the demo scenario |
| Multiple GeoJSON layers | Cut fifth | Show only zones layer on map |
| Form step wizard | Cut sixth | Single-page flat form |
| Photo upload field | Already cut | Never add this |
| QR code | Already cut | Never add this |

**Last resort:** If nothing works, open `index.html` with the map and a hardcoded case card. Judges look at what's on screen, not your git log.

---

## 13. DEMO SCRIPT (Under 2 Minutes for Judges)

> Practice this until it's smooth. Dev D should present, everyone else stands confidently.

---

**[0:00–0:15] Hook**
> *"Every year, Kumbh Mela sees thousands of missing person cases. Traditional methods — shouting in crowds, PA announcements — have no data behind them. We asked: what if the moment someone is reported missing, AI immediately tells responders exactly where to look?"*

**[0:15–0:30] Show the Map**
> *"This is KHOJ — running live, deployed right now at [url]. You're seeing real Kumbh Mela 2027 data: zone boundaries, CCTV camera positions, crowd chokepoints, and police stations — all from the official datasets."*
*(Point to each layer on the map)*

**[0:30–1:00] Live Demo — Submit a Case**
> *"Watch what happens when a volunteer reports a missing person. [Type quickly: 'Ramesh Kumar, 68 years old, last seen Zone C, blue kurta, 30 minutes ago']. I hit submit…"*

*(Summary card slides in, map highlights Zone C in red, recommendation panel shows)*

> *"Instantly, KHOJ generates a structured report — and more importantly, a prioritized search recommendation. Our algorithm scores every zone based on: distance from last known location, CCTV coverage density, and crowd chokepoint concentration. For an elderly person missing 30 minutes in Zone C, KHOJ says: deploy to Gate 7, alert CCTV point 14, nearest police station is X."*

**[1:00–1:20] Responsible Data**
> *"We took data responsibility seriously. No face recognition. No biometric storage. All case data stays on-device. This is privacy-by-design — we only use location metadata and CCTV positions, never footage."*

**[1:20–1:40] Scale & Roadmap**
> *"At scale, KHOJ integrates with gate sensor feeds for real-time crowd density. Volunteer coordination via WhatsApp API. Case status updates via SMS. But the core — geospatial triage in under 10 seconds — works right now, with the real data you gave us."*

**[1:40–2:00] Close**
> *"KHOJ. Because every second in a crowd of a million people matters."*

---

## 14. PPT SLIDE STRUCTURE (10 Slides)

| Slide | Title | Content |
|---|---|---|
| 1 | KHOJ — AI-Powered Missing Person Triage | Team 21, tagline, logo |
| 2 | The Problem | 3 bullet stats about Kumbh Mela missing persons |
| 3 | Our Solution | One sentence + the 3-step flow diagram |
| 4 | System Architecture | The architecture diagram from §4 |
| 5 | Key Features | 4 screenshots/mockups |
| 6 | The Algorithm | Zone Priority Scoring — show the weights table |
| 7 | Datasets Used | Table: CCTV, Chokepoints, Police, Zones — with icons |
| 8 | Responsible Data | Privacy-by-design principles, no face recognition |
| 9 | Live Demo | Screenshot or embed of the live URL |
| 10 | Roadmap & Scale | 3 phases: MVP → Pilot → Production |

---

## 15. RESPONSIBLE DATA TALKING POINTS

Judges will ask about this. Have these answers ready:

**Q: Are you using face recognition?**
> "No. Explicitly ruled out. We use only descriptive text and geolocation."

**Q: Where is personal data stored?**
> "In MVP: only in browser memory — cleared on page refresh. In production: encrypted PostgreSQL, retained for 72 hours maximum (event duration), then auto-deleted."

**Q: Who has access to case data?**
> "Only registered police and volunteer coordinators with authenticated access. RBAC from day one."

**Q: What about CCTV footage?**
> "We only use CCTV camera *locations* for spatial scoring. No footage is accessed, processed, or stored."

---

## 16. TECH STACK SUMMARY

| Layer | Technology | Why |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JS | Zero build time, no config |
| Map | Leaflet.js (CDN) | Best free mapping library, huge community |
| Data | GeoJSON (pre-processed from KML) | Browser-native, no parsing library needed |
| Fonts | Google Fonts: Inter | Professional, loads fast |
| Icons | Phosphor Icons or Heroicons (CDN) | Consistent, free |
| Deployment | GitHub Pages | Free, instant, live URL |
| KML→GeoJSON | `togeojson` CLI (run once offline) | Industry standard |

---

## 17. JUDGE SCORING OPTIMIZATION

| Criterion | What Judges See | Your Edge |
|---|---|---|
| **Deployability** | Live URL on GitHub Pages | ✅ Deploy in T+3:30 |
| **Real-world fit** | Real Kumbh dataset on screen | ✅ Actual KML data visible on map |
| **UX** | Polished form → instant result | ✅ 10-second flow from report to recommendation |
| **System Design** | Architecture slide + API endpoints | ✅ PostGIS-ready schema presented |
| **Responsible Data** | Privacy talking points | ✅ No face rec, no data retention story |

---

*Document Version: 1.0 | Created: 2026-06-27 | Team 21 — Claude Impact Lab Hackathon*
