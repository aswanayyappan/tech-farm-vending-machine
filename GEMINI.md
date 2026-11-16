# Agent Rules & Architecture Protocol

> **CRITICAL DIRECTIVE**: The agent must strictly adhere to the following 11 mandatory rules across all interactions, plans, code generation, refactoring, and file modifications in this workspace.

---

## The 11 Core Rules

### Rule 1: Mandatory Function Documentation in `functions/`
- Every single function added to any part of the codebase (backend, frontend, hardware drivers, utilities, services) MUST be documented in an individual Markdown file under `functions/` (e.g., `functions/<module>/<function_name>.md`).
- Each function documentation file must include:
  1. **Why Added**: Exact problem, context, and operational rationale for adding the function.
  2. **Importance & Criticality**: Why this function is essential, consequences if it fails, and business/hardware importance.
  3. **Signature & Contracts**: Inputs, outputs, parameter types, return values, errors thrown.
  4. **Behavior & Logic**: Step-by-step internal execution flow, edge cases, and fallback handling.

### Rule 2: Pipeline Integration & End-to-End Connection Mapping
- For every function documented and created, explicitly diagram and explain its position in the system pipeline:
  1. **Upstream Callers / Data Sources**: What triggers or feeds data into this function (e.g., HTTP request, hardware sensor interrupt, weight scale reading, barcode scan event).
  2. **Downstream Targets / Consumers**: What this function calls or passes data to (e.g., database write, payment gateway API, dispensing GPIO pin, UI state updater).
  3. **Transformation Pipeline**: How data flows from input to output across intermediate components.
  4. A clear textual or Mermaid flow diagram showing upstream $\rightarrow$ function $\rightarrow$ downstream.

### Rule 3: Memory Alignment & Zero-Waste Resource Management
- Write memory-aligned, cache-friendly, and resource-efficient code suitable for production and resource-constrained environments (Raspberry Pi, ESP32, lightweight Node.js/browser runtimes):
  1. Proper data structure packing and byte alignment where applicable (buffers, typed arrays, struct-like objects).
  2. Zero memory leaks: explicitly unbind event listeners, close database cursors, release timers, close serial/GPIO ports, and clear active sockets.
  3. Avoid unnecessary object cloning, deep copies, and large in-memory allocations; prefer streams, references, and iterators.
  4. Optimize garbage collection overhead by reusing buffers and avoiding short-lived high-frequency allocations in tight loops.

### Rule 4: Clean, Disciplined Code Quality
- All code must follow pristine Clean Architecture and SOLID design principles:
  1. **Self-Documenting & Explicit**: Strict, descriptive naming for variables, functions, and files. No cryptic abbreviations.
  2. **Strict Typing**: Use strict TypeScript / typed schema definitions across all boundaries.
  3. **Modularity & Separation of Concerns**: Strict boundary separation between routes/controllers, business logic (services), database access (repositories), and hardware communication drivers.
  4. **Robust Error Handling**: Standardized custom error classes, complete try/catch boundaries, informative logging, and zero unhandled rejections. Dead code or commented-out debris is prohibited.

### Rule 5: Zero Assumptions — Never Guess
- **NEVER** guess or assume unspecified business logic, hardware configurations, pinouts, payment gateway contracts, or requirements:
  1. If any requirement, data model, or integration parameter is ambiguous, unconfirmed, or unknown: **HALT and ASK**.
  2. Explicitly surface the question with options and trade-offs to the user.
  3. Proceed only after obtaining verified clarification.

### Rule 6: Mandatory Approval Before Building (Ask Before You Build)
- **NEVER** start writing, generating, or modifying code blindly:
  1. Present the implementation proposal first: architectural design, file modifications, function list, data flow, and dependency footprint.
  2. Ask for the user's explicit consent before creating or altering code files.
  3. Build step-by-step only upon user approval.

### Rule 7: Granular State & Evolution Tracking (Before, Present, After)
- Every time a function is added, modified, refactored, or removed, or whenever a bug/error is detected:
  1. Record the change in a dedicated log file inside `changes/` (e.g., `changes/CHG-YYYYMMDD-<name>.md`).
  2. The record must document three distinct temporal states:
     - **Before**: What existed previously, the initial behavior, or the detected error/flaw.
     - **Present**: The diagnosis, active work, rationale for the alteration, and current status.
     - **After**: The resulting implementation, verified behavior, and system impact.
  3. Maintain full visibility so any agent or engineer can understand the complete lifecycle and history of the codebase.

### Rule 8: Security-First Architecture on Every Line of Code
- Security must be baked into every single layer, action, and line of code:
  1. **Input Validation & Sanitization**: Validate all inputs at runtime (Zod/schemas) for APIs, QR/barcode scans, and user forms. Prevent injection (SQL/NoSQL), XSS, and SSRF.
  2. **Authentication & Sensitive Operations**: Secure OTP handling, time-limited tokens, tamper-proof barcode hashing, and cryptographic signing.
  3. **Zero Hardcoded Secrets**: Use strictly configured environment variables (`.env`) with `.env.example` templates.
  4. **Hardware & Peripheral Safety**: Validate sensor bounds (e.g., negative weight detection, sensor timeout handling, motor stall protection), frame checksums for serial communication, and debounced GPIO signals.
  5. **Financial & Dispensing Integrity**: Atomic transactions for balance/reward deductions; idempotent order processing to prevent duplicate dispensing.

