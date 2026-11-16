# Tech Farm Smart Diaper Vending Machine & Collection Bin (SDDS)

An enterprise-grade, touch-optimized sanitary diaper dispensing kiosk and smart collection bin system designed for public and institutional deployment (hospitals, daycare centers, corporate campuses, airports). Built with clean architecture, zero-dependency cryptographic token verification, and a modern cream and neon design system.

---

## 🌟 Key Architecture & Capabilities

### 1. Unified Touchscreen Kiosk UI (`run-all.html` / `index.html`)
- **Page 1 (Welcome Screen)**: Modern cream & neon glassmorphic design featuring ambient wave grounding layer (`intoimage.png`), pulsating ripple touch cues, and live system telemetry.
- **Page 2 (Service Mode Selector)**: Dual tactile cards for **Smart Bin Deposit** and **Smart Diaper Vending**, complete with status indicators and quick session cancellation.
- **Smart Diaper Vending**:
  - Vertical-scrolling 3-column product catalog with baby and adult diaper variants.
  - Multi-category filtering: Baby Diapers, Adult Diapers, Pull-Up Pants, and Eco-Bamboo.
  - Persistent 30% slide-out interactive shopping basket with real-time Rupee (₹) pricing.
  - In-place voucher redemption supporting instant Eco-Reward discounts (10% to 100% off).
  - Razorpay payment gateway integration with 1-tap demo test card checkout.
- **Smart Collection Bin**:
  - Direct guidance screen: Card A (Dynamic scannable QR token & thermal printer paper feed) and Card B (Step 1 Stick QR on bag, Step 2 Drop into auto-sensing intake hatch).
  - Simulated HX711 load cell weight measurement with stabilized hatch auto-seal.
  - Automated mathematical Eco-Reward discount computation (`min(25, 5 + floor((w - 50)/50))`).
  - 1-tap transition from Bin deposit to Vending with auto-populated and applied voucher codes.
- **Payment Settlement & Dispense Confirmation**:
  - Fullscreen celebration screen with glowing pulsing checkmark and active hatch guidance (`HATCH UNLOCKED — PLEASE COLLECT ITEMS NOW`).
  - Itemized transaction receipt card detailing products, size badges, transaction ID, and settled Rupee amount.
  - Actuated coil slot telemetry (e.g. `A1, A2`) and 10-second automatic session termination countdown.

### 2. Optical Security & Surveillance Engine
- Background WebRTC camera stream recording user interactions without web UI latency.
- Standalone MP4 video timeslicing and disk persistence.
- Complete session isolation and zero page overlap via atomic `showView()` display engine.

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- PowerShell (Windows) or any static HTTP server

### Running the System
To launch the integrated server daemon on `http://localhost:3000`:
```powershell
powershell -ExecutionPolicy Bypass -File start-server.ps1
```

Open your browser to:
- **Master Kiosk Experience**: `http://localhost:3000/run-all.html` (or `http://localhost:3000/index.html`)
- **Collection Bin Interface**: `http://localhost:3000/packages/bin-frontend/public/bin-kiosk.html`
- **Vending Kiosk Interface**: `http://localhost:3000/packages/vending-frontend/public/kiosk.html`
- **Admin & Telemetry Portal**: `http://localhost:3000/packages/vending-frontend/public/admin.html`

---

## 🧪 Verification & Automated Testing
The repository includes a comprehensive 186-assertion test suite validating cryptographic functions, discount calculations, Razorpay integration, DOM structures, and clean architecture rules:

```powershell
powershell -ExecutionPolicy Bypass -File test-suite.ps1
```

---

## 📂 Repository Structure
```
├── AGENTS.md                  # Master agent rules & architecture protocol
├── GEMINI.md                  # Master AI guidelines
├── functions/                 # Rule 1 & 2: Comprehensive Markdown function documentation
│   ├── bin/                   # Smart Bin functions
│   ├── vending/               # Vending Machine functions
│   └── shared/                # Core cryptographic & session management functions
├── changes/                   # Rule 7: Detailed Before-Present-After evolution changelogs
├── packages/                  # Production source monorepo
│   ├── shared/                # Cryptographic models, schemas, and types
│   ├── vending-backend/       # Express + TypeScript API server & drivers
│   └── vending-frontend/      # Next.js Touchscreen Kiosk UI
├── PICS/                      # Authentic UI design assets and reference screens
├── index.html                 # Production root kiosk entrypoint
├── run-all.html               # Master standalone kiosk application
├── test-suite.ps1             # 186-assertion verification suite
└── start-server.ps1           # Portable HTTP & telemetry daemon
```
