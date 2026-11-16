# Function: `useIdleTimer`

- **Module / File**: `packages/vending-frontend/src/hooks/useIdleTimer.ts`
- **Component**: `Kiosk Frontend Session Governance`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
In a public kiosk deployment, customers may walk away without completing or cancelling their order. Leaving an active cart or customer information on the public display creates privacy leaks and blocks subsequent customers. This hook listens for touch/mouse/keyboard activity, displays a 10-second grace warning, and resets the kiosk to the advertisement carousel if untouched.

## 2. Importance & Criticality
- **System Role**: Core kiosk security, privacy hygiene, and state reset mechanism.
- **Impact of Failure**: Abandoned transactions remain open on the public touchscreen.

## 3. Function Signature & Contracts

```typescript
export function useIdleTimer(options: {
  timeoutSeconds?: number;
  warningSeconds?: number;
  onIdle: () => void;
  enabled?: boolean;
}): {
  isWarningActive: boolean;
  secondsRemaining: number;
  resetTimer: () => void;
}
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `timeoutSeconds` | `number` | No (default: 60) | Inactivity threshold before session reset | Integer $> 0$ |
| `warningSeconds` | `number` | No (default: 10) | Countdown prompt display duration | Integer $< timeoutSeconds$ |
| `onIdle` | `Function` | Yes | Callback invoked when timer expires | Resets kiosk state |
| `enabled` | `boolean` | No (default: true) | Whether monitoring is active | Pauses during payment |

### Return Value
- **Type**: `{ isWarningActive: boolean, secondsRemaining: number, resetTimer: () => void }`

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: Window touch/pointer/keyboard interaction events (`touchstart`, `mousedown`, `keydown`).

### Downstream Targets & Consumers
- **Next Stage**: Triggers `IdleWarningModal` during grace period, then triggers `resetSession()` to restore `AdCarousel`.

### Integration Flow Diagram
```mermaid
flowchart TD
    A["Customer Touchscreen Inactivity (50s)"] -->|Timer Expiry| B["useIdleTimer() activates warning"]
    B -->|Show Countdown (10s)| C["IdleWarningModal"]
    C -->|No Touch in 10s| D["onIdle() callback"]
    D -->|State Machine Reset| E["Return to Fullscreen AdCarousel"]
    C -->|Customer Taps Screen| F["resetTimer() & Resume Shopping"]
```

---

## 5. Memory Alignment & Resource Optimization
- Guaranteed unbinding of all event listeners in `useEffect` cleanup return function.
- Clears active timeouts and intervals to prevent detached timer leaks.
- **Complexity**: $O(1)$ memory overhead.

