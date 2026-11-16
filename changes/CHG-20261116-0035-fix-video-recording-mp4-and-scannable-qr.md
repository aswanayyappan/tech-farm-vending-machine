# Change Log: CHG-20261116-0035 - Fix Video Recording (MP4), Flush On Demand, Scannable Dynamic QR & Razorpay Gateway

**Date:** 2026-11-16  
**Status:** IMPLEMENTED  
**Scope:** Vending & Bin Kiosk Frontend (`run-all.html`, `index.html`), Backend HTTP Server (`start-server.ps1`), Storage Engine (`recordings/`), Configuration (`.env`, `.env.example`), Function Documentation (`functions/`)

---

## 1. Before State
1. **Video Recording Gaps**:
   - `timeslice` was locked strictly to 60,000ms. Test sessions lasting 16s or 41s ended before the first 60s window completed.
   - `kioskMediaRecorder.requestData()` was never invoked upon `endUserSession()`, so session footage remained buffered in browser memory and was lost upon session termination.
   - Video container defaulted strictly to WebM (`.webm`), which lacked native thumbnail previews in Windows Explorer and failed to play in default Windows Media Player without specialized third-party codec packs.
2. **Webcam Video Preview Blocked**:
   - `getUserMedia` was called only on `DOMContentLoaded` before user interaction, resulting in browser autoplay policy suppression.
   - `<video>` preview elements did not enforce explicit DOM property initialization (`.muted = true`, `.playsInline = true`).
3. **QR Code Generator Overflow**:
   - The vanilla QR code matrix engine had an `RS_BLOCK_TABLE` truncated at Version 10 (maximum capacity 271 bytes).
   - The JSON payload being encoded was ~338 bytes, causing an unhandled `code length overflow` exception caught by the catch block, displaying red text `QR GENERATION FAILED`.
4. **Razorpay Payment Gateway**:
   - Razorpay test keys were provided in `rzp-test-key.csv` but were not yet wired into the backend API or kiosk frontend checkout.

---

## 2. Present State
1. **Instant Session Video Flush & MP4 Storage**:
   - Implemented `flushSessionVideoChunk()`: whenever a session starts, completes, or is aborted, `kioskMediaRecorder.requestData()` is dispatched immediately, slicing and transmitting the exact session interaction footage to `/api/v1/recordings/chunk`.
   - Continuous 60s background chunking remains active during idle standby mode.
   - Prioritized `video/mp4` / `video/mp4;codecs=avc1` in `MediaRecorder` with fallback to `video/webm`.
   - Updated `start-server.ps1` to detect MP4 MIME types and save binary files directly with `.mp4` extension in `recordings/`, enabling instant native playback in Windows Media Player and thumbnail generation in Windows Explorer.
2. **Camera User-Gesture Activation**:
   - Wired `initKioskCameraFeed()` to the Page 1 "TOUCH THE DISPLAY" user click event and the header camera lens trigger.
   - Explicitly configured `.muted = true`, `.autoplay = true`, `.playsInline = true` on `<video id="kioskCameraVideo">` and `<video id="headerCameraLensVideo">`.
3. **Scannable Dynamic QR Matrix**:
   - Expanded the embedded QR engine's `RS_BLOCK_TABLE` through Version 20, accommodating up to 858 bytes of data without overflow.
   - Streamlined Vending Page 4 QR code to encode the authentic UPI payment URI (`upi://pay?pa=sdds@kiosk&pn=SmartDiaper&am=...&cu=INR&tn=SESS-...`) alongside a compact session telemetry payload. Phone cameras, Google Lens, and UPI apps (GPay, PhonePe, Paytm) scan and decode it instantaneously.
   - Streamlined Smart Bin Page 4 QR code to render verified eco-reward vouchers and deposit telemetry.
4. **Razorpay Gateway Integration**:
   - Stored `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` and sanitized templates in `.env.example`.
   - Implemented backend endpoints `POST /api/v1/payments/razorpay/create-order` and `POST /api/v1/payments/razorpay/verify` (HMAC-SHA256 signature verification).
   - Embedded Razorpay Checkout modal SDK in `run-all.html` and `index.html` with a prominent touch-friendly action button.

---

## 3. After State
1. **Verified Continuous & Session Video Ingestion**:
   - Video chunks are written to `recordings/` both at 60s intervals and immediately upon customer session completion as `.mp4` or `.webm` files.
   - Live video feed streams smoothly into both the header lens and floating HUD viewfinder.
2. **Authentic Scannable QR Codes**:
   - Page 4 of both Smart Bin and Vending Machine renders genuine, high-contrast QR matrices decoded seamlessly by iOS Camera, Android Google Lens, and banking apps.
3. **Dual Payment Gateways**:
   - Customers can pay via 1-Tap Quick Pay, Stripe Card, or Razorpay (UPI, QR, Cards, NetBanking).
4. **100% Rules Compliance**:
   - Functions documented in `functions/`, evolution logged in `changes/`, 0 new npm packages (Rule 9), security and sanitization enforced (Rule 8), and touch kiosk ergonomics maintained (Rule 11).