### Rule 9: Compact & Lean Dependency Footprint
- Keep both systems (Collection Bin & Vending Machine) ultra-lightweight:
  1. Select only compact, battle-tested, minimal-dependency packages. Avoid bloated multi-megabyte dependencies when built-in modules (`node:crypto`, `node:fs`, `node:stream`, standard Web APIs) or lightweight alternatives suffice.
  2. Audit dependency trees to keep bundle sizes minimal, startup times rapid, and vulnerability attack surface tiny.
  3. Shared models and utilities must be factored into reusable compact modules between both applications.

### Rule 10: Comprehensive Rule Pre-Flight Verification Before Single Line of Code
- **MANDATORY ENFORCEMENT BEFORE CODE GENERATION**:
  1. Before implementing, generating, or modifying even a single line of code in any file, the AI MUST systematically evaluate and satisfy the entire set of Rules 1 through 9, and Rule 11.
  2. The agent must verify:
     - **Rule 1 & 2 Preparedness**: Function documentation and pipeline integration map identified.
     - **Rule 3 & 4 Quality**: Memory alignment, zero memory leaks, clean typing, and modularity guaranteed.
     - **Rule 5 & 6 Authorization**: Zero assumptions made, and explicit user approval obtained for the proposed design.
     - **Rule 7 Tracking**: Evolution changelog entry created/staged.
     - **Rule 8 Security**: Every line checked for input sanitization, safe execution, and auth boundaries.
     - **Rule 9 Lean Footprint**: Dependencies checked for minimum weight and zero bloat.
     - **Rule 11 UI Quality**: Touchscreen ergonomics, zero-clutter layout, and robust state feedback verified.
  3. Writing, generating, or altering code without passing this complete pre-flight verification is strictly prohibited.

### Rule 11: Pristine, Touch-Optimized Kiosk UI & Clean Visual Hierarchy
- The customer-facing frontend operates on a public touch display (kiosk). It must adhere to elite UI standards:
  1. **Touch Ergonomics & Accessibility**: Large interactive touch targets (minimum 48×48px, 64px+ for primary actions), comfortable thumb/hand reach zones, clear high-contrast typography, and intuitive haptic/visual button tap feedback.
  2. **Zero-Clutter Visual Clarity**: Modern, minimalist, and distraction-free design system. Clean card layouts for baby and adult diaper variants, crisp product imagery, visible badge status for stock availability, and large currency formatting (₹).
  3. **Deterministic Kiosk State Machine**: Explicit states for all screens:
     - **Idle / Welcome**: Full-screen auto-rotating advertisement carousel with a prominent "Touch to Start" call-to-action.
     - **Catalogue & Filtering**: Smooth category tabs (Baby Diapers, Adult Diapers), brand filtering, and size badges (S, M, L, XL).
     - **Interactive Cart**: Slide-out / persistent cart drawer displaying itemized subtotal, quantity adjusters, and empty-state messaging.
     - **Barcode Scanner Modal**: Clear animated scanning target, real-time Code 128 feedback, validation spinners, and green/red discount indicator.
     - **Checkout & Payment**: Clean payment options (UPI QR / Card / Cash), dynamic reward discount line item, and live timer.
     - **Dispensing & Success**: Real-time progress tracker, motor status indicator, item collection alert, and automatic session cleanup countdown.
  4. **Kiosk Session Hygiene**: Configurable idle session timeout (auto-reset to advertisement mode if untouched for 60 seconds) with an audible/visual grace prompt to protect customer privacy and clear abandoned shopping carts.
  5. **Ultra-Lightweight CSS & Component Modularity**: Zero runtime CSS bloat. Use clean, modular components, strict TypeScript props, zero memory leaks on page transitions, and smooth 60fps transitions without heavy animation libraries.

---

## Directory Organization Enforced by Rules

```
sdds/
├── AGENTS.md                  # Master agent instructions (Root)
├── GEMINI.md                  # Master agent instructions (Root)
├── functions/                 # Rule 1 & 2: Function markdown documentation
│   ├── README.md              # Index of all functions
│   ├── TEMPLATE.md            # Standard function documentation template
│   ├── bin/                   # Collection bin functions
│   ├── vending/               # Vending machine functions
│   └── shared/                # Shared utilities & database functions
├── changes/                   # Rule 7: State & evolution tracking
│   ├── README.md              # Index of all changes and error logs
│   ├── TEMPLATE.md            # Before-Present-After tracking template
│   └── CHG-XXXX-*.md          # Individual change/incident logs
├── docs/                      # Architectural specifications & PRDs
│   ├── v1.md                  # Collection bin PRD
│   └── vendingmachine_V1.md   # Vending machine PRD
└── packages/                  # Production Source Monorepo
    ├── shared/                # Shared DB models, schemas, and types
    ├── vending-backend/       # Express + TypeScript API server & hardware driver
    └── vending-frontend/      # Next.js Touchscreen Kiosk UI
```
