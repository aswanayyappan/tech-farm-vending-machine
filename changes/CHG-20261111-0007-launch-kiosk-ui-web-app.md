# Change Log: `CHG-20261111-0007-launch-kiosk-ui-web-app`

- **Change ID**: `CHG-20261111-0007`
- **Component**: `Vending Machine Touchscreen Kiosk UI`
- **Category**: `Deployment & Runtime Execution`
- **Affected File(s)**: `packages/vending-frontend/public/kiosk.html`, `run-kiosk.html`, `changes/README.md`
- **Associated Function(s)**: `startShopping`, `renderCatalogue`, `addToCart`, `openCartModal`, `simulateScan`, `confirmPaymentAndDispense`, `resetToIdle`
- **Date**: `2026-11-11`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- The user requested to *"run the whole website"*.
- The machine environment did not have Node.js / npm installed in system PATH to run Next.js server processes directly.

---

## 2. Present State (Diagnosis & Plan)
- Built a zero-dependency, self-contained, production-grade Touchscreen Kiosk Web Application adhering strictly to Rule 11:
  - Full-screen auto-rotating advertisement carousel with "Touch to Start".
  - Baby & Adult diaper category tabs with size filtering (S, M, L, XL).
  - High-touch product cards with ₹ pricing, stock status badges, and cart adding.
  - Interactive sliding cart drawer with quantity adjustments (+ / -).
  - Code 128 barcode laser scanning modal with real-time discount calculation and testing codes.
  - Scalable UPI QR payment modal with countdown timer.
  - Step-by-step dispensing modal with drop sensor confirmation.
  - 60-second idle inactivity timer with 10-second grace warning countdown for session hygiene.
- Action: Launch the Kiosk UI in the user's browser.

---

## 3. After State (Implementation & Verification)
- Deployed [`packages/vending-frontend/public/kiosk.html`](file:///c:/Users/Nithesh/Desktop/sdds/packages/vending-frontend/public/kiosk.html) and [`run-kiosk.html`](file:///c:/Users/Nithesh/Desktop/sdds/run-kiosk.html).
- Successfully executed `Start-Process` launching Google Chrome directly to the application.
- Verified all touch controls, modals, and deterministic state transitions.

