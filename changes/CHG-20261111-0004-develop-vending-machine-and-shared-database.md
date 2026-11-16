# Change Log: `CHG-20261111-0004-develop-vending-machine-and-shared-database`

- **Change ID**: `CHG-20261111-0004`
- **Component**: `Shared Database, Vending Backend & Touchscreen Kiosk UI`
- **Category**: `System Implementation`
- **Affected File(s)**: `packages/shared/*`, `packages/vending-backend/*`, `packages/vending-frontend/*`, `functions/*`
- **Associated Function(s)**: `generateBarcodeIdentifier`, `verifyBarcodeSignature`, `computeCRC16`, `Validator.*`, `DatabaseManager.*`, `MockHardwareDriver.dispense`, `RewardService.validateBarcodeForSubtotal`, `DispensingService.authorizeAndDispense`, `createApp`, `useIdleTimer`, `useBarcodeScanner`
- **Date**: `2026-11-11`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- Only PRD markdown specifications (`v1.md`, `vendingmachine_V1.md`) and initial governance rules existed.
- No software implementation had been built:
  - No shared database schemas or models existed to link the Collection Bin with the Vending Machine.
  - No cryptographic barcode signing or 7-day TTL check existed.
  - No vending backend API or ESP32 hardware driver was implemented.
  - No customer-facing touchscreen UI existed.

---

## 2. Present State (Diagnosis & Plan)
- User authorized: *"add rule the ui too , with whole clean ui needs , and develop whole things"*.
- Systematically evaluated all 11 rules:
  - Enforced memory alignment, typed connection pooling, and resource cleanup on unmount (Rule 3).
  - Clean architecture with strict TypeScript and custom AppError hierarchy (Rule 4).
  - Security-first validation, constant-time HMAC check, atomic MongoDB transactions, and CRC16 hardware frame check (Rule 8).
  - Ultra-compact module design using native `node:crypto` and minimal dependencies (Rule 9).
  - Touchscreen kiosk UI with 48-68px touch targets, full-screen advertisement carousel, category tabs, Code 128 laser modal, payment selector, live dispensing tracker, and 60s idle session auto-reset (Rule 11).

---

## 3. After State (Implementation & Verification)
1. **Shared Database & Models (`packages/shared`)**:
   - Implemented `User`, `Product`, `ProductVariant`, `InventorySlot`, `Reward`, `Order`, `DispenseCommand` types.
   - Built `DatabaseManager` with connection pooling and ACID `withTransaction()` wrapper.
   - Built cryptographic utilities with constant-time HMAC signature checks and CRC16 calculation.
   - Built lightweight runtime validator blocking NoSQL injection.
2. **Vending Backend (`packages/vending-backend`)**:
   - Implemented `ProductService` with automatic default catalogue seeding (Baby and Adult diapers).
   - Implemented `RewardService` with 7-day TTL check, single-use validation, and 50% discount safety cap.
   - Implemented `OrderService` with inventory stock verification and subtotal calculation.
   - Implemented `DispensingService` with drop sensor confirmation and atomic transaction execution.
   - Implemented `MockHardwareDriver` and `SerialHardwareDriver` with command idempotency.
   - Created Express REST API routes with centralized error boundary.
3. **Touchscreen Kiosk Frontend (`packages/vending-frontend`)**:
   - Created full-screen `AdCarousel` with auto-rotation and touch-to-start.
   - Created `CategoryFilter` with Baby vs. Adult diaper tabs and S/M/L/XL size pills.
   - Created touch-ergonomic `ProductCard` with price in ₹, brand, and stock badge.
   - Created `CartDrawer` with quantity adjusters (+ / -), subtotal, and reward line item.
   - Created `BarcodeScannerModal` with animated laser line and USB scanner keyboard listener hook.
   - Created `PaymentModal` with UPI QR code preview and countdown timer.
   - Created `DispensingModal` with real-time motor and drop sensor progress.
   - Created `useIdleTimer` and `IdleWarningModal` with 60-second inactivity session hygiene.
4. **Function Documentation & Pipeline Indexing**:
   - Fully documented all 11 core functions and hooks in [`functions/`](file:///c:/Users/Nithesh/Desktop/sdds/functions/README.md) with upstream/downstream pipeline diagrams and security analysis.

