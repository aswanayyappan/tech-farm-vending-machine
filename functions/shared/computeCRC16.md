# Function: `computeCRC16`

- **Module / File**: `packages/shared/src/utils/crypto.ts`
- **Component**: `Hardware Communication Protocol`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Serial UART/USB communication between the Raspberry Pi / PC and the ESP32 dispensing controller is prone to line noise and frame corruption. This function calculates standard CRC-16 (Modbus polynomial `0xA001`) checksums over the binary frame.

## 2. Importance & Criticality
- **System Role**: Safeguards motor dispensing actuation. Prevents corrupted electrical signals from triggering unintended motor channels.
- **Impact of Failure**: Misdispense, motor stall without detection, or wrong slot activation.

## 3. Function Signature & Contracts

```typescript
export function computeCRC16(buffer: Uint8Array): number
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `buffer` | `Uint8Array` | Yes | Raw byte payload transmitted across serial link | Non-null Uint8Array / Buffer |

### Return Value
- **Type**: `number` (16-bit unsigned integer: `0x0000` to `0xFFFF`).

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: Order payment confirmed; backend formats `DispenseCommand`.
- **Caller**: `ESP32Protocol.encodeFrame()`

### Downstream Targets & Consumers
- **Next Stage**: Attached to serial frame trailer and sent to ESP32 UART.

### Integration Flow Diagram
```mermaid
flowchart LR
    A["OrderService.authorizeDispense()"] -->|Command Payload| B["ESP32Protocol.encodeFrame()"]
    B -->|Buffer| C["computeCRC16()"]
    C -->|CRC16 Checksum| D["ESP32 Serial Port TX"]
```

---

## 5. Memory Alignment & Resource Optimization
- Operates directly over raw memory buffers via pointer iteration.
- Zero copy, zero auxiliary heap allocations.
- **Time Complexity**: $O(N)$ where $N$ is buffer length (typically $\le 32$ bytes).
- **Space Complexity**: $O(1)$.

