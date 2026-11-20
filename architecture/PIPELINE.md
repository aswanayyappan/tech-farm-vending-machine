# SDDS Software System Architecture & Enterprise Pipeline Specification

> **Document Version**: 3.0.0  
> **Target Systems**: Smart Diaper Disposal System (SDDS) Dual-Kiosk Platform, Cloud Backend, Redis Cache, API Gateway, Payment Infrastructure, and Central Admin Portal.  
> **Scope**: Pure Software Architecture, Microservices, Caching Layer, Persistence Engine, Real-time Synchronization, and Security Boundaries.

---

## 1. Global Software System Architecture & Integration

The SDDS platform is architected as an event-driven, distributed kiosk software architecture designed for sub-millisecond edge response, high availability, zero memory leaks, and seamless cloud synchronization.

```mermaid
flowchart TD
    subgraph CLIENT_TIER ["1. Client Kiosk UI Tier (Touchscreen Web Runtime)"]
        UI_MAIN["Dual-Kiosk Single Page Application (HTML5 / Next.js / TypeScript)"]
        UI_RTC["WebRTC 320x240 @ 10fps Surveillance Stream Encoder"]
        UI_SYNC["BroadcastChannel('sdds_realtime_sync') Cross-Tab Bus"]
        UI_CACHE["LocalStorage Offline Fallback State Cache"]
    end

    subgraph GATEWAY_TIER ["2. API Gateway & Edge Reverse Proxy Tier"]
        GW_PROXY["Reverse Proxy & Load Balancer (Port 3000 / Nginx / Express)"]
        GW_SEC["TLS 1.3 Termination & Request Sanitization (Zod Schemas)"]
        GW_RATE["Token-Bucket Rate Limiter & Anti-DDoS Filter"]
    end

    subgraph CACHE_TIER ["3. In-Memory Cache & Pub/Sub Tier (Redis)"]
        REDIS_SESS["Redis Session & QR Token Store (TTL Expiry)"]
        REDIS_BUS["Redis Pub/Sub Realtime Cross-Kiosk Event Bus"]
        REDIS_HOT["Hot Inventory & Concurrent Lock Manager (Redlock)"]
    end

    subgraph MICROSERVICES_TIER ["4. Core Application Microservices Tier"]
        SVC_REWARD["Disposal & Dynamic Reward Engine (Formula & Minting)"]
        SVC_INV["Catalog & Slot Inventory Management Service"]
        SVC_ORDER["Order & Dispensing Lifecycle State Machine"]
        SVC_SURV["Surveillance Chunk Ingestion & Transcoding Service"]
    end

    subgraph DB_TIER ["5. Database & Persistence Tier (MongoDB / PostgreSQL)"]
        DB_PRIMARY["Primary ACID Transactional Database (PostgreSQL / MongoDB)"]
        DB_LOCAL["Edge Atomic Mutex State Engine (data/sdds-state.json)"]
    end

    subgraph PAYMENT_TIER ["6. Payment Gateway Integration Tier"]
        PG_RZP["Razorpay UPI Dynamic QR / Order Engine"]
        PG_STRIPE["Stripe Elements / PaymentIntent Engine"]
        PG_WEBHOOK["HMAC SHA-256 Webhook Cryptographic Verification"]
    end

    subgraph CLOUD_TIER ["7. Cloud Ingestion & Object Storage Tier"]
        CLOUD_S3["AWS S3 / Cloudflare R2 Optical Video Blob Storage"]
        CLOUD_TELEMETRY["MQTT / WebSocket Cloud Telemetry Forwarder"]
    end

    subgraph ADMIN_TIER ["8. Central Admin & Observability Tier"]
        ADM_PORTAL["Central Admin Web Portal (admin.html Unified Ledger)"]
        ADM_PROM["Prometheus Metrics (/api/v1/metrics) & Health (/health)"]
        ADM_GRAF["Grafana Operational Telemetry Dashboards"]
    end

    %% Tier Connections
    CLIENT_TIER -->|HTTPS / WSS| GATEWAY_TIER
    GATEWAY_TIER -->|Sub-millisecond TCP| CACHE_TIER
    GATEWAY_TIER -->|Internal REST / gRPC| MICROSERVICES_TIER
    MICROSERVICES_TIER <-->|Read / Write / PubSub| CACHE_TIER
    MICROSERVICES_TIER -->|ACID Transactions| DB_TIER
    MICROSERVICES_TIER -->|REST API / Webhooks| PAYMENT_TIER
    MICROSERVICES_TIER -->|Chunked Multipart Upload| CLOUD_TIER
    MICROSERVICES_TIER -->|Audit Events & Telemetry| ADMIN_TIER
    DB_TIER -->|Change Streams / CDC| ADMIN_TIER
```

