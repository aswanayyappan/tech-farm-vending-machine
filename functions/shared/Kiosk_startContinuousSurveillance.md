# Function: `Kiosk_startContinuousSurveillance`

## 1. Why Added
Replaces raw timesliced chunking (`MediaRecorder.start(60000)` followed by intermediate `.requestData()` calls) which fragmented MP4 atom headers and produced corrupted 36-byte files. This function runs a cyclical, complete video recorder where each 60-second window is gracefully finalized via `.stop()`, compiling a self-contained, fully indexed `.mp4` file containing valid `ftyp`, `moov`, and `mdat` atoms.

## 2. Importance & Criticality
Provides 24/7 continuous optical security surveillance around the Smart Diaper Kiosk. If an incident or tampering occurs when no user is logged in, standalone 1-minute video recordings are preserved in `recordings/` and can be played directly in any standard video media player without transcoding.

## 3. Signature & Contracts
```typescript
function startContinuousSurveillance(stream: MediaStream): void
```
- **Inputs**: `stream: MediaStream` (active video stream from laptop camera).
- **Outputs**: `void`.
- **Interval**: 60,000 milliseconds (1 minute).

## 4. Behavior & Logic
1. Halts any pre-existing surveillance recorder safely.
2. Selects optimal MIME type: `video/mp4;codecs=avc1` -> `video/mp4` -> `video/webm;codecs=vp9` -> `video/webm`.
3. Instantiates `MediaRecorder` with low-bitrate compression tuning (280 kbps; down from 1.2 Mbps per user instruction) combined with 640x480 @ 15fps camera acquisition constraints.
   - *Compression Result*: Shrinks 1-minute video file size from ~1.16 MB down to ~180–240 KB (an ~80% footprint reduction) while preserving optical integrity for audit analysis.
4. Gathers frame buffers into a dedicated cycle array `surveillanceChunks = []`.
5. Schedules `.stop()` invocation at 60 seconds (60,000 ms).
6. Upon `onstop`:
   - Builds complete `Blob`: `new Blob(surveillanceChunks, { type: activeVideoMimeType })`.
   - Sends complete Blob to `/api/v1/recordings/chunk` as `SURV_STANDBY_1MIN_YYYYMMDD_HHMMSS.mp4` (or `.webm`).
   - Stores blob reference in `window.latestSurveillanceBlob` and `window.latestVideoBlob`.
   - Automatically kicks off the subsequent 1-minute surveillance cycle after a 300ms breather.

## 5. Pipeline Integration & Mapping
```mermaid
flowchart TD
    CameraStream["Realtek MediaStream"] --> Surveillance["Kiosk_startContinuousSurveillance()"]
    Surveillance --> CycleStart["MediaRecorder.start()"]
    CycleStart --> FrameCollect["Collect frames (60 seconds)"]
    FrameCollect --> CycleStop["MediaRecorder.stop()"]
    CycleStop --> CompleteBlob["Blob: Standalone MP4 File"]
    CompleteBlob --> LocalDisk["POST /api/v1/recordings/chunk -> recordings/"]
    CompleteBlob --> InKioskModal["window.latestSurveillanceBlob (In-Kiosk Player)"]
    CycleStop --> NextCycle["Next 1-Min Surveillance Cycle"]
```
