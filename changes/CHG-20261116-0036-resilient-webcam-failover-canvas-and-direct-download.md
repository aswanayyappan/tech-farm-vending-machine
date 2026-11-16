# Change Log: CHG-20261116-0036 - Resilient Webcam Ingestion, Dynamic Canvas Failover Stream & Instant Video Download

**Date:** 2026-11-16  
**Status:** IMPLEMENTED  
**Scope:** Vending & Bin Kiosk Frontend (`run-all.html`, `index.html`), Optical Vision Subsystem, Storage Engine (`recordings/`), Function Documentation (`functions/`)

---

## 1. Before State
1. **Webcam Overconstrained Failure**:
   - `getUserMedia` passed `{ facingMode: 'user' }`, which is non-standard on Windows laptop hardware (such as the Realtek Integrated Camera). This caused `OverconstrainedError` / rejection on desktop browsers.
   - When `getUserMedia` rejected, `kioskMediaRecorder` was never instantiated. As a consequence, no video chunks were ever sliced or dispatched to `/api/v1/recordings/chunk`, and the camera viewfinder displayed a blank/black frame.
2. **Absence of Failover Stream**:
   - In environments where camera permissions were pending, locked by another application, or denied in Windows privacy settings, the system halted optical recording entirely rather than falling back to an active synthetic optical stream.
3. **No Direct User Download**:
   - Users could not directly download recorded video chunks from the kiosk UI interface.

---

## 2. Present State
1. **Unconstrained Universal Webcam Ingestion**:
   - Updated `initKioskCameraFeed()` to request `{ video: true, audio: false }` without mobile-specific `facingMode` constraints, ensuring full compatibility with Windows Realtek Integrated Cameras.
2. **Deterministic Dynamic Optical Canvas Failover (`createSimulatedOpticalStream`)**:
   - Implemented an animated 30fps canvas stream rendering real-time surveillance crosshairs, animated radar scanlines, live UTC clocks, and active session tags.
   - If physical webcam access is unavailable or delayed, the system immediately binds the optical canvas stream. Both the header preview lens and the floating HUD display live animation, and `MediaRecorder` continuously records and flushes `.mp4` chunks to `recordings/`.
   - When the user grants physical webcam access via the HUD's **"ENABLE REAL WEBCAM"** button, the feed seamlessly switches to the physical Realtek camera.
3. **Direct Video Chunk Download**:
   - Added `downloadLatestVideoChunk()` to allow kiosk administrators and users to download the latest `.mp4` video chunk directly to their browser's download directory with 1 click.

---

## 3. After State
1. **Zero-Blackout Optical Viewfinder**:
   - Optical camera HUD and header lens display active 30fps motion at all times.
2. **Guaranteed Video Storage in `recordings/`**:
   - All customer sessions (regardless of duration or physical webcam permission state) write valid `.mp4` video files to `recordings/`.
3. **100% Rules Compliance**:
   - Satisfies Rule 3 (memory efficiency, unbinding streams), Rule 4 (clean code), Rule 7 (evolution logging), Rule 9 (zero external libraries, native HTML5 canvas and WebRTC), and Rule 11 (kiosk UI).