---

## 2. Individual Subsystem Pipelines (Deep-Dive Specifications)

---

### Pipeline A: Client Kiosk Touch UI & Media Capture Pipeline

#### 1. Architecture & Operational Rationale
Operates directly on commercial touchscreen hardware (1920×1080 / 1280×800 touch kiosks). Must provide deterministic state machines, instant tap feedback, zero memory leaks, and background optical surveillance streaming.

```mermaid
flowchart LR
    Touch["Touch Input Event"] --> StateMachine["Kiosk State Machine"]
    StateMachine --> DOMRenderer["Atomic View Switcher (showView)"]
    Camera["Webcam Device"] --> CanvasCapture["320x240 Canvas Stream"]
    CanvasCapture --> MediaRecorder["MediaRecorder (WebM / MP4 @ 90kbps)"]
    MediaRecorder --> ChunkBuffer["60-Second Video Slices"]
    ChunkBuffer --> Base64Encoder["Base64 Stream Pipeline"]
    Base64Encoder --> RESTPost["POST /api/v1/recordings/chunk"]
```

#### 2. Key Architectural Components
- **Deterministic State Machine**: Mutually-exclusive views (`viewPage1`, `viewPage2`, `viewBinPage4`, `viewBinScanPage`, `viewBinWeightPage`, `viewVendingPage3`, `viewVendingPage4`, `viewServerProcessing`) governed by atomic `showView(viewId)` ensuring zero DOM overlap.
- **Ultra-Low-Footprint Optical Surveillance**:
  - Resolution locked to `320×240` at `10fps` (target bitrate: `90 kbps`).
  - Slices recorded video into 60-second chunks using `MediaRecorder.ondataavailable`.
  - Zero memory accumulation: frames streamed directly to the backend.
- **Cross-Dashboard Realtime Synchronization**:
  - `BroadcastChannel('sdds_realtime_sync')` enables instant multi-window synchronization between the customer kiosk and operator admin portal.

---

### Pipeline B: API Gateway, Security & Reverse Proxy Pipeline

#### 1. Architecture & Operational Rationale
Acts as the single secure entry point into the SDDS server cluster. Handles SSL/TLS termination, request sanitization, IP rate-limiting, and microservice route dispatching.

```mermaid
flowchart TD
    Inbound["Inbound HTTPS Client Request"] --> RateLimiter["Token-Bucket Rate Limiter (100 req/min)"]
    RateLimiter --> CORSSecurity["CORS & Origin Security Validation"]
    CORSSecurity --> TLS["TLS 1.3 Termination & HTTP/2 Decoding"]
    TLS --> InputValidator["Runtime Schema Sanitization (Zod / Validator)"]
    InputValidator --> AuthFilter["Admin PIN & Session Guard Filter"]
    AuthFilter --> Router["Reverse Proxy Dispatcher Router"]
    Router --> BinService["/api/v1/bin/* -> Disposal Service"]
    Router --> OrderService["/api/v1/orders/* -> Order Service"]
    Router --> PaymentService["/api/v1/payments/* -> Payment Gateway"]
    Router --> AdminService["/api/v1/admin/* -> Telemetry Service"]
```

#### 2. Security Boundaries & Input Sanitization
- **Strict Runtime Schemas**: Every inbound request body is validated against typed schemas (`Validator.sanitizeString`, `Validator.validateInteger`).
- **Path Traversal Defense**: All file writes in `/api/v1/recordings/chunk` are sanitized with `path.basename()` to eliminate directory traversal vulnerabilities (`../../`).
- **PIN Authentication**: Protected admin endpoints require the `X-Admin-PIN` header (constant-time verification to prevent timing attacks).

---

### Pipeline C: In-Memory Caching & Distributed Pub/Sub Pipeline (Redis)

