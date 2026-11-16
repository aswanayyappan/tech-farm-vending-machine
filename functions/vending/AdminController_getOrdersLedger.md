# Function: `AdminController.getOrdersLedger`

- **Module / File**: `packages/vending-backend/src/controllers/admin.controller.ts`
- **Component**: `Vending Machine Backend — Admin & Telemetry Hub`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Provides an immutable audit trail of all vending machine transactions, including gross values, applied voucher discounts, net payments captured, payment methods (UPI/Stripe), and motor drop verification states.

---

## 2. Importance & Criticality
- **System Role**: Financial & Transactional Audit Ledger.
- **Impact of Failure**: Technicians and accountants cannot audit cash/digital flow, verify customer dispute claims, or inspect failed dispensing events.
- **SLA / Performance Requirement**: Latency $< 100$ ms.

---

## 3. Function Signature & Contracts

```typescript
export async function getOrdersLedger(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>
```

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `req` | `Request` | HTTP GET request with optional query filters (`limit`, `search`) |
| `res` | `Response` | JSON array of `OrderAuditRecord` items |

---

## 4. Pipeline Integration & Connection

```mermaid
flowchart LR
    A["Admin Portal UI"] -->|GET /api/v1/admin/orders| B["getOrdersLedger()"]
    B --> C["Order Repository / Ledger"]
    C --> B
    B -->|OrderAuditRecord[] JSON| A
```

