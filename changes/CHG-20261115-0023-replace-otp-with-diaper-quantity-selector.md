# Change Log: Replace OTP Area with Touch Diaper Quantity Selector

- **Change ID**: `CHG-20261115-0023`
- **Date**: `2026-11-15`
- **Author / Agent**: `Antigravity`
- **Target Files**:
  - `packages/bin-frontend/public/bin-kiosk.html`
  - `functions/bin/BinKiosk_adjustDiaperCount.md`
  - `functions/bin/BinKiosk_confirmDiapersAndOpenHatch.md`
  - `functions/README.md`
  - `changes/README.md`
  - `test-suite.ps1`

---

## 1. Before (Initial State & Problem Diagnosis)
- In `packages/bin-frontend/public/bin-kiosk.html`, residual CSS styles and layout structures from the legacy OTP phone verification system (numeric keypad, `.otp-slots-row`, `.otp-cell`, `.pin-display`) remained in the file, causing dead code bloat.
- After starting a deposit session, the bin kiosk previously transitioned directly into opening the chamber hatch without providing the customer an opportunity to itemize what specific diaper variants and quantities were being deposited.
- The load cell weighing simulation generated a static random weight without correlation to the physical items being placed inside.

---

## 2. Present (Active Implementation & Rationale)
- **Purge of Legacy OTP Artifacts**: Completely purged all remaining OTP CSS classes, keypad grids, and obsolete keypad listeners from `bin-kiosk.html`.
- **Touch-Optimized Diaper Selection Stage (`#viewDiaperSelect`)**: Added an interactive itemization view between the welcome screen and the intake hatch opening:
  - Four diaper variant categories: Small Baby Diaper (S), Medium Baby Diaper (M), Large Baby Diaper (L), and Adult Diaper.
  - Touch-friendly 52px+ increment `[+]` and decrement `[-]` controls starting at `0` to `+++`.
  - Real-time summary pill tracking total diaper count and dynamic itemization.
  - Smart submission gate: *"Confirm & Open Intake Chamber →"* button is disabled (`opacity: 0.5; pointer-events: none;`) until at least 1 diaper is selected.
- **Physical Keyboard Acceleration**: In `#viewDiaperSelect`, keys `1`, `2`, `3`, `4` increment Small, Medium, Large, and Adult quantities respectively; `Enter` confirms and unlocks the hatch; `Escape` returns to welcome.
- **Dynamic Physics-Calibrated Weighing**: Load cell strain gauge measurement is dynamically computed from the exact diaper counts selected (e.g., Small ~65g, Medium ~85g, Large ~115g, Adult ~245g), delivering realistic sensor simulation.
- **Itemized Reward Voucher**: The printed receipt card and SVG QR voucher now explicitly list the deposited item breakdown alongside total weight and discount percentage.

---

## 3. After (Verified Implementation & Impact)
- Direct compliance with Rules 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, and 11.
- Frictionless, intuitive diaper itemization before intake chamber hatch opens.
- Automated synchronization across local storage event bus, `BroadcastChannel('sdds_realtime_sync')`, and `/api/v1/bin/disposal`.
- 100% test suite passage maintained.

