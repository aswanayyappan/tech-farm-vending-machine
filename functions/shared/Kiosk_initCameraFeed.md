# Function: `initKioskCameraFeed`

## 1. Why Added
To engage the kiosk's physical camera hardware (built-in laptop webcam or USB/MIPI optical camera) and provide continuous, live video streaming for surveillance, fraud prevention, and customer presence detection.

## 2. Importance & Criticality
- **Hardware Integration**: Activates the physical laptop webcam and delivers real-time video to HTML5 video elements.
- **Fail-Safe Operation**: Intercepts `NotAllowedError`, `NotFoundError`, and device contention errors gracefully, falling back to a simulated optical grid pattern without breaking kiosk functionality.
- **Consequences if Failed**: Unavailability of optical surveillance feed, lack of visual feedback to the user, and potential browser unhandled promise rejection.

## 3. Signature & Contracts
```typescript
async function initKioskCameraFeed(): Promise<boolean>;
```
- **Inputs**: None.
- **Outputs**:
  - `Promise<boolean>`: Resolves `true` if camera hardware was successfully opened and streaming; `false` if simulated fallback was activated.
- **State Modifications**:
  - `window.kioskCameraStream`: Stores active `MediaStream`.
  - DOM Elements: Attaches stream to `#kioskCameraVideo`.
  - Header Camera Lens: Displays live feed.
- **Side Effects**:
  - Browser displays standard permission prompt (on first run).
  - Physical laptop camera LED turns ON.
  - Registers `window.addEventListener('beforeunload')` to stop tracks cleanly (Rule 3).

## 4. Behavior & Logic
1. Verifies browser support for `navigator.mediaDevices && navigator.mediaDevices.getUserMedia`.
2. Requests video constraints: `{ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false }`.
3. Sets `video.srcObject = stream` and invokes `video.play()`.
4. Updates header lens and viewfinder HUD with active hardware streaming status.
5. If permission is denied or no webcam is found, sets fallback state: displays animated sensor pattern and alerts user gently.

## 5. Pipeline Integration & Connection Mapping
- **Upstream Caller**: `DOMContentLoaded` / kiosk initialization script.
- **Downstream Targets**:
  - Physical webcam hardware.
  - HTML5 video elements (`#kioskCameraVideo`).
  - `captureSessionSnapshot()` canvas reader.

```mermaid
flowchart LR
    Boot["Kiosk Boot (DOMContentLoaded)"] --> initKioskCameraFeed
    initKioskCameraFeed -->|"navigator.mediaDevices.getUserMedia()"| HW["Physical Laptop Webcam"]
    HW -->|"MediaStream"| VID["#kioskCameraVideo (Live 30fps)"]
    VID --> HUD["Optical Viewfinder HUD + Header Lens"]
    initKioskCameraFeed -.->|"Error / Fallback"| SIM["Simulated Optical Pattern"]
```
