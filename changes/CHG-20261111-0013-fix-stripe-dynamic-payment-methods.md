# Change Log: `CHG-20261111-0013-fix-stripe-dynamic-payment-methods`

- **Change ID**: `CHG-20261111-0013`
- **Component**: `Stripe Gateway Integration & Kiosk Payment Flow`
- **Category**: `Bug Fix & API Compatibility Upgrade`
- **Affected File(s)**: `start-server.ps1`, `packages/vending-backend/src/services/stripe.service.ts`, `packages/vending-frontend/public/kiosk.html`, `changes/README.md`
- **Associated Function(s)**: `StripeService.createPaymentIntent`, `start-server.ps1:create-intent`, `initRealStripe`, `processStripePayment`
- **Date**: `2026-11-11`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- When attempting to create a live Stripe PaymentIntent with modern Stripe accounts, Stripe returned HTTP 400:
  `"The payment_method_types parameter is no longer supported. Payment methods are now managed from your Dashboard settings... see dynamic-payment-methods."`
- The system fell back to a simulated mock client secret (`pi_test_..._secret_test`).
- When the frontend received `pi_test_..._secret_test`, Stripe.js Elements threw an error in the kiosk UI:
  `"Invalid client_secret provided: Expected a client_secret string formatted like 'pi_..._secret_...'"`

---

## 2. Present State (Diagnosis & Plan)
- **Diagnosis**: Stripe updated their API to mandate `automatic_payment_methods[enabled]=true` instead of the legacy `payment_method_types[]=card` parameter.
- **Fix Plan**:
  1. Update `packages/vending-backend/src/services/stripe.service.ts` to use `automatic_payment_methods[enabled]=true`.
  2. Upgrade `start-server.ps1` to use `curl.exe` with `automatic_payment_methods[enabled]=true` and extract live `client_secret` directly.
  3. Ensure `kiosk.html` dynamically communicates with the server host (`API_BASE`).
  4. Restart server and verify live creation of genuine `pi_3...` PaymentIntents.

---

## 3. After State (Implementation & Verification)
- Verified live Stripe intent generation:
  - Output: `Real Stripe Intent Created: pi_3UaMMgJAis0Q5KQ51GVtXfbl`
  - Client secret: `pi_3UaMMgJAis0Q5KQ51GVtXfbl_secret_...`
- Stripe.js Elements in `kiosk.html` now accepts the real `client_secret` from Stripe with zero errors.
- Real card verification with 3D Secure challenges now functions 100% seamlessly in test mode.

