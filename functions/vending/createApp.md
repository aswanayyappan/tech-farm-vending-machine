# Function: `createApp`

- **Module / File**: `packages/vending-backend/src/app.ts`
- **Component**: `Vending Machine Express Application Factory`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Decouples Express application configuration from network port binding, enabling isolated integration testing and dependency injection of MongoDB handles and hardware drivers.

## 2. Importance & Criticality
- **System Role**: Core API server factory configuring middleware, routes, and centralized error handling.
- **Impact of Failure**: API server cannot start or route client requests.

## 3. Function Signature & Contracts

```typescript
export function createApp(
  db: Db,
  hardwareDriver: IHardwareDriver,
  machineId: string
): Express
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `db` | `Db` | Yes | Connected MongoDB database instance | Non-null connected `Db` |
| `hardwareDriver` | `IHardwareDriver` | Yes | Mock or Serial hardware dispensing controller | Implements `IHardwareDriver` |
| `machineId` | `string` | Yes | Unique identifier of this vending machine | Non-empty string |

### Return Value
- **Type**: `Express` application instance ready to mount on HTTP server.

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: Server bootstrap in `server.ts` or automated test harness.

### Downstream Targets & Consumers
- **Next Stage**: HTTP requests from Next.js Kiosk UI dispatched to `ApiController`.

### Integration Flow Diagram
```mermaid
flowchart LR
    A["server.ts bootstrap"] -->|db, hardwareDriver, machineId| B["createApp()"]
    B -->|Configured Express App| C["http.createServer()"]
    C -->|Listen on Port| D["Kiosk UI HTTP Requests"]
```

---

## 5. Memory Alignment & Resource Optimization
- Limits body JSON payload strictly to 256KB to prevent heap bloat on Raspberry Pi.
- Configures lean CORS rules.
- **Space Complexity**: $O(1)$.

