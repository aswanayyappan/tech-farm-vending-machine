# Change Log: `CHG-20261111-0005-fix-crypto-ts-type-and-import-errors`

- **Change ID**: `CHG-20261111-0005`
- **Component**: `Shared Subsystem / Cryptographic Utilities`
- **Category**: `Bug/Error Detected & Fixed`
- **Affected File(s)**: `packages/shared/src/utils/crypto.ts`, `packages/shared/src/index.ts`, `tsconfig.json`, `packages/shared/tsconfig.json`, `functions/shared/computeCRC16.md`
- **Associated Function(s)**: `generateBarcodeIdentifier`, `verifyBarcodeSignature`, `computeCRC16`
- **Date**: `2026-11-11`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- In `packages/shared/src/utils/crypto.ts`:
  1. `process` was referenced globally (`process.env.SDDS_HMAC_SECRET`) without explicit import from `'node:process'` or environment guard, causing TypeScript `Cannot find name 'process'` in environments without ambient `@types/node`.
  2. `Buffer` was referenced directly without explicit import from `'node:buffer'`, causing `Cannot find name 'Buffer'`.
  3. `computeCRC16` required a `Buffer` parameter rather than standard `Uint8Array`, limiting cross-environment compatibility.
  4. Relative import `import { ValidationError } from '../errors/app-error.js'` caused IDE TypeScript resolution errors when opened in editor without compiled `.js` files present on disk.
  5. The root workspace lacked a root `tsconfig.json` to instruct the IDE's TypeScript language server on monorepo package resolutions.

---

## 2. Present State (Diagnosis & Plan)
- Root Cause Analysis:
  - Missing explicit imports from `node:buffer` and `node:process`.
  - Extension `.js` in TypeScript source files before compilation causes unresolved module warnings in editor.
  - Monorepo root lacks TypeScript configuration for IDE discovery.
- Action Plan:
  1. Explicitly import `Buffer` from `'node:buffer'` and `process` from `'node:process'`.
  2. Use runtime guard for `process?.env?.SDDS_HMAC_SECRET`.
  3. Support `Uint8Array` in `computeCRC16(buffer: Uint8Array): number` for universal memory-aligned byte array compatibility.
  4. Change import to `from '../errors/app-error'` and provide root `tsconfig.json` with `moduleResolution: "bundler"` for clean IDE resolution.
  5. Update `functions/shared/computeCRC16.md` documentation.

---

## 3. After State (Implementation & Verification)
- Added explicit imports `import { Buffer } from 'node:buffer'` and `import process from 'node:process'`.
- Safe `SECRET_KEY` initialization with type guard: `typeof process !== 'undefined' && process.env && process.env.SDDS_HMAC_SECRET ? process.env.SDDS_HMAC_SECRET : ...`.
- Refactored `computeCRC16` parameter to `buffer: Uint8Array`, seamlessly supporting `Buffer` and standard typed byte arrays without global type dependencies.
- Normalized relative module import to `import { ValidationError } from '../errors/app-error'`.
- Created root `tsconfig.json` with `moduleResolution: "bundler"` and paths mapping for `@sdds/shared`.
- Updated function documentation in `functions/shared/computeCRC16.md`.
- Verified file is clean, strictly typed, and error-free.
