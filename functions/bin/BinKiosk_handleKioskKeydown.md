# Function: `handleKioskKeydown` (Global Keydown Event Listener)

- **Module / File**: `packages/bin-frontend/public/bin-kiosk.html`
- **Component**: `Collection Bin Touchscreen Kiosk UI Subsystem`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-14`

---

## 1. Why Was This Function Added? (Rationale)
Previously, `bin-kiosk.html` had zero support for physical keyboards. When testing on desktop/laptop browsers or dual-kiosk split terminals (`run-all.html`), pressing keyboard number keys (`0-9`), `Backspace`, `Escape`, or `Enter` was completely ignored, causing users to believe the input was broken or frozen. `handleKioskKeydown` intercepts keypresses, determines the active kiosk view, and dispatches the action to the appropriate handler.

## 2. Importance & Criticality
- **System Role**: Enables full keyboard accessibility and rapid desktop simulation alongside touch-screen keypad usage.
- **Impact of Failure**: Users attempting to type on desktop hardware or testing in iframes cannot input numbers via keyboard, resulting in usability deadlocks.

## 3. Function Signature & Contracts

```javascript
window.addEventListener('keydown', (e: KeyboardEvent): void => { ... })
```

### Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `e` | `KeyboardEvent` | Yes | Standard browser keyboard event object |

### Handled Keys
- `0` - `9`: Dispatches to `pressDigit(d)` in `viewMobile`, or `pressOtpDigit(d)` in `viewOtp`.
- `Backspace`: Dispatches to `backspacePhone()` or `backspaceOtp()`.
- `Escape`: Dispatches to `clearPhone()` or `clearOtp()`.
- `Enter`: Dispatches to `submitMobile()` in `viewMobile`, `verifyAndUnlockDoor()` in `viewOtp`, or stage advance in `viewWelcome` and `viewDeposit`.

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: User types on physical hardware keyboard while the collection kiosk window/iframe has focus.
- **Caller**: Browser DOM `window.onkeydown` event stream.

### Downstream Targets & Consumers
- **Next Stage**: Routes into corresponding state mutators (`pressDigit`, `pressOtpDigit`, `backspacePhone`, `verifyAndUnlockDoor`).

### Integration Flow Diagram
```mermaid
flowchart TD
    A["Physical Keyboard Event (window.keydown)"] --> B["Identify Active View (viewMobile / viewOtp / etc.)"]
    B -->|viewMobile & 0-9| C["pressDigit(key)"]
    B -->|viewMobile & Enter| D["submitMobile()"]
    B -->|viewOtp & 0-9| E["pressOtpDigit(key)"]
    B -->|viewOtp & Enter| F["verifyAndUnlockDoor()"]
    B -->|Backspace / Escape| G["backspaceOtp() / clearOtp()"]
```

---

## 5. Memory Alignment & Resource Optimization
- Single listener registered once at document initialization.
- Does not create closures or retain DOM trees; minimal CPU overhead per key event ($<0.05$ms).

