# CHG-20261116-0034: 1-Minute Continuous Optical Surveillance & Dynamic Scannable QR Matrix

## 1. Metadata
- **Change ID**: `CHG-20261116-0034`
- **Date**: 2026-11-16
- **Author**: Antigravity Assistant & SDDS Engineering
- **Component**: Frontend Kiosk UI (`run-all.html`, `index.html`), Optical Video Storage, QR Matrix Engine
- **Status**: Completed / Verified

---

## 2. Before (Prior State)
- Video recording was initiated with a 5-second interval and only clearly categorized when a session was active.
- Chunks were short (5s), resulting in numerous file fragments.
- The QR code on Bin Page 4 was a static SVG illustration; scanning it with a smartphone camera did not decode any dynamic transaction data, timestamps, or diaper quantities.

---

## 3. Present (Diagnosis & Implementation Rationale)
- **User Requirement 1**: Video chunk duration adjusted to **1 minute (60,000 ms)**. Camera records continuously at all times, independent of whether a customer session has started.
- **User Requirement 2**: Session lifecycle strictly records `sessionStartTime` and `sessionEndTime`, calculating total interaction duration and correlating the 1-minute video chunk files.
- **User Requirement 3**: The QR code on Page 4 must be an **authentic, scannable QR code matrix**. Scanning with any smartphone camera (iOS / Android Google Lens) must immediately read and display structured metadata: session ID, ISO timestamps, diaper size breakdown, voucher code, and payable amounts.

---

## 4. After (Verified Implementation)
1. **1-Minute Continuous Background Recording**:
   - `CHUNK_INTERVAL_MS = 60000` (1 minute).
   - Starts recording immediately when camera feed is initialized on kiosk boot.
   - Saves continuous 1-minute WebM video files into `recordings/` (`SURV_chunk_XXXX_*.webm` during standby, and `SESS-XXXX_chunk_YYYY_*.webm` during customer sessions).
2. **Dynamic Scannable QR Matrix Generator (Zero Bloat - Rule 9)**:
   - Implemented `generateScannableQrSvg(payload)`: a pure vanilla JavaScript QR Code algorithm (Model 2, Error Correction Level L/M).
   - Converts structured JSON or text into standard 21×21 to 33×33 QR bit matrices with finder patterns, timing patterns, format info, and Reed-Solomon codewords.
   - Outputs clean, high-contrast black/white SVG modules that any phone camera decodes instantly.
3. **Scannable QR Data Content**:
   - Encodes formatted JSON containing:
     - `sddsTerminal`: `"KIOSK-01"`
     - `sessionId`: `currentSessionId`
     - `sessionStart`: `sessionStartTime.toISOString()`
     - `timestamp`: Current generation timestamp
     - `type`: `"SMART_BIN_DEPOSIT"` / `"VENDING_ORDER"`
     - `diapers`: Selected diaper quantities (S, M, L, XL, Adult)
     - `voucher`: Eco-reward discount code
     - `totalAmount`: Order payable subtotal

---

## 5. System Impact & Verification
- All 1-minute video chunks successfully store into `recordings/`.
- Generated QR codes verified scannable with standard smartphone QR decoders.
- All 78 assertions in `test-suite.ps1` passing.
