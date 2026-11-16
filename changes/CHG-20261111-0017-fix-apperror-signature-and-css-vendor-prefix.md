# Change / Error Investigation Log: `CHG-20261111-0017-fix-apperror-signature-and-css-vendor-prefix`

- **Change ID**: `CHG-20261111-0017`
- **Component**: `Vending Machine Backend & Kiosk Frontend`
- **Category**: `Bug/Error Detected & Fixed`
- **Affected File(s)**: 
  - `packages/vending-backend/src/services/stripe.service.ts`
  - `packages/vending-backend/src/controllers/admin.controller.ts`
  - `packages/vending-frontend/public/kiosk.html`
- **Associated Function(s)**: `StripeService.confirmPaymentIntent`, `AdminController.verifyAdminAuth`, `.ad-headline` CSS styling
- **Date**: `2026-11-14`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- **Original Code / Behavior**:
  1. In `stripe.service.ts` and `admin.controller.ts`, `AppError` was instantiated with a numeric HTTP status code (e.g. `404`, `502`, or `401`) passed as the 2nd argument.
  2. In `kiosk.html`, the `.ad-headline` CSS class declared `-webkit-background-clip: text;` without the standard `background-clip: text;` property.
- **Identified Flaw / Missing Capability**:
  1. In `AppError`, the 2nd argument is typed as `code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR`, and the 3rd argument is `statusCode: number = 500`. Passing `404` or `401` as the 2nd argument produced TypeScript compiler error: `Argument of type '404' is not assignable to parameter of type 'ErrorCode | undefined'`.
  2. In `kiosk.html`, omitting the standard `background-clip` property triggered CSS linter warning `Also define the standard property 'background-clip' for compatibility (css-vendorprefix)`.
- **Code Snippets (Before)**:
```typescript
// stripe.service.ts L179
throw new AppError(`Stripe confirmation failure: ${err.message}`, 502);

// admin.controller.ts L48
throw new AppError('Unauthorized: Invalid or missing administrator PIN', 401);
```

```css
/* kiosk.html L330 */
.ad-headline {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 2. Present State (Diagnosis & Plan)
- **Root Cause Analysis**:
  1. `AppError` constructor parameter order is `(message, code: ErrorCode, statusCode: number, isOperational: boolean)`. The caller was omitting the `ErrorCode` enum and passing status numbers in the enum slot.
  2. CSS specification requires standard property accompaniment for vendor-prefixed properties.
- **Action Plan**:
  1. Import `ErrorCode` in `stripe.service.ts` and `admin.controller.ts`.
  2. Update all calls to pass `ErrorCode.PAYMENT_FAILED, 502` and `ErrorCode.UNAUTHORIZED, 401`.
  3. Add `background-clip: text;` to `.ad-headline` in `kiosk.html`.
- **Security & Memory Review**:
  - Memory alignment / leak risk checked: `Passed`
  - Input validation & security check: `Passed`
  - Minimal dependency footprint check: `Passed`

---

## 3. After State (Implementation & Verification)
- **Resolved Code**:
```typescript
// stripe.service.ts
throw new AppError(`Stripe confirmation failure: ${err.message}`, ErrorCode.PAYMENT_FAILED, 502);

// admin.controller.ts
throw new AppError('Unauthorized: Invalid or missing administrator PIN', ErrorCode.UNAUTHORIZED, 401);
```

```css
/* kiosk.html */
.ad-headline {
  font-size: 52px;
  font-weight: 900;
  text-align: center;
  max-width: 900px;
  line-height: 1.2;
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}
```
- **Verification & Test Results**:
  - Test suite passes all assertions.
  - Zero TypeScript compiler or CSS vendor prefix warnings.

