# Change Record: Enterprise Software System Architecture Pipeline, Individual Subsystem Deep-Dives & Dedicated Full-Page Weight View

- **Tracking ID**: `CHG-20261120-software-pipeline-and-weight-page`
- **Timestamp**: 2026-11-20
- **Author**: Antigravity Core Agent
- **Target Systems**: `architecture/PIPELINE.md`, `run-all.html`, `index.html`, `test-suite.ps1`
- **Applicable Rules**: Rule 1, Rule 2, Rule 3, Rule 4, Rule 5, Rule 6, Rule 7, Rule 8, Rule 9, Rule 10, Rule 11

---

## 1. Before State
- `architecture/PIPELINE.md` and `#viewServerProcessing` previously focused on physical hardware and sensors (HX711 load cell, stepper coils, GPIO pins) rather than the enterprise software engineering architecture requested by the user (Redis cache, API gateway, online cloud server, microservices, database, payment webhooks, and cloud storage).
- The pipeline was presented as a single generic pipeline without individual subsystem architectures and cross-component integration mappings.
- In the Smart Bin flow, the weight calculation screen was rendered inside an overlay modal popup (`#integratedBinDepositModal`), violating the user's requirement for a dedicated full-screen page with zero popups.

---

## 2. Present State (Diagnosis & Plan)
- Completely revamped `architecture/PIPELINE.md` into an exhaustive enterprise Software Architecture & Integration Specification featuring:
  - Global End-to-End Software System Architecture.
  - Subsystem Deep-Dive Pipelines (Client Kiosk UI, API Gateway, Redis Cache & Pub/Sub, Core Microservices, Database Layer, Payment Gateway, Cloud Object Storage, and Observability).
  - Explicit Mermaid sequence diagrams for cross-system workflows (Bin Disposal to Voucher, Vending Checkout to Webhook Dispense, Real-time Dual-Kiosk Sync).
- Built `#viewBinWeightPage` as a dedicated full-page view in `run-all.html` (registered in `ALL_KIOSK_VIEW_IDS`) eliminating modal popups.
- Rewired `#viewServerProcessing` left pipeline and right demonstration terminal to reflect the 8 pure software architecture components (Redis, API Gateway, Microservices, DB, Payment Webhooks, Cloud S3).

---

## 3. After State (Verification & Impact)
- Full documentation of individual subsystems and end-to-end integration contracts.
- 100% full-page deterministic kiosk user experience:
  `Welcome (Page 1)` $\rightarrow$ `Mode Select (Page 2)` $\rightarrow$ `Bin Waste Info (Page 4)` $\rightarrow$ `Optical QR Scanner (Page 5)` $\rightarrow$ `Weight Calculation (Page 6)` $\rightarrow$ `Vending Machine (Page 3)`.
- All verification test suites passing.
