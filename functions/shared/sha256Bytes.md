# Function: `sha256Bytes`

- **Module / File**: `packages/shared/src/utils/crypto.ts`
- **Component**: `Shared Cryptographic Engine`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Provides a pure TypeScript, zero-dependency, memory-aligned implementation of the FIPS 180-4 Secure Hash Algorithm (SHA-256). Eliminates external binary dependencies, avoiding `@types/node` and native platform build issues across client browsers, Raspberry Pi, and server runtimes.

## 2. Importance & Criticality
- **System Role**: Core cryptographic primitive powering HMAC barcode generation and data integrity checks.
- **Impact of Failure**: Barcode issuance and token validation would fail.
- **SLA / Performance Requirement**: Sub-millisecond execution for typical barcode payload lengths.

## 3. Function Signature & Contracts

```typescript
export function sha256Bytes(data: Uint8Array): Uint8Array
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `data` | `Uint8Array` | Yes | Raw byte payload to hash | Standard memory-aligned Uint8Array |

### Return Value
- **Type**: `Uint8Array` (Exactly 32 bytes representing the 256-bit hash digest).

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: Called by `hmacSha256Bytes()` during barcode creation or validation.

### Downstream Targets & Consumers
- **Next Stage**: Result returned to HMAC engine or converted to hexadecimal for token emission.

### Integration Flow Diagram
```mermaid
flowchart LR
    A["Payload Bytes"] --> B["sha256Bytes()"]
    B -->|32-byte Digest| C["hmacSha256Bytes()"]
```

---

## 5. Memory Alignment & Resource Optimization
- Allocates fixed-size `Uint32Array(64)` for the message schedule.
- Uses 32-bit unsigned bitwise operations (`>>> 0`).
- **Time Complexity**: $O(N)$ where $N$ is input length.
- **Space Complexity**: $O(1)$ beyond input padding buffer.