#### 1. Architecture & Operational Rationale
Redis provides ultra-fast in-memory caching, distributed concurrency locking (Redlock), and real-time event broadcasting between edge kiosks and cloud servers.

```mermaid
flowchart LR
    subgraph REDIS_DATA_STRUCTURES ["Redis In-Memory Key Spaces"]
        Sessions["Key: 'sess:{sessionId}' (String / Hash, TTL: 300s)"]
        Tokens["Key: 'token:{qrCode}' (Hash, Single-Use Expiry)"]
        Inventory["Key: 'inv:slots' (Hash: slotId -> qty)"]
        RateLimits["Key: 'ratelimit:{ip}' (Integer Increment, TTL: 60s)"]
    end

    subgraph REDIS_PUBSUB ["Redis Pub/Sub Event Channels"]
        ChanDisp["Channel: 'sdds:disposals'"]
        ChanOrders["Channel: 'sdds:orders'"]
        ChanSync["Channel: 'sdds:inventory_sync'"]
    end

    KioskClient["Kiosk Action"] --> Sessions
    KioskClient --> Tokens
    Microservice["Backend Service"] --> ChanDisp
    Microservice --> ChanOrders
    ChanDisp --> AdminPortal["Admin Portal Live Listener"]
    ChanOrders --> AdminPortal
```

#### 2. Key Data Models & TTL Strategy
- **Session Tokens**: Keys stored with a 5-minute sliding TTL. If untouched, Redis automatically expires the session, releasing locks and garbage collecting state.
- **Single-Use Vouchers**: Stored as hashes with status flag `REDEEMED: false`. Atomic `HSETNX` prevents race conditions and double-spending across multiple vending machines.
- **Distributed Concurrency Locking**: Redlock algorithm guarantees that only one transaction can decrement a specific vending coil slot inventory at any single instant.

---

### Pipeline D: Core Business Microservices Pipeline

#### 1. Architecture & Operational Rationale
Three distinct microservices isolate business logic, reward calculation, and transaction state handling.

```mermaid
flowchart TD
    subgraph DISPOSAL_SERVICE ["Disposal & Dynamic Reward Microservice"]
        MassIn["Input Diaper Mass (g)"] --> FormulaMath["min(25%, 5% + floor((mass - 50)/50))"]
        FormulaMath --> TokenGen["Crypto Alphanumeric Generator (ECO-XX-XXXX)"]
        TokenGen --> VoucherLedger["Record Voucher Entity in DB"]
    end

    subgraph INVENTORY_SERVICE ["Catalog & Slot Inventory Microservice"]
        CatalogQuery["Catalogue Query (Baby / Adult / Size)"] --> SlotFilter["Query Operational Spiral Slots"]
        SlotFilter --> StockCheck["Check Quantity > 0"]
        StockCheck --> DecrementStock["Atomic Inventory Decrement (qty = qty - 1)"]
    end

    subgraph ORDER_SERVICE ["Order & Dispensing Lifecycle State Machine"]
        CreateOrder["POST /api/v1/orders"] --> PENDING["Status: PENDING_PAYMENT"]
        PENDING --> PaymentCallback["Webhook: Payment Verified"]
        PaymentCallback --> VERIFIED["Status: PAYMENT_VERIFIED"]
        VERIFIED --> DispenseCMD["Trigger GPIO Helical Motor"]
        DispenseCMD --> DropConfirm["IR Sensor Beam Break"]
        DropConfirm --> COMPLETED["Status: COMPLETED"]
    end
```

#### 2. Microservice Mathematical & Business Contracts
- **Dynamic Reward Engine**:
  $$R(\text{mass}) = \begin{cases} 
      0\% & \text{if } \text{mass} < 50\text{g} \\
      \min\left(25\%,\; 5\% + \left\lfloor\frac{\text{mass} - 50}{50}\right\rfloor\right) & \text{if } \text{mass} \ge 50\text{g}
  \end{cases}$$
- **Order Lifecycle States**:
  $$\text{CREATED} \longrightarrow \text{PENDING\_PAYMENT} \longrightarrow \text{PAYMENT\_VERIFIED} \longrightarrow \text{DISPENSING} \longrightarrow \text{COMPLETED}$$

---

