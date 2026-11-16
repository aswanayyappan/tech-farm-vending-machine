---
description: 11 Mandatory Rules for SDDS (Smart Diaper Collection & Vending System)
trigger: always_on
---

# SDDS Mandatory Development Rules

The agent must follow these 11 strict rules without exception:

1. **Function Documentation (`functions/`)**: Every new or altered function must be documented in a corresponding `.md` file explaining why it was added, importance, signature, and edge cases.
2. **Pipeline Integration**: Every function's place in the upstream/downstream execution pipeline must be mapped and explained.
3. **Memory Alignment**: Memory-aligned structures, zero memory leaks, buffer reuse, explicit resource cleanup.
4. **Clean Code**: Clean architecture, SOLID, strict typing, modular separation, robust custom error handling.
5. **Zero Assumptions**: Never assume. Always halt and ask the user if anything is ambiguous or unknown.
6. **Ask Before You Build**: Mandatory user review and approval before creating or modifying code.
7. **Codebase Evolution (Before, Present, After)**: Dedicated tracking file in `changes/` for every function addition, removal, or bug fix recording before, present, and after states.
8. **Security Everywhere**: Strict input validation, sanitized database queries, cryptographic OTP/barcodes, zero secrets in code, hardware boundary checks.
9. **Compact Dependencies**: Minimal dependency footprint, lean modules, zero bloat across both collection bin and vending machine systems.
10. **Rule Pre-Flight Gate**: The AI must systematically evaluate and satisfy all rules 1 through 9, and Rule 11 before implementing or altering a single line of code.
11. **Pristine, Touch-Optimized Kiosk UI**: Large touch targets (48px+), zero-clutter visual hierarchy, deterministic kiosk state machine (Ad $\rightarrow$ Catalogue $\rightarrow$ Cart $\rightarrow$ Scanner $\rightarrow$ Payment $\rightarrow$ Dispense), session auto-reset, lightweight styling.
