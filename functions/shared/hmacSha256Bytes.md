# Function: `hmacSha256Bytes`

- **Module / File**: `packages/shared/src/utils/crypto.ts`
- **Component**: `Shared Cryptographic Engine`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Implements RFC 2104 Keyed-Hashing for Message Authentication (HMAC) using SHA-256 in pure TypeScript. Guarantees authenticity and anti-tamper security for Code 128 reward barcodes without requiring external native crypto dependencies.

## 2. Importance & Criticality
- **System Role**: Cryptographic verification of reward barcodes to prevent fraudulent discount code generation.
- **Impact of Failure**: Forgery of barcodes leading to unauthorized monetary discounts.

## 3. Function Signature & Contracts

```typescript
export function hmacSha256Bytes(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `keyBytes` | `Uint8Array` | Yes | Secret HMAC key bytes | Non-empty byte array |
| `messageBytes` | `Uint8Array` | Yes | Message payload to sign | Memory-aligned Uint8Array |

### Return Value
- **Type**: `Uint8Array` (32-byte HMAC signature).

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Callers**: `generateBarcodeIdentifier()` and `verifyBarcodeSignature()`.

### Downstream Targets & Consumers
- **Next Stage**: Truncated 4-byte hex checksum embedded into Code 128 barcode string.

### Integration Flow Diagram
```mermaid
flowchart TD
    A["Secret Key + Payload"] --> B["hmacSha256Bytes()"]
    B -->|Inner Hash: sha256Bytes(ipad + msg)| C["Inner Digest"]
    C -->|Outer Hash: sha256Bytes(opad + inner)| D["32-byte HMAC Tag"]
```

---

## 5. Memory Alignment & Resource Optimization
- Fixed 64-byte block allocation for inner/outer padding.
- **Time Complexity**: $O(M)$ where $M$ is message length.
- **Space Complexity**: $O(1)$.

