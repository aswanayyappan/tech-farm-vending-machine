# Function Documentation: `goToBinScanPage`

## 1. Why Added
Navigates the customer from the Bin Waste & Thermal Ticket Print screen (`viewBinPage4`) to the dedicated full-screen Optical QR Scanner & Computer Vision verification page (`viewBinScanPage`).

## 2. Importance & Criticality
Provides a dedicated, distraction-free screen for optical tag verification before opening the physical intake hatch, preventing premature access and confusion.

## 3. Signature & Contracts
```typescript
function goToBinScanPage(): void
```
- **Inputs**: None.
- **Outputs**: None (switches kiosk view).
- **Errors**: Defensive fallback gracefully defaults to scale weighing if camera or view is unmounted.

## 4. Pipeline Integration
```mermaid
flowchart LR
    BinPage4["viewBinPage4 (Thermal Ticket Printed)"] -->|User taps SCAN THE QR CODE| goToBinScanPage
    goToBinScanPage -->|showView('viewBinScanPage')| ViewBinScanPage["viewBinScanPage (Full View)"]
    ViewBinScanPage -->|Mirrors webcam stream| VideoFeed["#binScanCameraFeed"]
```

## 5. Behavior & Logic
1. Invokes `showView('viewBinScanPage')` to atomically hide all other views.
2. Updates `currentTerminalMode = 'bin_scan'`.
3. Binds the active webcam stream to `#binScanCameraFeed`.
4. Resets scanner state: sets status to `DETECTING...` and starts laser scanline animation.
5. Initiates simulated CV tag recognition timer (auto-verifying after 2.2s, or immediately via "Fake Accept").
