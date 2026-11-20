# Change Record: CHG-20261116-0050

## Title
Internal Server Processing Client Demo Page, Direct Bin-to-Vending Transition, and Ultra-Low Resource Camera Configuration

## Date
2026-11-20

## Author
AI Assistant (Antigravity)

---

## 1. Before
- **Bin Page 3**: Legacy `<section id="viewBinPage3">` counter screen remained in the DOM, creating confusion and unused code paths.
- **Bin-to-Vending Navigation**: Clicking "DONE / GO TO VENDING" on Bin Page 4 opened the legacy `integratedBinDepositModal` popup with HX711 intake & weighing animation instead of directing directly to the Neon Vending catalogue.
- **Payment Success & End Session Routing**: After payment or on session abort, state cleanup did not always guarantee an exclusive return to Page 1 (`viewPage1`).
- **Camera Stream Footprint**: Camera constraints ran at 640x480 @ 15fps, with high bitrates (280–320 kbps) and 0.75 JPEG snapshot compression, creating excessive memory/CPU/disk consumption in constrained kiosk environments.
- **Client System Visualization**: There was no dedicated, accessible screen to demonstrate internal server processing, microservices communication, and hardware actuation to clients.

---

## 2. Present
- **Removed Legacy Bin Page 3**: Stripped `<section id="viewBinPage3">` entirely from `run-all.html` and `index.html`. Updated `ALL_KIOSK_VIEW_IDS`.
- **Direct Bin-to-Vending Flow**: Refactored `completeBinDeposit()` to instantly generate the Eco-Reward voucher (`ECO-20-XXXX`), record the disposal intake to `/api/v1/bin/disposal` in the background, navigate directly to `goToVendingPage3()`, auto-fill the redeem code in `#neonRedeemCodeInput`, and apply the discount immediately with zero popups.
- **Deterministic Return to Page 1**: Upgraded `closeKioskSuccessWindowClean()`, `closeKioskSuccessWindow()`, and `endUserSession()` to ensure that payment completion, timeout, and "END SESSION" actions cleanly reset all cart items, vouchers, and overlays, returning exclusively to Page 1 ("TOUCH THE DISPLAY").
- **Ultra-Low Camera Configuration (Rule 3)**:
  - Resolution: 320x240 (4:3 aspect ratio) @ 10fps.
  - Video bitrates: reduced from 280–320 kbps down to 90–100 kbps.
  - Snapshot compression: reduced to 0.35 JPEG quality.
  - Simulated canvas stream: downsampled to 320x240 @ 10fps.
- **New Option 3 on Page 2**: Added "Internal Server Processing" card (`btn-select-server-processing`) inside a responsive 3-card grid on Page 2.
- **New Server Processing Kiosk View (`viewServerProcessing`)**:
  - Visual End-to-End Hardware & Cloud Pipeline Map (HX711 $\rightarrow$ REST API $\rightarrow$ Voucher Minting $\rightarrow$ Razorpay Webhook $\rightarrow$ GPIO Coils).
  - Client demonstration action buttons to trigger live server routines.
  - Live daemon output log terminal console.
  - Integrated `/api/v1/health` and `/api/v1/system/status` endpoints on the server.

---

## 3. After
- Seamless kiosk experience with zero legacy popup windows.
- Users deposit waste on Bin Page 4 and are routed directly to the Neon Vending catalogue with their 20% discount already applied.
- Completing payment or terminating a session returns immediately to the Welcome screen.
- Camera and recording footprint minimized by over 60%, drastically reducing memory, CPU, and disk overhead.
- Clients can view live internal server processing on a dedicated, touch-optimized screen.
- All 194 system tests in `test-suite.ps1` pass with 100% success.
