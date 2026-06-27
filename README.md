<div align="center">

# 🚨 KHOJ
**AI-Powered Emergency Triage & Missing Person Network**
*Designed for extreme-density crowds (Nashik Kumbh Mela 2027)*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

</div>

---

## 🌍 The Problem: 100 Million People
The Nashik Kumbh Mela is the largest human gathering on Earth. When a child goes missing in a sea of millions, traditional police reporting is too slow, and standard facial recognition fails due to extreme occlusions, lack of connectivity, and severe privacy concerns.

## 💡 The Solution: KHOJ Edge Nodes
KHOJ re-imagines crowd safety by deploying localized, interactive Edge Kiosks throughout the Mela grounds. 

Our Kiosks serve a dual purpose:
1. **Interactive Triage:** A stress-free, lightning-fast Wizard UI for parents to report missing loved ones, or for lost children to seek immediate help.
2. **Passive Vector Capture:** The Kiosk's camera continuously scans the passing crowd, extracting non-biometric, privacy-safe metadata (clothing colors, patterns) rather than storing facial geometry.

When a parent reports a child missing, KHOJ instantly cross-references the child's clothing vectors against our passive capture network, calculating Haversine distances to deploy police directly to the most probable chokepoint.

## ✨ Key Features

- **Privacy-First AI Scanning**: KHOJ relies on clothing vectorization instead of facial recognition, preserving the privacy of the millions of pilgrims.
- **Wizard of Oz Architecture**: Beautiful, calming glassmorphic UI designed specifically to lower cognitive load for panicked users.
- **Real Hackathon Data**: Integrated directly with authentic Nashik Kumbh Mela KML datasets, mapping active CCTV cameras and police stations.
- **Stealth Monitoring**: Kiosk feeds act as decentralized CCTV nodes, capturing critical transit metadata silently.

## 📂 Project Structure

- `/frontend` - The core Next.js Kiosk interface and Admin Dashboard.
- `/backend` - The FastAPI recommendation engine (Optional for the standalone demo).
- `HOW_TO_RUN.md` - Step-by-step instructions to run the KHOJ Kiosk locally.
- `DOCUMENTATION.md` - Deep dive into the KHOJ technical architecture and ML constraints.
- `presentation.html` - The interactive HTML pitch deck.

## 🚀 Getting Started

Please see [HOW_TO_RUN.md](HOW_TO_RUN.md) for detailed instructions on launching the Next.js Kiosk locally!

---
*Built with ❤️ for the Claude Impact Lab Hackathon 2026*
