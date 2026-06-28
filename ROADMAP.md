# KHOJ Roadmap (2026 - 2027)

This document outlines the strategic roadmap for KHOJ as we transition from our initial Proof of Concept (which won the Claude Impact Lab Hackathon) to a production-ready, globally deployable open-source framework for extreme-density crisis management.

Our inaugural target deployment is the **2027 Nashik Kumbh Mela** (expected attendance: 100M+). 

## Current Status (v1.0)
Our `main` branch currently reflects the **v1.0 Stable Release**. This includes:
- The Next.js Edge Kiosk (Wizard UI for panic-free triage reporting)
- The Privacy-First metadata capture architecture
- Core UI mapping components and hotspot visualization

*Note: Our experimental microservices (Telegram bot, Python Backend, ML models) are currently housed in a separate active-development monorepo. We are in the process of auditing, stabilizing, and migrating these features into this primary repository.*

## Phase 1: Microservice Integration & Stabilization (Q3 2026)
**Goal:** Migrate and stabilize the hackathon backend into the core open-source framework.
- [ ] Migrate the `FastAPI` backend service for geospatial chokepoint calculations.
- [ ] Migrate and harden the Telegram Bot (`@findingfamilybot`) for distributed crowd-reporting.
- [ ] Introduce `docker-compose.yml` for 1-click local development of the entire stack.
- [ ] Setup initial CI/CD pipelines (GitHub Actions) for linting and test coverage.

## Phase 2: Claude AI Integration & Multilingual Support (Q4 2026)
**Goal:** Leverage Claude's advanced capabilities for unstructured text ingestion and expand language accessibility.
- [ ] Integrate Claude 3.5 Sonnet to parse messy, unstructured, and panicked text reports from Telegram and SMS into structured JSON triage tickets.
- [ ] Expand the Kiosk UI to support fully localized Hindi, Marathi, and Gujarati interfaces.
- [ ] Enhance the AI recommendation engine to assign urgency scores based on historical missing-persons heuristics.

## Phase 3: Edge Node & Hardware Testing (Q1 2027)
**Goal:** Prove hardware-agnostic deployability in low-connectivity environments.
- [ ] Test the Kiosk Next.js application on Raspberry Pi 5 / NVIDIA Jetson edge nodes.
- [ ] Optimize the local vector-matching algorithm to run entirely offline on edge CPUs.
- [ ] Implement sync-conflict resolution for edge nodes that temporarily lose network connection to the central Redis cluster.

## Phase 4: Inaugural Production Deployment (Q2 - Q3 2027)
**Goal:** Deploy KHOJ at the 2027 Nashik Kumbh Mela.
- [ ] Finalize white-label customization options for local police and NGOs.
- [ ] Live deployment testing with volunteer organizations.
- [ ] Performance monitoring under extreme multi-tenant load.

## Beyond 2027: Global Crisis Infrastructure
After validating the architecture at the Kumbh Mela, our goal is to offer KHOJ as a free, decentralized missing-persons framework for disaster relief agencies, refugee camps, and global mega-events (Olympics, Hajj).
