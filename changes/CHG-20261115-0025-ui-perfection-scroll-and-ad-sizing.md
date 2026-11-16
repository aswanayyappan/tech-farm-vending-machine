# Change Log: UI Perfection, Elimination of Scrollbars, Ad Sizing & Emoji Purge

- **Change ID**: `CHG-20261115-0025`
- **Date**: `2026-11-15`
- **Author / Agent**: `Antigravity`
- **Target Files**:
  - `run-all.html`
  - `packages/vending-frontend/public/kiosk.html`
  - `packages/bin-frontend/public/bin-kiosk.html`
  - `packages/bin-frontend/public/bin-kiosk-v5.html`
  - `packages/vending-frontend/public/kiosk-v5.html`
  - `packages/vending-frontend/public/admin-v5.html`
  - `changes/README.md`
  - `test-suite.ps1`

---

## 1. Before (Initial State & Problem Diagnosis)
- On `run-all.html`, the presence of 4 separate button groups in the header caused elements to wrap on sub-1400px displays, increasing the header height beyond 64px and causing a vertical window scrollbar on `body`.
- Several UI controls contained emojis (`⊞`, `♻`, `🛍`, `🚀`, `🔄`, `⚡`), violating Rule 11 (clean, enterprise, professional kiosk design system).
- The idle advertisement carousel overlay (`#adScreen`) in `kiosk.html` used excessive vertical padding and rigid text sizes, overflowing vertically when displayed inside half-width simulator iframes.
- Standard default Windows OS wide gray scrollbars were visible inside scrollable catalogue grids and item lists.

---

## 2. Present (Active Implementation & Rationale)
- **Zero Window Scroll Overflow**: Locked `body`, `html`, and `.view-container` to `height: 100vh; overflow: hidden;` with `flex: 1; min-height: 0;` on all iframe wrappers to ensure zero outer scrollbars.
- **Header Layout Restructuring**: Compacted `run-all.html` header controls into a single streamlined row with fluid gaps, responsive padding, and `white-space: nowrap` on all button labels.
- **Complete Emoji Purge**: Removed every emoji from `run-all.html`, `kiosk.html`, `kiosk-v5.html`, and `admin-v5.html`, replacing them with clean enterprise typography and SVG indicators.
- **Fluid Ad Carousel Sizing**: Refactored `.ad-carousel` in `kiosk.html` with a max-width container (`max-width: 480px`), fluid typography (`clamp(20px, 2.4vw, 32px)`), and touch CTA scaled to fit cleanly within split-screen iframe viewports without overflow.
- **Universal Custom Slim Scrollbars**: Introduced global 5px custom scrollbar styling (`::-webkit-scrollbar`) with transparent tracks and rounded slate thumbs across all scrolling panels (`.catalogue-grid`, `.product-grid`, `.cart-items`, `.diaper-list`, `.main-stage`).

---

## 3. After (Verified Implementation & Impact)
- Strict compliance with Rule 11 (Pristine, Touch-Optimized Kiosk UI).
- 100% clean visual hierarchy with zero unwanted window scrollbars, consistent alignment, and enterprise aesthetics.
- Seamless responsiveness across both solo full-screen kiosk displays and split-screen simulator modes.
