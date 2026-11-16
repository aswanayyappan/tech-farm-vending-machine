# Change / Error Investigation Log: `CHG-20261114-0018-synchronize-all-dashboards-and-kiosks`

- **Change ID**: `CHG-20261114-0018`
- **Component**: `Unified State Engine, Dual Kiosk Simulator Hub, Vending Kiosk, Collection Bin, Admin Portal`
- **Category**: `System Integration & Data Reconciliation`
- **Affected File(s)**:
  - `start-server.ps1`
  - `run-all.html`
  - `packages/vending-frontend/public/kiosk.html`
  - `packages/vending-frontend/public/admin.html`
  - `packages/bin-frontend/public/bin-kiosk.html`
  - `data/sdds-state.json`
- **Associated Function(s)**: `StateEngine_recordOrder`, `StateEngine_recordDisposal`, `loadInventoryFromBackend`, `refillSlot`, `finalizeReward`
- **Date**: `2026-11-14`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- **Original Code / Behavior**:
  1. `kiosk.html` had 6 products with static hardcoded stock counts (15, 12, 8, 10, 6, 5) and mismatched pricing.
  2. `admin.html` and `start-server.ps1` had 8 slots (`SLOT_A1`–`SLOT_B4`) with diverging product names and quantities (e.g. Pampers was Size M in Kiosk, but Size L in Admin; Huggies was L in Kiosk, XL in Admin).
  3. When an order was paid in `kiosk.html`, the cart was cleared, but the backend inventory was not decremented, the Gross Sales and Orders Count in `admin.html` remained stuck at ₹3,640 and 38 orders, and the transaction never appeared in the Orders Ledger.
  4. When an administrator restocked coils in `admin.html`, `kiosk.html` never updated its stock badges.
  5. When diapers were weighed and vouchers issued in `bin-kiosk.html`, the cumulative waste weight diverted from landfills and voucher count were not updated in `admin.html`.
  6. `run-all.html` lacked a real-time integration status bar.

---

## 2. Present State (Diagnosis & Plan)
- **Root Cause Analysis**:
  Absence of a shared Single Source of Truth and cross-dashboard event bus. Each web page operated in an isolated client-side memory scope.
- **Action Plan**:
  1. Build a persistent state engine in `start-server.ps1` backed by `data/sdds-state.json` with an aligned 8-slot matrix.
  2. Implement `POST /api/v1/orders/record`: automatically deducts slot stock, increments gross sales, increments orders count, and appends to the order audit ledger.
  3. Implement `POST /api/v1/bin/disposal`: records diaper mass and vouchers issued.
  4. Wire `BroadcastChannel('sdds_realtime_sync')` and `localStorage` storage event listeners across `kiosk.html`, `admin.html`, `bin-kiosk.html`, and `run-all.html`.
  5. In `admin.html`, display live sales, packs dispensed, stock health %, and add environmental KPIs (kg waste recovered and vouchers issued).
  6. In `run-all.html`, add a live cross-module telemetry status bar.

---

## 3. After State (Implementation & Verification)
- **Resolved Implementation**:
  - `start-server.ps1`: Persistent state engine serving `/api/v1/inventory`, `/api/v1/orders/record`, `/api/v1/bin/disposal`, `/api/v1/admin/overview`, and `/api/v1/admin/inventory/restock`.
  - `kiosk.html`: Aligned 8-slot catalog; fetches `/api/v1/inventory` on load/focus; automatically dispatches completed orders to `/api/v1/orders/record`; broadcasts `ORDER_RECORDED`; reacts to `INVENTORY_RESTOCKED`.
  - `admin.html`: Dynamically loads live overview, slots, and orders from backend; listens to `ORDER_RECORDED` to pulse and append new transactions live; broadcasts `INVENTORY_RESTOCKED` when coils are refilled; displays diaper recovery kilograms.
  - `bin-kiosk.html`: Posts weight and voucher to `/api/v1/bin/disposal` and broadcasts `VOUCHER_ISSUED`.
  - `run-all.html`: Live telemetry bar showing Gross Sales, Packs Dispensed, Landfill Waste Diverted, Active Voucher, and real-time connectivity status.
- **Verification & Test Results**:
  - Live automated test (`scratch/test-sync.ps1`):
    - Slot A1 stock dropped from 15 to 13 on purchase.
    - Gross sales increased from ₹3,640 to ₹4,036.
    - Orders count increased from 38 to 39.
    - Diaper waste increased from 2.84 kg to 3.16 kg.
    - Vouchers issued increased from 14 to 15.
    - Slot A1 restocked back to 15.
  - Test suite (`test-suite.ps1`): 26 of 26 assertions passed (100%).

