# Function: `startChunkedRecording`

## 1. Why Added
To record continuous video footage from the physical laptop webcam in structured chunks, ensuring persistent optical surveillance without file corruption in case of unexpected reloads or interruptions.

## 2. Importance & Criticality
- **Surveillance Integrity**: Enables continuous video recording without losing footage if a session ends abruptly.
- **Resource Management (Rule 3)**: Fixed 5,000ms timeslices ensure chunk sizes remain small (~200KB - 800KB), preventing large in-memory buffer build-up.
- **Consequences if Failed**: Loss of security footage, inability to audit transactions or disputed deposits.

## 3. Signature & Contracts
```typescript
function startChunkedRecording(stream: MediaStream): void;
```
- **Inputs**:
  - `stream` (`MediaStream`): Active video stream returned from `getUserMedia()`.
- **Outputs**: None. Mutates global `mediaRecorder` instance and sets sequence counter.
- **State Modifications**:
  - `window.kioskMediaRecorder`: Initialized with `stream`.
  - `window.videoChunkSequence`: Reset to 0.
- **Side Effects**:
  - Sets up `ondataavailable` listener bound to `dispatchVideoChunk()`.
  - Starts recorder with 5000ms timeslice (`mediaRecorder.start(5000)`).

## 4. Behavior & Logic
1. Checks if browser supports `MediaRecorder`.
2. Inspects supported MIME types (`video/webm;codecs=vp9`, `video/webm;codecs=vp8`, `video/webm`).
3. Instantiates `MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1000000 })`.
4. Binds `ondataavailable` event handler to invoke `dispatchVideoChunk(event.data)`.
5. Starts recording with 5000ms timeslice.

## 5. Pipeline Integration & Connection Mapping
- **Upstream Caller**: `initKioskCameraFeed()` upon receiving active `MediaStream`.
- **Downstream Targets**: `dispatchVideoChunk()` on every 5s timeslice tick.

```mermaid
flowchart LR
    Stream["Webcam MediaStream"] --> startChunkedRecording
    startChunkedRecording -->|"MediaRecorder.start(5000)"| MR["Active MediaRecorder"]
    MR -->|"ondataavailable (every 5s)"| dispatchVideoChunk
```
