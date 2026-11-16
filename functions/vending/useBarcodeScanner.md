# Function: `useBarcodeScanner`

- **Module / File**: `packages/vending-frontend/src/hooks/useBarcodeScanner.ts`
- **Component**: `Kiosk Frontend Hardware Scanner Listener`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Physical USB barcode scanners operate in HID keyboard emulation mode, rapidly typing decoded barcode characters followed by an `Enter` keystroke. This hook listens for these microsecond-burst keystrokes, reconstructs the Code 128 barcode, and triggers the redemption workflow without requiring focused form inputs.

## 2. Importance & Criticality
- **System Role**: Peripheral hardware integration for barcode reward redemption on the kiosk touchscreen.
- **Impact of Failure**: Scanned codes from the collection bin cannot be recognized by the frontend interface.

## 3. Function Signature & Contracts

```typescript
export function useBarcodeScanner(options: {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minBarcodeLength?: number;
}): void
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `onScan` | `(barcode: string) => void` | Yes | Callback invoked with complete scanned string | Non-null callback |
| `enabled` | `boolean` | No (default: true) | Whether listener is active | Toggleable |
| `minBarcodeLength` | `number` | No (default: 8) | Minimum characters to trigger scan event | Filters short stray keys |

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: Laser scan of Code 128 barcode by USB barcode reader.
- **Keystroke stream**: High-speed keydown events (`< 60ms` interval).

### Downstream Targets & Consumers
- **Next Stage**: `POST /api/v1/rewards/scan` via `BarcodeScannerModal`.

### Integration Flow Diagram
```mermaid
flowchart LR
    A["USB Laser Barcode Scanner"] -->|HID Rapid Keystrokes + Enter| B["useBarcodeScanner()"]
    B -->|Verified String Buffer| C["BarcodeScannerModal.processBarcode()"]
    C -->|HTTP POST| D["Express Reward Engine Backend"]
```

---

## 5. Memory Alignment & Resource Optimization
- Reuses single string reference buffer.
- Employs timing delta threshold (`> 200ms` resets buffer to distinguish manual typing from hardware scans).
- Unbinds `window.removeEventListener('keydown')` on unmount.

