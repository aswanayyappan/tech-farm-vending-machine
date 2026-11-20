# CHG-20261120: Synchronize SDDS V5 Documents with Current Web Architecture

**Date:** 2026-11-20  
**Author:** AI Engineering Assistant  
**Status:** COMPLETED  
**Affected Files:**
- `SDDS_V5_Documents/SDDS_V5_Product_Requirements_Document.md`
- `SDDS_V5_Documents/SDDS_V5_Plan_of_Action.md`

---

## 1. Before

The documents in `SDDS_V5_Documents/` reflected an early conceptual specification that diverged from the production-grade web application running in `run-all.html`, `start-server.ps1`, and `architecture/PIPELINE.md`:
1. **Camera Usage Scope**: Stated that the USB webcam was exclusively for session recording and all computer vision was removed, omitting the camera's active operational use for live optical QR viewfinder display on `#viewBinScanPage`.
2. **Bin Workflow & Screen States**: Described a generic modal or single-screen sequence where the QR scan and weight measurement occurred in modal popups or generic containers with automated timeouts.
3. **Customer Confirmation**: Lacked customer-driven manual confirmation (`confirmAndVerifyBinQr()`) and pictorial 3-step bag preparation guides.
4. **Reward Settlement & Transition**: Did not document the dedicated full-page `#viewBinWeightPage` or the one-touch transfer button directly populating the discount into Vending Page 3 (`goToVendingPage3()`).
5. **Payment Processing**: Mentioned only a generic sandbox payment gateway, omitting the dual payment gateway architecture (**Stripe** for credit/debit cards with 3D Secure & HMAC-SHA256 webhooks, and **Razorpay** for instant dynamic UPI QR generation with paise conversion).
6. **Internal Software Processing Topology**: Omitted the 8-stage pure software architecture and the interactive inspector (`#viewServerProcessing`).
7. **Admin Portal**: Did not describe the Unified Audit Ledger combining vending orders and bin disposals with filter chips and chunked video playback.
8. **Mermaid Flowcharts**: Contained simplified legacy flowcharts that did not reflect the actual state transitions and dedicated kiosk screens.

---

## 2. Present

Updated both `SDDS_V5_Product_Requirements_Document.md` and `SDDS_V5_Plan_of_Action.md` to establish complete parity with the current web architecture:
1. **Camera Dual Roles Documented**:
   - Clarified that while facial biometrics, mask detection, and AI object classification remain strictly out of scope, the optical camera actively provides the live 320x240 @ 10fps viewfinder with HUD laser sweeping reticle on `#viewBinScanPage` so customers can align the adhesive QR tag on their plastic bag.
   - Documented forensic CCTV session recording chunk streaming (`POST /api/v1/recordings/chunk` at 90 kbps) saving to local `recordings/`.
2. **Bin State Machine Parity**:
   - Documented Bin Page 4 (`viewBinPage4`): Diaper sizing (S, M, L, XL, Adult) + quantity steppers, thermal adhesive QR ticket printing with paper emergence animation and live hold timer.
   - Documented Dedicated Full-Page Optical QR Verification (`viewBinScanPage`): Live camera viewfinder, 3-step pictorial guide (`PICS/stick on the plastic image.png`, camera positioning 15-20cm, solenoid unseal latch), manual customer confirmation (`[✓ CONFIRM QR CODE & UNSEAL HATCH →]` via `confirmAndVerifyBinQr()`), and simulation bypass (`[⚡ FAKE ACCEPT / SIMULATE SCAN QR]` via `simulateAcceptScanQr()`).
   - Documented Dedicated Full-Page Mass Calculation (`viewBinWeightPage`): HX711 load cell settling (420g), dynamic formula discount calculation (20% Eco-Voucher `ECO-20-XXXX`), and primary CTA button `[TRANSFER REWARD TO VENDING MACHINE (20% OFF) →]` transitioning directly to Vending Page 3 (`goToVendingPage3()`) with the voucher pre-applied in the cart drawer.
3. **Dual Payment Gateways**:
   - Fully documented Stripe (Card payments, 3D Secure simulation, test card quick-pay, webhook HMAC-SHA256 signature verification).
   - Fully documented Razorpay (Instant dynamic UPI QR generation with paise conversion, order creation API, UPI app scan simulation, and signature verification).
4. **Internal Software Processing Inspector (`viewServerProcessing`)**:
   - Fully documented the 8-stage pure software pipeline (Cloudflare Edge WAF, Redis 7.2 cluster with Redlock, FIPS 180-4 SHA-256 + Zod validation, dual payment gateway, PostgreSQL 16 ACID store, BullMQ async queues, Modbus CRC-16 hardware broker, Unified Audit Ledger).
5. **Admin Portal**:
   - Documented the Unified Audit Ledger with filter chips (`All`, `Vending Only`, `Bin Disposals Only`), real-time hardware telemetry, and video chunk playback.
6. **Mermaid Flowcharts**:
   - Completely synchronized system architecture, Bin workflow, Vending workflow, session video recording pipeline, and added the software processing topology flowchart across both documents.

---

## 3. After

Both foundational V5 specification documents (`SDDS_V5_Product_Requirements_Document.md` and `SDDS_V5_Plan_of_Action.md`) now accurately represent the live production codebase and enterprise software pipeline without any architectural discrepancies or missing features. Automated tests continue to pass 100%.
