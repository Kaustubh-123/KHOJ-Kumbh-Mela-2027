# 🚀 How to Run KHOJ Locally

Follow these instructions to run the KHOJ AI Triage Kiosk on your local machine.

## Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **yarn**
- A webcam connected to your computer (required for the Kiosk visual scanning features).

## Step-by-Step Setup

### 1. Open the Terminal
Open your terminal (Command Prompt, PowerShell, or VS Code Terminal) and navigate to the root directory of the project.

### 2. Navigate to the Frontend Directory
The core Kiosk interface is built in Next.js and lives in the `frontend` directory.
```bash
cd frontend
```

### 3. Install Dependencies
Install all required Node modules (React, Next.js, Framer Motion, Tailwind, Lucide Icons, etc).
```bash
npm install
```
*(If you see warnings about peer dependencies, you can safely ignore them for the local demo).*

### 4. Start the Development Server
Run the local Next.js development server.
```bash
npm run dev
```

### 5. Open the Application
Once the server is ready, open your web browser (Chrome or Edge recommended) and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🎥 Using the Demo Features

To ensure your demo goes perfectly, here are the hidden triggers we built into the application:

1. **The Admin Map**: You can view the full city map and active KML datasets by visiting `http://localhost:3000/admin`.
2. **Hidden Passive Capture**: On the main Welcome Screen, click on the **CCTV LIVE** video feed in the bottom right corner. This silently captures your photo and saves it to local storage to simulate a person walking past the kiosk.
3. **Draggable CCTV**: You can click and drag the CCTV box anywhere on the screen, and use your mouse scroll wheel to resize it.
4. **Clear DB**: In the top right corner of the header, click the "Clear DB" button before starting a new demo to erase previous passive captures.

Enjoy your presentation!