### Pipeline E: Transactional Database & Persistence Pipeline (MongoDB / PostgreSQL)

#### 1. Architecture & Operational Rationale
Provides ACID-compliant persistence for transaction histories, financial settlements, customer disposal logs, and system audits.

```mermaid
flowchart LR
    WriteReq["Persistence Request"] --> DBConnPool["Connection Pool Manager (Max 20 Conns)"]
    DBConnPool --> TxnManager["ACID Transaction Manager"]
    TxnManager --> OrdersCol["Collection: orders (Indexed: id, status, createdAt)"]
    TxnManager --> DisposalsCol["Collection: disposals (Indexed: id, code, createdAt)"]
    TxnManager --> InventoryCol["Collection: inventory (Indexed: machineId, slotId)"]
    TxnManager --> LocalBackup["Edge Mutex Backup (data/sdds-state.json)"]
```

#### 2. Schema Models & Data Contracts
- **Order Document Schema**:
  ```typescript
  interface Order {
    id: string;               // e.g. "ORD-20261120-0091"
    machineId: string;        // e.g. "KIOSK-04"
    items: OrderItem[];       // Product items, quantities, and prices
    grossAmountInr: number;   // Gross subtotal before deductions
    discountPercent: number;  // Eco-reward voucher discount percentage
    finalPayableInr: number;  // Net settled amount paid
    paymentMethod: 'RAZORPAY_UPI' | 'STRIPE_CARD' | 'CASH';
    paymentReference: string; // Razorpay payment ID or Stripe Intent ID
    status: 'COMPLETED' | 'DISPENSING' | 'FAILED';
    createdAt: Date;
  }
  ```
- **Disposal Document Schema**:
  ```typescript
  interface DisposalRecord {
    id: string;               // e.g. "DISP-20261120-1035"
    sessionId: string;        // e.g. "SESS-8839"
    weightGrams: number;      // Calibrated diaper mass (e.g. 420g)
    discountPct: number;      // Calculated incentive percentage (e.g. 20%)
    voucherCode: string;      // Cryptographic voucher token (e.g. "ECO-20-4A91")
    redeemed: boolean;        // Settlement flag in vending catalog
    createdAt: Date;
  }
  ```

---

### Pipeline F: Payment Gateway Integration Pipeline (Razorpay / Stripe)

#### 1. Architecture & Operational Rationale
Facilitates frictionless digital payments via UPI QR codes (Google Pay, PhonePe, Paytm, BHIM) and international cards with zero unhandled webhooks.

```mermaid
flowchart TD
    CartFinal["Cart Checkout Finalized"] --> ConvertPaise["Convert Amount to Paise (₹ * 100)"]
    ConvertPaise --> RzpCreate["POST /api/v1/payments/razorpay/create-order"]
    RzpCreate --> UPI_QR["Generate Scannable Dynamic UPI QR SVG"]
    UPI_QR --> CustomerScans["Customer Scans QR on UPI Mobile App"]
    CustomerScans --> BankAuth["Bank / UPI Network Authorizes Transaction"]
    BankAuth --> Webhook["Inbound Razorpay Webhook Event: payment.captured"]
    Webhook --> HMACValidate["Verify HMAC SHA-256 Signature (Key Secret)"]
    HMACValidate --> StatusUpdate["Update Order Status -> PAYMENT_VERIFIED"]
    StatusUpdate --> TriggerDispense["Authorize Product Dispensing"]
```

#### 2. Cryptographic Security Standards
- **HMAC SHA-256 Signature Verification**:
  $$\text{Expected Signature} = \text{Crypto.createHmac}('sha256', \text{secret}).\text{update}(\text{order\_id} + "|" + \text{payment\_id}).\text{digest}('hex')$$
- **Idempotency Safeguard**: Every incoming webhook verifies whether the payment ID has already been credited to eliminate double-crediting or duplicate dispensing.

---

### Pipeline G: Cloud Surveillance & Chunked Video Ingestion Pipeline

#### 1. Architecture & Operational Rationale
Captures optical proof of proper diaper deposits and anti-vandalism surveillance without overflowing kiosk disk storage or consuming network bandwidth.

