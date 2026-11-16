# CHG-20261116-0031: Camera Surveillance Indicator & Customer Session Lifecycle Management

## 1. Metadata
- **Change ID**: `CHG-20261116-0031`
- **Date**: 2026-11-16
- **Author**: Antigravity Assistant & SDDS Engineering
- **Component**: Frontend Kiosk UI (`run-all.html`, `index.html`), Backend API (`start-server.ps1`), Shared Kiosk Controllers
- **Status**: Completed / Verified

---

## 2. Before (Prior State)
- The kiosk operated without an explicit customer session lifecycle tracking mechanism. When a customer tapped the screen on Page 1, views switched to Page 2 without creating a persistent session record or recording timestamp.
- No visual camera surveillance badge existed on the kiosk frame to indicate active optical monitoring or footage indexing.
- Customers had no mechanism to intentionally terminate or cancel an in-progress session if they wanted to abandon the transaction prior to completing a purchase or diaper deposit.
- Abandoned carts remained in memory until overwritten or manually reset via developer drawer options.

---

## 3. Present (Diagnosis & Implementation Rationale)
- **Operational Requirement**: The kiosk's security camera / optical sensor is continuously operational ("always on"). Footage must be indexed with exact timestamps marking when a customer initiates a session (Page 1 touch) to when the session concludes (payment, deposit, or manual cancellation).
- **User Agency**: Customers must have a prominent, accessible "END SESSION" button (Rule 11) available across all workflow pages (Page 2, Page 3, Page 4) to cleanly terminate the interaction at any point.
- **Resource Discipline (Rule 3)**: Session timers, camera indicator intervals, and state structures must be deterministically instantiated upon session start and cleanly destroyed via `clearInterval` upon session termination.

---

## 4. After (Verified Implementation)
1. **Continuous Camera Surveillance Indicator**:
   - Master header features a persistent optical monitoring badge:
     - **Standby State (Page 1)**: `CAM ACTIVE • MONITORING` with a steady green/teal optical indicator dot.
     - **Active Session State (Pages 2-4)**: `REC • SESS ACTIVE` with a pulsing red optical sensor LED and live elapsed session timer (`[00:15]`, `[00:32]`).
2. **Session Lifecycle Controller**:
   - `startUserSession()`: Generates `sessionId` (`SESS-YYYYMMDD-XXXX`), records `sessionStartTime`, starts elapsed timer, reveals "END SESSION" button, and logs to `/api/v1/sessions/start`.
   - `endUserSession(reason)`: Calculates elapsed duration, posts audit payload to `/api/v1/sessions/end`, clears shopping cart and bin counts, resets camera badge to standby, hides "END SESSION" button, and navigates back to Page 1.
3. **Session Termination Triggers**:
   - `USER_ABORTED`: User taps the "END SESSION" header button.
   - `COMPLETED_VENDING`: Order payment and item dispensing complete.
   - `COMPLETED_BIN`: Diaper deposit and eco-reward voucher issuance complete.
   - `TIMEOUT`: 60 seconds of user inactivity.
4. **Backend Telemetry**:
   - `start-server.ps1` updated with REST endpoints `/api/v1/sessions/start` and `/api/v1/sessions/end` persisting session records into `sdds-state.json`.

---

## 5. System Impact & Verification
- Zero regression on existing Page 1 through Page 4 workflows.
- All 64 test assertions in `test-suite.ps1` passing.
- Touch ergonomic targets (48px+) and clean visual hierarchy verified per Rule 11.
