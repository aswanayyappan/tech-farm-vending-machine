# Change Log: Fix Collection Bin OTP Entry, Keypad Slots & Global Keyboard Navigation

- **Change ID**: `CHG-20261114-0020`
- **Date**: `2026-11-14`
- **Author / Agent**: `Antigravity`
- **Target Files**:
  - `packages/bin-frontend/public/bin-kiosk.html`
  - `functions/bin/BinKiosk_updateOtpDisplay.md`
  - `functions/bin/BinKiosk_quickFillOtp.md`
  - `functions/bin/BinKiosk_handleKioskKeydown.md`
  - `functions/bin/BinKiosk_verifyAndUnlockDoor.md`
  - `functions/README.md`
  - `changes/README.md`

---

## 1. Before (Initial State & Problem Diagnosis)
- In `packages/bin-frontend/public/bin-kiosk.html`, the OTP entry stage (`viewOtp`) displayed a blank `<span id="otpField"></span>` without visual slot boxes, giving zero indication of digit cursor placement or missing slots.
- The verification submit button (`#btnSubmitOtp`) was hard-coded with the HTML attribute `disabled`. Clicking it when fewer than 6 digits were entered swallowed all click events silently, leading users in dual split simulation mode (`run-all.html`) to believe the button or the interface was completely non-responsive.
- If an incorrect OTP was submitted, the script executed native browser `alert('Verification code incorrect...')`. In modern browsers, modal alerts inside iframes can be suppressed or freeze the execution thread, causing browser deadlocks.
- There was no physical hardware or desktop keyboard listener (`keydown`). Users on desktop or laptop computers could not type numbers via keyboard into either the mobile phone registration screen (`viewMobile`) or the OTP verification screen (`viewOtp`).
- There was no 1-tap quick fill button for the simulated SMS code, forcing repeated manual digit-by-digit entry.

---

## 2. Present (Active Implementation & Rationale)
- **Visual 6-Slot OTP Display**: Replaced the plain text span with 6 discrete `.otp-cell` slot elements (`otpCell0` .. `otpCell5`) with high-contrast active and filled states.
- **1-Tap Quick Fill (`⚡ 1-Tap Fill & Unlock`)**: Added an interactive quick-fill button in the simulated SMS dispatch header box that immediately fills `otpDigits` and validates after a 350ms visual confirmation.
- **Non-Blocking In-Card Feedback**: Replaced modal `alert()` with an animated `#otpErrorBanner` and CSS `@keyframes shake` animation on the slots container.
- **Responsive Submit Action**: Removed hard `disabled` attribute from `#btnSubmitOtp`. Clicking with `< 6` digits now displays a helpful guidance banner; entering 6 digits glows emerald green and triggers verification automatically.
- **Global Hardware Keyboard Listener**: Added `window.addEventListener('keydown', ...)` handling digits `0-9`, `Backspace`, `Escape`, and `Enter` across all stages (`viewWelcome`, `viewMobile`, `viewOtp`, `viewDeposit`).
- **Mobile Stage Enhancement**: Added 1-tap `⚡ Quick Demo (+91 9876543210)` button to allow instant mobile number entry.

---

## 3. After (Verified Implementation & Impact)
- Seamless OTP verification flow in both standalone mode (`bin-kiosk.html`) and Dual Kiosk Simulator (`run-all.html`).
- Keyboard input (`0-9`, Backspace, Enter) works immediately upon focusing the iframe or window.
- Instant, non-blocking visual feedback for both successful unlock and error states without thread-blocking browser dialogs.
- 100% compliance with Rules 1, 2, 3, 4, 7, 8, 9, 10, and 11.

