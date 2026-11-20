# CHG-20261120: Backend Cloud Synchronization Engine & Admin Panel Clean Isolation

**Date:** 2026-11-20  
**Author:** AI Engineering Assistant  
**Status:** COMPLETED  
**Affected Files:**
- `start-server.ps1`
- `run-all.html`
- `index.html`
- `packages/vending-frontend/public/admin.html`
- `functions/shared/processSyncBatch.md`
- `functions/admin/triggerCloudSync.md`

---

## 1. Before

1. **Transactional Outbox Absence**: Orders (`/api/v1/orders/record`) and Bin Disposals (`/api/v1/bin/disposal`) were recorded into `data/sdds-state.json` but lacked a formal outbox queue for cloud synchronization, preventing offline transactions from being systematically tracked and acknowledged by central cloud endpoints.
2. **Missing Sync API Routes**: The backend lacked `/api/v1/sync/status` and `/api/v1/sync/push` endpoints to report circuit breaker telemetry and process bulk cloud batch flushes.
3. **Admin Panel Header Override**: When launching the Administrator Portal from Page 2 via `selectTerminalMode('admin')`, the dark simulator wrapper bar (`.viewer-bar` with `← Back to Menu`, `END SESSION`, `Smart Diaper Terminal`, `V1 DIRECT`, `Run Demo`) was rendered above `admin.html`. This created an awkward double-header collision that clashed with `admin.html`'s native sticky cream header and controls.

---

## 2. Present

1. **Implemented Transactional Outbox Pattern in Backend**:
   - `start-server.ps1` automatically appends unique outbox events (`EVT-XXXX`) to `$state.syncOutbox` on every order creation and bin diaper disposal.
   - Added `GET /api/v1/sync/status` returning circuit breaker status (`"CLOSED"`), network status (`"STABLE"`), pending count, and event queue.
   - Added `POST /api/v1/sync/push` and `POST /api/v1/sync/batch` simulating cloud commit, marking pending events as `SYNCED` with unique cryptographic acknowledgement tokens (`ACK-XXXX`).
   - Enhanced `GET /api/v1/health` to expose `networkSync` metrics.
2. **Clean Admin Portal Isolation & Zero Header Overlap**:
   - In `run-all.html` and `index.html`, updated `selectTerminalMode(mode)`:
     - When `mode === 'admin'`, hides `.viewer-bar` so `admin.html` occupies the full viewport cleanly with its own native header, brand title, and navigation buttons.
     - When `mode !== 'admin'`, restores `.viewer-bar` display to `flex`.
   - In `returnToPage2()`, cleanly restores `.viewer-bar` state.
3. **Admin UI Cloud Sync Integration**:
   - Updated `packages/vending-frontend/public/admin.html` with title `SDDS Dual-Terminal Administrator & Telemetry Hub`.
   - Added live Cloud Outbox Queue KPI card displaying pending count and circuit breaker health.
   - Added `[⚡ Sync Now to Cloud]` button and `triggerCloudSyncPush()` JavaScript handler.

---

## 3. After

The entire edge kiosk system now operates with a true local-first transactional outbox pattern. The customer kiosk page flow remains 100% untouched and deterministic. When opening the Admin Panel, it renders seamlessly full-screen with zero header collisions, live cloud synchronization telemetry, and on-demand cloud sync push capability.
