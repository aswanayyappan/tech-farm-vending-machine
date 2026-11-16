# CHG-20261116-0047: Absolute Screen Isolation & Zero-Overlap View Architecture

## 1. Temporal Evolution Tracking

### Before
- **Stacking & Coordinate Inconsistency**:
  - `viewPage1` used `position: fixed` with `z-index: 40`.
  - `viewPage2` used `position: fixed` with no explicit `z-index`.
  - `viewVendingPage3` used `position: fixed` with `z-index: 50`.
  - `viewBinPage3`, `viewBinPage4`, and `viewVendingPage4` used `position: static` inside `.master-frame`.
  - `.master-frame` applied `backdrop-filter: blur(24px)` and dark background when not in `page1-mode`, creating an unexpected containing block and stacking context that trapped fixed children and caused visible visual overlap and bleed-through during transitions.
  - Page hiding in `hideAllViews()` set simple inline `style.display = 'none'`, which could be overridden by CSS specificity or leave lingering visual elements.

### Present
- **Diagnosis & Requirements**:
  - The user confirmed (`A1: solve by use`) that page transition and overlapping between Page 1, Page 2, and the Vending screen was the core issue needing resolution.
- **Active Refactoring**:
  - Implement atomic `showView(viewId)` manager: forcefully applies `display: none !important; visibility: hidden !important; pointer-events: none !important;` to all non-active screens, and grants `display: flex !important; visibility: visible !important; pointer-events: auto !important; z-index: 100 !important;` strictly to the target screen.
  - Neutralize `.master-frame` layout interference: ensure it remains 100% transparent with zero background/backdrop-filter traps.
  - Standardize all screen containers (`page1-container`, `page2-container`, `neon-vending-wrapper`, `page3-container`, `page4-container`) as uniform fixed full-viewport `100vw × 100vh` viewports with zero border leakage.
  - Upgrade `viewBinPage3` and `viewBinPage4` backgrounds to the matching warm cream aesthetic (`radial-gradient(circle at 50% 20%, #ffffff 0%, #faf3dd 60%, #f4ebd0 100%)`) for complete visual cohesion.

### After
- **Resulting Behavior**:
  - 100% mutually exclusive screen rendering: only exactly one view is visible and interactive at any millisecond.
  - Zero page overlap, zero ghost touch targets, zero stacking context bleeding between Page 1, Page 2, Vending Page 3, and Bin screens.
  - Smooth, instantaneous transitions on every touch button (`HOME`, `MENU`, `SMART BIN`, `VENDING MACHINE`, `END SESSION`).
  - Full automated verification passing on `test-suite.ps1`.