```mermaid
flowchart LR
    KioskRecorder["Client MediaRecorder"] --> Slices["60-Second WebM / MP4 Video Slices"]
    Slices --> ChunkAPI["POST /api/v1/recordings/chunk"]
    ChunkAPI --> Sanitizer["Filename Sanitization (Defend Path Traversal)"]
    Sanitizer --> LocalSpool["Local Storage Spool (recordings/)"]
    LocalSpool --> S3Uploader["Async Multipart Uploader Engine"]
    S3Uploader --> CloudS3["AWS S3 / Cloudflare R2 Cloud Storage"]
    CloudS3 --> RetentionPolicy["30-Day Auto-Expiration Lifecycle"]
```

---

### Pipeline H: Central Observability, Metrics & Admin Audit Pipeline

#### 1. Architecture & Operational Rationale
Empowers operators and machine engineers to monitor multi-kiosk health, live inventory levels, sales velocity, and diaper waste diversion metrics in real time.

```mermaid
flowchart TD
    MetricsPoller["Prometheus Metrics Poller (/api/v1/admin/metrics)"] --> Aggregator["Core Metrics Aggregator"]
    Aggregator --> SalesKPI["Gross Sales Today (₹)"]
    Aggregator --> WasteKPI["Diaper Waste Diverted (kg / g)"]
    Aggregator --> VouchersKPI["Eco-Vouchers Issued & Redeemed"]
    Aggregator --> TelemetryKPI["ESP32 Bus Latency & Hardware Pings"]
    Aggregator --> UnifiedTable["Unified System Audit Ledger (admin.html Tab 3)"]
    UnifiedTable --> FilterAll["[All System Events] Filter"]
    UnifiedTable --> FilterBin["[Smart Bin Deposits & Scans] Filter"]
    UnifiedTable --> FilterVend["[Vending Machine Orders] Filter"]
```

---

## 3. End-to-End System Integration Workflows (Sequence Diagrams)

### Workflow 1: Smart Bin Waste Intake, Optical CV Verification & Voucher Handover

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Touch Kiosk)
    participant KioskUI as Client Kiosk UI
    participant APIGW as API Gateway
    participant Redis as Redis Cache
    participant SvcBin as Bin Disposal Service
    participant Database as MongoDB / PostgreSQL

    Customer->>KioskUI: Selects Diaper Size & Specifications (viewBinPage4)
    KioskUI->>APIGW: POST /api/v1/sessions/start
    APIGW->>Redis: HSET sess:{sessionId} active=true
    KioskUI->>Customer: Prints Thermal Adhesive QR Ticket with Hold Timer
    Customer->>KioskUI: Taps "SCAN THE QR CODE →"
    KioskUI->>KioskUI: Navigates to viewBinScanPage (Live Camera Mirroring)
    Customer->>KioskUI: Holds QR Tag to Camera / Taps "Fake Accept"
    KioskUI->>APIGW: POST /api/v1/bin/verify-qr
    APIGW->>Redis: HGET token:{qrTag}
    Redis-->>APIGW: Token Validated
    APIGW-->>KioskUI: 200 OK (Unseal Hatch Solenoid)
    KioskUI->>KioskUI: Navigates to viewBinWeightPage (Dedicated Full View)
    Customer->>KioskUI: Drops Diapers on Tray
    KioskUI->>KioskUI: Load Cell Counts 0g -> 420g (Stabilized)
    KioskUI->>SvcBin: POST /api/v1/bin/disposal { weight: 420g }
    SvcBin->>SvcBin: Calculates Incentive: min(25, 5 + floor(370/50)) = 20%
    SvcBin->>SvcBin: Mints Token: ECO-20-4A91
    SvcBin->>Database: INSERT into disposals
    SvcBin->>Redis: HSET voucher:ECO-20-4A91 discount=20 redeemed=false
    SvcBin-->>KioskUI: 201 Created { voucherCode: "ECO-20-4A91", discount: "20%" }
    KioskUI->>Customer: Displays Eco-Voucher Card (20% OFF)
    Customer->>KioskUI: Taps "TRANSFER REWARD TO VENDING MACHINE (20% OFF) →"
    KioskUI->>KioskUI: Navigates to viewVendingPage3 (Voucher Pre-Applied in Basket)
