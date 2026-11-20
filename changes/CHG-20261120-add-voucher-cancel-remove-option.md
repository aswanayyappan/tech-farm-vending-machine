# Change / Error Investigation Log: `CHG-20261120-add-voucher-cancel-remove-option`

- **Change ID**: `CHG-20261120-001`
- **Component**: `Vending Machine Touchscreen Kiosk UI & Financial State Engine`
- **Category**: `Function Added & UI Ergonomics Enhancement`
- **Affected File(s)**: `run-all.html`, `index.html`, `test-suite.ps1`
- **Associated Function(s)**: `removeNeonRedeemCode()`, `removePage4PromoCode()`, `applyNeonRedeemCode()`, `renderNeonBasket()`, `applyPage4PromoCode()`
- **Date**: `2026-11-20`
- **Status**: `Resolved & Verified`

---

## 1. Before State
- **Original Code / Behavior**:
  - In `run-all.html` (Vending Page 3 slide-out cart drawer and Vending Page 4 Billing & Promotion card), entering or pasting a voucher code applied a discount immediately (`applyNeonRedeemCode()` / `applyPage4PromoCode()`).
- **Identified Flaw / Missing Capability**:
  - Once a code was applied, there was no cancellation or removal option.
  - If a user entered an incorrect code, wished to remove a promo code, or test another code, they were unable to cancel the applied redemption, locking the cart in a discounted state until the entire session was aborted.
- **Code Snippet (Before)**:
```html
<div class="neon-voucher-box">
  <input type="text" id="neonRedeemCodeInput" placeholder="ENTER REDEEM CODE">
  <button type="button" onclick="applyNeonRedeemCode()">APPLY</button>
</div>
```

---

## 2. Present State (Diagnosis & Plan)
- **Root Cause Analysis**:
  - The voucher submission UI only included an "APPLY" action without a corresponding cancellation handler or remove button.
- **Impact Assessment**:
  - Vending Page 3 (Neon Cart Drawer) and Vending Page 4 (Billing card) require dedicated cancel/remove controls with touch target sizing ($\ge 48\text{px}$) per Rule 11.
- **Action Plan**:
  1. Add `#btnNeonRemoveVoucher` and inline `[✕ Remove]` button in `#neonVoucherRow`.
  2. Implement `removeNeonRedeemCode()` to reset voucher percentages, clear input, restore full price, and update inline feedback.
  3. Add `#btnVendingPage4RemovePromo` and implement `removePage4PromoCode()`.
  4. Ensure complete synchronization between `run-all.html` and `index.html`.
  5. Add test assertions to `test-suite.ps1` and verify with automated execution.
- **Security & Memory Review**:
  - Memory alignment / leak risk checked: `Passed (Timer cleared before assignment, zero detached DOM leaks)`
  - Input validation & security check: `Passed`
  - Minimal dependency footprint check: `Passed (Vanilla JS & HTML5)`

---

## 3. After State (Implementation & Verification)
- **New Code / Resolved Behavior**:
  - `removeNeonRedeemCode()` resets `window.binDepositVoucherPercent = 0`, `window.binDepositVoucherCode = null`, clears the input, hides the voucher row, toggles the button from REMOVE to APPLY, and recalculates the basket.
  - Inline remove chip inside `#neonVoucherRow` allows 1-tap cancellation directly from the price breakdown.
  - `removePage4PromoCode()` on Page 4 resets `currentDiscountPct = 0` and recalculates financials back to standard pricing.
- **Verification & Test Results**:
  - Tested via `test-suite.ps1` checking DOM elements `#btnNeonRemoveVoucher`, `#btnVendingPage4RemovePromo`, and function signatures `removeNeonRedeemCode` and `removePage4PromoCode`.
- **Documentation Updated**:
  - Function doc added in `functions/vending/removeNeonRedeemCode.md`: `Yes`
  - Function doc added in `functions/vending/removePage4PromoCode.md`: `Yes`
  - Pipeline connection validated: `Yes`
