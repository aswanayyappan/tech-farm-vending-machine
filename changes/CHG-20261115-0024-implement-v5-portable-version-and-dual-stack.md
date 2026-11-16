# Change Log: Implement SDDS V5 Portable Architecture & Dual-Version Switcher

- **Change ID**: `CHG-20261115-0024`
- **Date**: `2026-11-15`
- **Author / Agent**: `Antigravity`
- **Target Files**:
  - `run-all.html`
  - `packages/bin-frontend/public/bin-kiosk-v5.html`
  - `packages/vending-frontend/public/kiosk-v5.html`
  - `packages/vending-frontend/public/admin-v5.html`
  - `start-server.ps1`
  - `functions/v5/V5BinKiosk_generateQrTransactionToken.md`
  - `functions/v5/V5BinKiosk_validateWeightAndIssueReward.md`
  - `functions/v5/V5Vending_reserveStockAndCheckout.md`
  - `functions/README.md`
  - `changes/README.md`
  - `test-suite.ps1`

---

## 1. Before (Initial State & Problem Diagnosis)
- The existing codebase implemented the streamlined **V1** workflow (Direct Diaper Disposal without OTP, calibrated load cell weighing, 8-slot vending, and instant voucher issuance).
- The newly provided V5 specifications in `SDDS_V5_Documents/` (Product Requirements Document and Plan of Action) introduce a formal production-oriented baseline requiring:
  1. Explicit Session Management and CCTV-style session video recording metadata (no facial/mask detection).
  2. A 2-stage Bin workflow: Diaper itemization $\rightarrow$ Unique QR Transaction Token $\rightarrow$ Print/Scan Token $\rightarrow$ Hatch unseal $\rightarrow$ HX711 Load Cell Weight limit check $\rightarrow$ Separate Reward Code issuance upon validated disposal.
  3. Vending stock reservation prior to payment, server-side payment verification, and confirmed ESP32 drop sensor dispense evidence.
  4. Central Admin Notification Center (Bin Full, Low Stock, Device Faults, Storage Faults) and Video Recording Audit Ledger.
- Previously, there was no versioning or version switcher mechanism to allow demonstrating both V1 and V5 side-by-side or toggling between them portably.

---

## 2. Present (Active Implementation & Rationale)
- **Universal Version Switcher (`run-all.html`)**: Added a 1-click version switcher pill allowing instant switching between `V1 (Direct Disposal)` and `V5 (PRD Baseline)`.
- **Portable V5 Collection Bin Kiosk (`packages/bin-frontend/public/bin-kiosk-v5.html`)**:
  - Session lifecycle management (`SES-BIN-XXXX`) with CCTV session recording indicator.
  - Generates opaque, unguessable QR Transaction Tokens (`TX-QR-XXXX`) separate from reward codes.
  - Simulates token generation and barcode/QR scanning to unseal the solenoid intake hatch.
  - Validates measured diaper weight against configured limits for the selected diaper variants.
  - Issues a separate reward discount code (`ECO-XX-XXXX`) only after successful disposal validation.
- **Portable V5 Vending Machine Kiosk (`packages/vending-frontend/public/kiosk-v5.html`)**:
  - Implements session tracking (`SES-VND-XXXX`) and stock reservation before payment.
  - Validates separate reward discount codes and records confirmed ESP32 IR drop beam evidence.
- **Portable V5 Admin Portal (`packages/vending-frontend/public/admin-v5.html`)**:
  - Central Notification Center displaying live alerts for Bin Full, Low Stock, Device Connectivity, and Storage space.
  - Video Recording Audit Ledger tracking session IDs, durations, file sizes, and CCTV metadata.
  - Spiral coil matrix monitoring with 1-click restocking and remote motor pulse diagnostics.
- **Server API & State Routing (`start-server.ps1`)**:
  - Added support for `/api/v5/...` endpoints, session tracking, and video recording metadata logging.
- **Function Documentation & Change Indexing**:
  - Documented all core V5 functions in `functions/v5/` with upstream/downstream pipeline maps.
  - Updated `changes/README.md` and `functions/README.md`.

---

## 3. After (Verified Implementation & Impact)
- Full portability: Users can show V1 or V5 on demand with 1 click.
- 100% compliance with Rules 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, and 11.
- All 41 existing verification tests and new V5 asset tests pass cleanly.
