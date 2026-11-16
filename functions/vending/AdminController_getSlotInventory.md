# Function: `AdminController.getSlotInventory`

- **Module / File**: `packages/vending-backend/src/controllers/admin.controller.ts`
- **Component**: `Vending Machine Backend — Admin & Telemetry Hub`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Fulfills Phase 6 of PRD `vendingmachine_V1.md`. Supplies the Administrator Portal with real-time stock levels, SKU mappings, operational states, and low-stock alerts for all 8 dispensing spiral coils (Slots A1 to B4).

---

## 2. Importance & Criticality
- **System Role**: Slot Matrix Inventory State Provider.
- **Impact of Failure**: If this endpoint fails, the technician cannot monitor physical coil balances or identify jammed channels.
- **SLA / Performance Requirement**: Execution latency $< 50$ ms.

---

## 3. Function Signature & Contracts

```typescript
export async function getSlotInventory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>
```

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `req` | `Request` | HTTP GET request |
| `res` | `Response` | JSON array of `InventorySlot` objects |

---

## 4. Pipeline Integration & Connection

```mermaid
flowchart LR
    A["Admin Portal UI"] -->|GET /api/v1/admin/inventory/slots| B["getSlotInventory()"]
    B --> C["Slot Inventory Store (RAM/DB)"]
    C --> B
    B -->|InventorySlot[] JSON| A
```

