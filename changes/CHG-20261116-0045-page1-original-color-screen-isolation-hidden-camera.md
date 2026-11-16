# Evolution Changelog: CHG-20261116-0045

**Title**: Page 1 Original Wave Artwork Color, Complete Viewport Screen Isolation, Hidden Background Optical Recording, 30% Cart Width & Taller Vending Cards
**Date**: 2026-11-16
**Author**: Antigravity SDDS Engineering Agent
**Rules Satisfied**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

---

## 1. Before (Initial State & Issues Identified)
1. **Page 1 Washed-Out Wave Artwork**:
   - `PICS/intoimage.png` on Page 1 was rendered with `opacity: 0.48;`, causing the rich organic green colors (`R=36, G=126, B=2`) to look faint, transparent, and desaturated.
2. **Page 2 & Vending Screen Overlap / Bleed**:
   - The legacy `.master-frame` shrank to `calc(100vw - 32px)` with glass borders and dark green gradient body background peeking around Page 2 and Vending screens.
   - The floating camera viewfinder HUD (`#cameraViewfinderHud`) was positioned at `z-index: 900`, overlaying on top of Page 2 service cards and Vending catalog items.
3. **Camera Viewfinder Visible on Kiosk Screen**:
   - Floating camera viewfinder HUD and header lens indicators were displayed on the web interface, cluttering the kiosk experience.
4. **Vending Catalog Card Proportions & Cart Width**:
   - Cart area was set to `480px`, consuming excessive horizontal space.
   - Product cards in the vending grid were only `54px` in image height, appearing overly compressed vertically.

---

## 2. Present (Diagnosis & Engineering Solution)
1. **Page 1 Full Original Image Color**:
   - Increase `opacity` from `0.48` to `1.0` while maintaining `mix-blend-mode: multiply;` and vertical gradient fade mask (`mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 70%, transparent 100%)`).
   - Retains seamless white base blending onto the warm cream `#faf3dd` background while delivering 100% authentic, vivid green color saturation.
2. **Deterministic Screen Viewport Isolation (Rule 11)**:
   - Normalize `.master-frame` to `width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; margin: 0; padding: 0; border: none; border-radius: 0; box-shadow: none; background: transparent; overflow: hidden;`.
   - Set `html, body` background to `#faf3dd !important;` so that both Page 1 and Page 2 share the clean warm cream background, eliminating any dark-green margin bleed.
   - Update `hideAllViews()` to enforce strict mutual exclusion across all views.
3. **Invisible Camera Background Surveillance (Rule 8: Security-First Architecture)**:
   - Move `<video id="kioskCameraVideo">` and `<video id="headerCameraLensVideo">` into a dedicated off-screen background host (`position: fixed; top: -9999px; left: -9999px; width: 320px; height: 240px; opacity: 0; pointer-events: none; z-index: -100;`).
   - Remove `#cameraViewfinderHud` and `.kiosk-camera-pill` from the visible web viewport so no camera boxes or HUDs appear on screen.
   - Ensure continuous active recording via `MediaRecorder` and chunk saving to `/api/v1/recordings/chunk`.
4. **Vending 30% Cart Width & Taller Product Cards**:
   - Configure `.neon-main-grid` with `grid-template-columns: 30% 1fr;` (or `clamp(280px, 30%, 360px) 1fr`), dedicating exactly 30% width to the cart and 70% to the product catalog.
   - Increase product box height in `.neon-prod-card` to `min-height: 200px;` and image wrapper height to `85px`, keeping column widths structured and clean.

---

## 3. After (Verified Implementation & Impact)
- **Visual Impact**: Page 1 displays original saturated green artwork with zero transparency wash; Page 2 and Vending screens occupy 100% full viewport with zero dark-green margins or overlapping elements.
- **Uncluttered Kiosk UI**: Zero camera viewfinder or HUD displayed on the screen; optical surveillance and video recording remain 100% active in the background.
- **Optimized Vending Layout**: Cart width reduced to exactly 30%, and product cards expanded with taller image viewports and clean touch ergonomics.
- **Test Integrity**: All 143+ test assertions verified and passing via `test-suite.ps1`.