```

---

### Workflow 2: Vending Catalog Purchase, Razorpay Webhook & Dispense Authorization

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant KioskUI as Vending Kiosk UI
    participant APIGW as API Gateway
    participant SvcOrder as Order Service
    participant Razorpay as Razorpay API
    participant SvcDispense as Dispensing Engine
    participant AdminPortal as Central Admin Portal

    Customer->>KioskUI: Adds Diaper Packs to Basket (Voucher 20% Applied)
    Customer->>KioskUI: Taps "PAY ₹176 WITH UPI"
    KioskUI->>APIGW: POST /api/v1/payments/razorpay/create-order { amount: 176 }
    APIGW->>SvcOrder: createOrderEntity()
    SvcOrder->>Razorpay: POST /v1/orders { amount: 17600 (Paise) }
    Razorpay-->>SvcOrder: { id: "order_K8s9f2", status: "created" }
    SvcOrder-->>KioskUI: Returns Order Entity & Dynamic QR Payload
    KioskUI->>Customer: Displays Dynamic UPI QR Code
    Customer->>Razorpay: Scans & Authorizes Payment on UPI Mobile App
    Razorpay->>APIGW: Webhook: payment.captured (HMAC SHA-256 Signed)
    APIGW->>SvcOrder: verifyWebhookSignature()
    SvcOrder->>SvcOrder: Validates HMAC SHA-256 == true
    SvcOrder->>SvcDispense: authorizeDispense(slotId: "A1")
    SvcDispense->>SvcDispense: Energize Stepper Helical Motor (360° Rotation)
    SvcDispense->>SvcDispense: IR Chute Sensor Confirms Drop Break
    SvcDispense-->>KioskUI: Dispense Confirmed
    KioskUI->>Customer: Displays Fullscreen Success Receipt Window
    SvcOrder->>AdminPortal: Broadcast: ORDER_RECORDED via BroadcastChannel
    AdminPortal->>AdminPortal: Real-Time Table Row Appended to Unified Audit Ledger
```

---

### Workflow 3: Dual-Kiosk Real-Time Cross-Sync & Operator Audit Flow

```mermaid
sequenceDiagram
    autonumber
    participant BinKiosk as Smart Bin Kiosk
    participant SyncBus as BroadcastChannel / Storage Event
    participant VendKiosk as Vending Kiosk
    participant AdminHub as Central Admin Portal (admin.html)

    BinKiosk->>BinKiosk: Customer deposits 420g -> ECO-20-4A91 Minted
    BinKiosk->>SyncBus: postMessage({ type: 'VOUCHER_ISSUED', voucher: 'ECO-20-4A91', pct: 20 })
    SyncBus-->>VendKiosk: Auto-populates Voucher into basket
    SyncBus-->>AdminHub: Updates Diaper Waste Diverted (+420g) & Vouchers Issued (+1)
    AdminHub->>AdminHub: Logs SMART BIN Event in Unified Audit Ledger
    VendKiosk->>VendKiosk: Customer completes purchase -> ORD-20261120-0091
    VendKiosk->>SyncBus: postMessage({ type: 'ORDER_RECORDED', orderId: 'ORD-20261120-0091' })
    SyncBus-->>AdminHub: Increments Gross Sales Today (+₹176) & Packs Dispensed (+1)
    AdminHub->>AdminHub: Logs VENDING Event in Unified Audit Ledger
```

---

## 4. Software Performance & Scalability Targets

| Metric | Target Specification | Enforcement Mechanism |
|---|---|---|
| **API Gateway Latency** | $< 15\text{ms}$ (99th percentile) | Asynchronous non-blocking Node.js / PowerShell I/O |
| **Redis Cache Retrieval** | $< 1.5\text{ms}$ | In-memory key-value lookups with pipelining |
| **Video Chunk Stream** | $90\text{ kbps}$ @ $320\times 240$ | Hardware-accelerated canvas transcoding |
| **Concurrent Kiosks** | Up to 100 edge nodes per gateway | Connection pooling & Redis distributed pub/sub |
| **Database Transaction Lock** | $< 25\text{ms}$ | ACID row-level locking & MongoDB document atomic writes |
| **Kiosk State Transition** | $60\text{ fps}$ smooth CSS animations | Hardware-accelerated transforms & zero layout thrashing |
| **Session Inactivity Timeout** | $60\text{ seconds}$ deterministic reset | Background watchdog clearing sensitive state |
