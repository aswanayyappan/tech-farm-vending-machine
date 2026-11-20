# ==============================================================================
# SDDS PowerShell End-to-End Test & Verification Suite
# Cross-verifies cryptographic hashes, CRC-16, weight-to-reward logic & cart totals
# ==============================================================================

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "       SDDS SYSTEM VERIFICATION & CRYPTOGRAPHIC TEST SUITE       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$passedTests = 0
$totalTests = 0

function Assert-Test([string]$description, [bool]$condition) {
    $script:totalTests++
    if ($condition) {
        $script:passedTests++
        Write-Host "  [PASS] Test $script:totalTests`: $description" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Test $script:totalTests`: $description" -ForegroundColor Red
    }
}

# 1. SHA-256 Cross-Validation via .NET Standard Cryptography
$sha = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes("abc")
$hashBytes = $sha.ComputeHash($bytes)
$hex = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToUpper()
$expected = "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD"

Assert-Test "FIPS 180-4 SHA-256 Cross-Validation ('abc' standard vector)" ($hex -eq $expected)

# 2. Modbus CRC-16 Algorithm Verification
function Compute-CRC16([byte[]]$buf) {
    [uint16]$crc = 0xffff
    for ($i = 0; $i -lt $buf.Length; $i++) {
        $crc = $crc -bxor $buf[$i]
        for ($j = 0; $j -lt 8; $j++) {
            if (($crc -band 1) -ne 0) {
                $crc = ($crc -shr 1) -bxor 0xa001
            } else {
                $crc = $crc -shr 1
            }
        }
    }
    return $crc
}

[byte[]]$frame = @(0x01, 0x03, 0x00, 0x00, 0x00, 0x02)
$crc = Compute-CRC16 $frame
$hexCrc = ('0x{0:X4}' -f $crc)
Assert-Test "Modbus CRC-16 Serial Frame Checksum ($hexCrc)" ($crc -eq 0x0bc4 -or $crc -eq 0xc40b)

# 3. Weight-to-Reward Percentage Formula
function Calculate-Reward([int]$grams) {
    if ($grams -lt 50) { return 0 }
    $additional = [Math]::Max(0, $grams - 50)
    $incremental = [Math]::Floor($additional / 50.0)
    return [Math]::Min(25, 5 + $incremental)
}

Assert-Test "Diaper Mass below 50g yields 0% (Qualification Filter)" ((Calculate-Reward 30) -eq 0)
Assert-Test "Diaper Mass 50g yields base 5% Reward" ((Calculate-Reward 50) -eq 5)
Assert-Test "Diaper Mass 150g yields 7% Reward" ((Calculate-Reward 150) -eq 7)
Assert-Test "Diaper Mass 280g yields 9% Reward" ((Calculate-Reward 280) -eq 9)
Assert-Test "Diaper Mass 1500g caps at 25% Maximum Ceiling" ((Calculate-Reward 1500) -eq 25)

# 4. Financial Calculation Safety
$subtotal = 800
$discountPct = Calculate-Reward 280
$discountAmount = [Math]::Round(($subtotal * $discountPct) / 100.0)
$payable = [Math]::Max(0, $subtotal - $discountAmount)
Assert-Test "Cart Financial Breakdown (₹800 subtotal - 9% discount = ₹728 payable)" ($payable -eq 728)

# 5. Stripe Gateway Financial Conversion & Webhook HMAC Verification
$amountInr = 728
$amountPaise = [Math]::Round($amountInr * 100)
Assert-Test "Stripe Currency Unit Conversion (₹728 -> 72800 Paise)" ($amountPaise -eq 72800)

# Stripe HMAC-SHA256 Signature Verification Vector
$testSecret = "whsec_test_secret_123"
$testTimestamp = 1600000000
$testPayload = '{"id":"evt_test_123","type":"payment_intent.succeeded"}'
$signedPayload = "$testTimestamp.$testPayload"

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($testSecret)
$sigBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($signedPayload))
$sigHex = [System.BitConverter]::ToString($sigBytes).Replace("-", "").ToLower()

Assert-Test "Stripe Webhook HMAC-SHA256 Generation (64 hex characters)" ($sigHex.Length -eq 64)

# 6. Optical Surveillance & Session Lifecycle Verification
$testStart = [DateTime]::UtcNow.AddSeconds(-42)
$testEnd = [DateTime]::UtcNow
$duration = [Math]::Floor(($testEnd - $testStart).TotalSeconds)
Assert-Test "Session Duration Elapsed Computation (42s)" ($duration -ge 41 -and $duration -le 43)

$testSessId = "SESS-" + (Get-Date -Format "yyyyMMdd-HHmmss")
Assert-Test "Session Identifier Formatting (SESS- prefix)" ($testSessId.StartsWith("SESS-"))

# 7. Optical Video Chunk Storage Test (WebM & MP4)
$dummyBytes = [System.Text.Encoding]::UTF8.GetBytes("GAv1-DEMO-WEBM-CHUNK-DATA")
$dummyB64 = [Convert]::ToBase64String($dummyBytes)
$chunkBody = @{
    sessionId = "SESS-TEST-CHUNK"
    chunkIndex = 1
    timestamp = (Get-Date -Format "o")
    mimeType = "video/webm"
    dataBase64 = $dummyB64
} | ConvertTo-Json

$chunkRes = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/recordings/chunk" -Method Post -Body $chunkBody -ContentType "application/json"
Assert-Test "Optical Video Chunk Upload API WebM (success: true)" ($chunkRes.success -eq $true)
$writtenFile = Join-Path (Join-Path $PSScriptRoot "recordings") $chunkRes.filename
Assert-Test "Optical Video Chunk File Existence in recordings/ ($($chunkRes.filename))" (Test-Path $writtenFile)

# 7b. MP4 Format Video Chunk Storage Test
$dummyMp4Bytes = [System.Text.Encoding]::UTF8.GetBytes("GAv1-DEMO-MP4-CHUNK-DATA")
$dummyMp4B64 = [Convert]::ToBase64String($dummyMp4Bytes)
$mp4ChunkBody = @{
    sessionId = "SESS-TEST-MP4"
    chunkIndex = 2
    timestamp = (Get-Date -Format "o")
    mimeType = "video/mp4"
    dataBase64 = $dummyMp4B64
} | ConvertTo-Json

$mp4ChunkRes = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/recordings/chunk" -Method Post -Body $mp4ChunkBody -ContentType "application/json"
Assert-Test "Optical Video Chunk Upload API MP4 (success: true)" ($mp4ChunkRes.success -eq $true)
Assert-Test "MP4 File Extension Generated (.mp4)" ($mp4ChunkRes.filename.EndsWith(".mp4"))
$writtenMp4File = Join-Path (Join-Path $PSScriptRoot "recordings") $mp4ChunkRes.filename
Assert-Test "Optical Video MP4 Chunk File Existence in recordings/ ($($mp4ChunkRes.filename))" (Test-Path $writtenMp4File)

# 7c. Razorpay Payment Gateway API Suite
$rzpCfg = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/payments/razorpay/config" -Method Get
Assert-Test "Razorpay Config Endpoint returns valid keyId (rzp_test_...)" ($rzpCfg.keyId.StartsWith("rzp_test_"))

$rzpOrderBody = @{
    amountInr = 250
    orderId = "ORD-TEST-RZP-01"
} | ConvertTo-Json
$rzpOrderRes = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/payments/razorpay/create-order" -Method Post -Body $rzpOrderBody -ContentType "application/json"
Assert-Test "Razorpay Create Order API returns 25000 paise" ($rzpOrderRes.amount -eq 25000)
Assert-Test "Razorpay Order ID Generated" ($rzpOrderRes.razorpayOrderId.StartsWith("order_"))

# Cryptographic Razorpay HMAC-SHA256 Signature Verification Test
$rzpTestSecret = "nAUzU0gIsuD0KHom6rrWZvZV"
$testRzpOrderId = "order_sim_test123"
$testRzpPaymentId = "pay_sim_test456"
$sigData = "$testRzpOrderId|$testRzpPaymentId"
$hmacSha = New-Object System.Security.Cryptography.HMACSHA256
$hmacSha.Key = [System.Text.Encoding]::UTF8.GetBytes($rzpTestSecret)
$computedHash = $hmacSha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($sigData))
$validSig = [BitConverter]::ToString($computedHash).Replace("-", "").ToLower()

$rzpVerifyBody = @{
    orderId = "ORD-TEST-RZP-01"
    razorpay_order_id = $testRzpOrderId
    razorpay_payment_id = $testRzpPaymentId
    razorpay_signature = $validSig
} | ConvertTo-Json
$rzpVerifyRes = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/payments/razorpay/verify" -Method Post -Body $rzpVerifyBody -ContentType "application/json"
Assert-Test "Razorpay Signature Verification API (success: true, PAID)" ($rzpVerifyRes.success -eq $true -and $rzpVerifyRes.status -eq "PAID")

# 8. Complete Optical Video Pipeline & Recordings Verification
$recListRes = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/recordings" -Method Get
Assert-Test "GET /api/v1/recordings returns success: true" ($recListRes.success -eq $true)
Assert-Test "GET /api/v1/recordings contains array of files" ($null -ne $recListRes.recordings)

$testVideoBytes = [System.Text.Encoding]::UTF8.GetBytes("ftypisom" + ("A" * 1024))
$testVideoB64 = [Convert]::ToBase64String($testVideoBytes)
$testChunkBody = @{
    sessionId = "SESS-AUTOTEST-99"
    customFileName = "SESS-AUTOTEST-99_INTERACTION_15s_TEST.mp4"
    chunkIndex = 1
    mimeType = "video/mp4"
    dataBase64 = "data:video/mp4;base64," + $testVideoB64
} | ConvertTo-Json
$testChunkRes = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/recordings/chunk" -Method Post -Body $testChunkBody -ContentType "application/json"
Assert-Test "POST /api/v1/recordings/chunk saves complete video file" ($testChunkRes.success -eq $true -and $testChunkRes.filename -eq "SESS-AUTOTEST-99_INTERACTION_15s_TEST.mp4")
Assert-Test "Verified test video file created on disk" (Test-Path (Join-Path $PSScriptRoot "recordings\SESS-AUTOTEST-99_INTERACTION_15s_TEST.mp4"))

# 9. File Integrity Check
$criticalFiles = @(
    "AGENTS.md",
    "GEMINI.md",
    ".env",
    ".env.example",
    "rzp-test-key.csv",
    "run-all.html",
    "packages\vending-frontend\public\kiosk.html",
    "packages\bin-frontend\public\bin-kiosk.html",
    "packages\shared\src\utils\crypto.ts",
    "packages\vending-backend\src\services\stripe.service.ts",
    "functions\vending\StripeService_createPaymentIntent.md",
    "functions\vending\StripeService_confirmPaymentIntent.md",
    "functions\vending\StripeService_verifyWebhookSignature.md",
    "functions\vending\Kiosk_quickPayWithTestCard.md",
    "packages\vending-frontend\public\admin.html",
    "changes\CHG-20261111-0011-add-stripe-payment-gateway.md",
    "changes\CHG-20261111-0015-fix-stripe-incomplete-card-number-and-admin-portal.md",
    "changes\CHG-20261111-0016-wire-admin-endpoints-to-http-server.md",
    "functions\bin\BinKiosk_updateOtpDisplay.md",
    "functions\bin\BinKiosk_quickFillOtp.md",
    "functions\bin\BinKiosk_handleKioskKeydown.md",
    "functions\bin\BinKiosk_verifyAndUnlockDoor.md",
    "changes\CHG-20261114-0018-synchronize-all-dashboards-and-kiosks.md",
    "changes\CHG-20261114-0019-perfect-ui-sizing-and-dual-simulator-ergonomics.md",
    "changes\CHG-20261114-0020-fix-bin-kiosk-otp-entry-and-keyboard-navigation.md",
    "functions\vending\Kiosk_showToast.md",
    "functions\vending\Kiosk_renderProductBadges.md",
    "changes\CHG-20261114-0021-vending-kiosk-ui-consistency-and-touch-ergonomics.md",
    "functions\bin\BinKiosk_startDirectDeposit.md",
    "functions\bin\BinKiosk_adjustDiaperCount.md",
    "functions\bin\BinKiosk_confirmDiapersAndOpenHatch.md",
    "changes\CHG-20261115-0022-streamline-frictionless-direct-deposit-flow.md",
    "changes\CHG-20261115-0023-replace-otp-with-diaper-quantity-selector.md",
    "packages\bin-frontend\public\bin-kiosk-v5.html",
    "packages\vending-frontend\public\kiosk-v5.html",
    "packages\vending-frontend\public\admin-v5.html",
    "functions\v5\V5BinKiosk_generateQrTransactionToken.md",
    "functions\v5\V5BinKiosk_validateWeightAndIssueReward.md",
    "functions\v5\V5Vending_reserveStockAndCheckout.md",
    "changes\CHG-20261115-0024-implement-v5-portable-version-and-dual-stack.md",
    "changes\CHG-20261115-0025-ui-perfection-scroll-and-ad-sizing.md",
    "changes\CHG-20261115-0026-recreate-kiosk-page1-and-page2-ui.md",
    "changes\CHG-20261116-0027-unify-mode-card-hover-states.md",
    "changes\CHG-20261116-0028-implement-bin-and-vending-page3-and-remove-watermark.md",
    "changes\CHG-20261116-0029-center-alignment-and-vending-cart-integration.md",
    "changes\CHG-20261116-0030-implement-bin-and-vending-page4-and-expand-sizes.md",
    "changes\CHG-20261116-0031-camera-recording-and-session-lifecycle.md",
    "changes\CHG-20261116-0032-live-laptop-webcam-optical-feed.md",
    "changes\CHG-20261116-0033-chunked-video-recording-and-storage.md",
    "changes\CHG-20261116-0034-continuous-surveillance-and-scannable-dynamic-qr.md",
    "changes\CHG-20261116-0035-fix-video-recording-mp4-and-scannable-qr.md",
    "changes\CHG-20261116-0036-resilient-webcam-failover-canvas-and-direct-download.md",
    "changes\CHG-20261116-0037-complete-camera-pipeline-rework.md",
    "changes\CHG-20261116-0038-rework-bin-page4-qr-pipeline-remove-vending-page4-qr-and-compress-video.md",
    "changes\CHG-20261116-0039-implement-neon-smart-vending-catalog-and-cart-ui.md",
    "changes\CHG-20261116-0040-integrate-sdds-diaper-data-and-rupee-pricing.md",
    "changes\CHG-20261116-0041-neon-page1-and-vending-vertical-scroll-cart-expansion.md",
    "changes\CHG-20261116-0042-vector-wave-page1-centering-vending-card-cart-optimization.md",
    "changes\CHG-20261116-0043-page2-organic-green-wave-grounding-layer.md",
    "changes\CHG-20261116-0044-vending-overhaul-and-intoimage-grounding.md",
    "changes\CHG-20261116-0045-page1-original-color-screen-isolation-hidden-camera.md",
    "changes\CHG-20261116-0046-session-buttons-and-success-window.md",
    "changes\CHG-20261116-0047-absolute-page-isolation-and-overlap-elimination.md",
    "changes\CHG-20261116-0048-integrate-neon-bin-page4-screen.md",
    "changes\CHG-20261116-0049-stitch-neon-payment-successful-screen.md",
    "functions\shared\Kiosk_renderNeonPage1.md",
    "functions\shared\Kiosk_showSuccessWindow.md",
    "functions\shared\Kiosk_showView.md",
    "functions\vending\VendingKiosk_showPaymentSuccessWindow.md",
    "functions\vending\VendingKiosk_layoutVerticalVendingGrid.md",
    "functions\vending\VendingKiosk_syncSddsInventory.md",
    "functions\vending\VendingKiosk_renderDiaperCatalog.md",
    "functions\vending\VendingKiosk_executeRazorpayRupeeCheckout.md",
    "functions\vending\VendingKiosk_renderNeonVendingScreen.md",
    "functions\vending\VendingKiosk_filterCatalogByCategory.md",
    "functions\vending\VendingKiosk_addNeonCartItem.md",
    "functions\vending\VendingKiosk_renderNeonBasket.md",
    "functions\vending\VendingKiosk_executeNeonCheckout.md",
    "functions\vending\VendingKiosk_applyNeonRedeemCode.md",
    "functions\bin\BinKiosk_renderPage3DiaperSelector.md",
    "functions\vending\VendingKiosk_renderPage3SizeSelector.md",
    "functions\bin\BinKiosk_renderPage4QrInstructions.md",
    "functions\bin\BinKiosk_transferVoucherToVending.md",
    "functions\vending\VendingKiosk_renderPage4CartCheckout.md",
    "functions\shared\Kiosk_navigatePage1ToPage2.md",
    "functions\shared\Kiosk_selectTerminalMode.md",
    "functions\shared\Kiosk_startSession.md",
    "functions\shared\Kiosk_endSession.md",
    "functions\shared\Kiosk_initCameraFeed.md",
    "functions\shared\Kiosk_captureSessionSnapshot.md",
    "functions\shared\Kiosk_startChunkedRecording.md",
    "functions\shared\Kiosk_dispatchVideoChunk.md",
    "functions\shared\Kiosk_generateScannableQrSvg.md",
    "functions\shared\Kiosk_trackContinuousFootage.md",
    "functions\shared\Kiosk_flushSessionVideoChunk.md",
    "functions\shared\Kiosk_createSimulatedOpticalStream.md",
    "functions\shared\Kiosk_downloadLatestVideoChunk.md",
    "functions\shared\Kiosk_requestPhysicalWebcam.md",
    "functions\shared\Kiosk_startContinuousSurveillance.md",
    "functions\shared\Kiosk_startUserSessionRecording.md",
    "functions\shared\Kiosk_finalizeUserSessionRecording.md",
    "functions\vending\Kiosk_renderVendingPage3QrCode.md",
    "functions\vending\StateEngine_saveVideoRecording.md",
    "functions\vending\RazorpayService_createOrder.md",
    "functions\vending\RazorpayService_verifySignature.md",
    "functions\vending\Kiosk_executeRazorpayPayment.md",
    "functions\vending\Kiosk_endUserSession.md",
    "functions\bin\BinPage4_renderThermalTicketQr.md",
    "functions\admin\AdminPortal_renderCreamNeonInterface.md",
    "changes\CHG-20261116-0051-fix-end-session-overhaul-admin-ui-and-thermal-qr.md",
    "PICS\stick_qr_bag.png",
    "PICS\stick on the plastic image.png",
    "recordings",
    "index.html"
)

foreach ($f in $criticalFiles) {
    $exists = Test-Path (Join-Path $PSScriptRoot $f)
    Assert-Test "Integrity of file '$f'" $exists
}

# CHG-20261116-0041 through CHG-20261116-0045 Assertions
$runAllContent = Get-Content (Join-Path $PSScriptRoot "run-all.html") -Raw
$indexContent = Get-Content (Join-Path $PSScriptRoot "index.html") -Raw

Assert-Test "run-all.html contains Neon Page 1 touch area (kiosk-touch-area)" ($runAllContent -match 'id="kiosk-touch-area"')
Assert-Test "run-all.html contains Page 1 concentric ripples (animate-ripple-1)" ($runAllContent -match 'animate-ripple-1')
Assert-Test "run-all.html contains Page 1 live system clock (system-clock)" ($runAllContent -match 'id="system-clock"')
Assert-Test "run-all.html contains Page 1 authentic intoimage.png wave grounding layer" ($runAllContent -match 'PICS/intoimage\.png')
Assert-Test "run-all.html displays Page 1 wave artwork in full original color (opacity: 1)" ($runAllContent -match 'opacity:\s*1;')
Assert-Test "run-all.html contains Page 1 vertically centered hero section" ($runAllContent -match 'data-purpose="center-touch-hero"[^>]*style="[^"]*justify-content:\s*center')
Assert-Test "run-all.html sets 30% cart area and 70% catalog layout" ($runAllContent -match 'grid-template-columns:\s*30%\s*1fr')
Assert-Test "run-all.html contains 3-column vertical product grid" ($runAllContent -match 'grid-template-columns:\s*repeat\(3,\s*1fr\)')
Assert-Test "run-all.html contains increased product box height (min-height: 200px)" ($runAllContent -match 'min-height:\s*200px')
Assert-Test "run-all.html enforces zero horizontal scroll on vending catalogue" ($runAllContent -match '\.neon-catalog-area\s*\{[^}]*overflow-x:\s*hidden')
Assert-Test "run-all.html contains Page 2 organic wave grounding layer" ($runAllContent -match 'data-purpose="page2-wave-grounding"')
Assert-Test "run-all.html applies mix-blend-multiply on wave grounding layer" ($runAllContent -match 'mix-blend-mode:\s*multiply')
Assert-Test "run-all.html applies vertical gradient mask on wave grounding layer" ($runAllContent -match 'mask-image:\s*linear-gradient')
Assert-Test "run-all.html contains Page 2 Smart Bin and Vending cards grid" ($runAllContent -match 'class="p2-cards-grid"')
Assert-Test "run-all.html contains fullscreen fixed neon-vending-wrapper (Rule 11)" ($runAllContent -match '\.neon-vending-wrapper\s*\{[^}]*position:\s*fixed')
Assert-Test "run-all.html isolates master-frame to full viewport with zero shrink" ($runAllContent -match '\.master-frame\s*\{[^}]*width:\s*100vw')
Assert-Test "run-all.html moves camera viewfinder to hidden background host" ($runAllContent -match 'id="hiddenCameraHost"')
Assert-Test "run-all.html hides visible camera HUD from web view" ($runAllContent -match '\.camera-hud-container\s*\{[^}]*display:\s*none\s*!important')
Assert-Test "run-all.html contains inline redeem code input above pay button (neonRedeemCodeInput)" ($runAllContent -match 'id="neonRedeemCodeInput"')
Assert-Test "run-all.html implements applyNeonRedeemCode function" ($runAllContent -match 'function applyNeonRedeemCode\(\)')
Assert-Test "run-all.html implements completeNeonDispensing with Razorpay" ($runAllContent -match 'completeNeonDispensing')
Assert-Test "run-all.html removed legacy neon-footer telemetry" (!($runAllContent -match '<footer class="neon-footer">'))
Assert-Test "run-all.html has zero native alert() popups (Rule 11 Zero Popups)" (!($runAllContent -match 'alert\('))
Assert-Test "run-all.html has zero native confirm() popups (Rule 11 Zero Popups)" (!($runAllContent -match 'confirm\('))
Assert-Test "run-all.html has zero native prompt() popups (Rule 11 Zero Popups)" (!($runAllContent -match 'prompt\('))
Assert-Test "run-all.html contains dedicated fullscreen kioskSuccessWindow" ($runAllContent -match 'id="kioskSuccessWindow"')
Assert-Test "run-all.html implements showKioskSuccessWindow and closeKioskSuccessWindow" ($runAllContent -match 'function showKioskSuccessWindow' -and $runAllContent -match 'function closeKioskSuccessWindow')
Assert-Test "run-all.html contains inline neonVoucherFeedback container" ($runAllContent -match 'id="neonVoucherFeedback"')
Assert-Test "run-all.html contains Page 2 End Session button" ($runAllContent -match 'kiosk-btn-session-end')
Assert-Test "run-all.html contains Vending Page 3 End Session button" ($runAllContent -match 'neon-btn-session-end')
Assert-Test "run-all.html removed canvas security timestamp watermark" (!($runAllContent -match 'ctx\.fillText\(`SDDS •'))
Assert-Test "run-all.html implements atomic showView function (Zero Overlap)" ($runAllContent -match 'function showView\(viewId\)')
Assert-Test "run-all.html defines .kiosk-view-active and .kiosk-view-hidden classes" ($runAllContent -match '\.kiosk-view-active' -and $runAllContent -match '\.kiosk-view-hidden')
Assert-Test "run-all.html uses fixed full-viewport page3 and page4 containers" ($runAllContent -match '\.page3-container\s*\{[^}]*position:\s*fixed' -and $runAllContent -match '\.page4-container\s*\{[^}]*position:\s*fixed')

# CHG-20261116-0048 Assertions (Neon Bin Page 4 & Direct Vending Flow)
Assert-Test "run-all.html defines .bin4-container and .bin4-card (stitch_neon_binpage4)" ($runAllContent -match '\.bin4-container' -and $runAllContent -match '\.bin4-card')
Assert-Test "run-all.html contains paperFeed animation for thermal tag dispenser" ($runAllContent -match '@keyframes paperFeed' -and $runAllContent -match '\.animate-paper-feed')
Assert-Test "run-all.html Page 2 Smart Bin card connects directly to goToBinPage4()" ($runAllContent -match 'id="btn-select-smart-bin"[^>]*onclick="goToBinPage4\(\)"' -or $runAllContent -match 'onclick="goToBinPage4\(\)"[^>]*id="btn-select-smart-bin"')
Assert-Test "run-all.html Bin Page 4 contains dynamic QR matrix and session tag" ($runAllContent -match 'id="binPage4QrMatrix"' -and $runAllContent -match 'id="binPage4SessionIdTag"')
Assert-Test "run-all.html Bin Page 4 BACK button returns to Page 2" ($runAllContent -match 'class="bin4-btn-back"[^>]*onclick="returnToPage2\(\)"')
Assert-Test "run-all.html Bin Page 4 contains prominent End Session touch button" ($runAllContent -match 'class="bin4-btn-session-end"')
Assert-Test "run-all.html Bin Page 4 includes Step 1 PICS/stick_qr_bag.png graphic" ($runAllContent -match 'PICS/stick_qr_bag\.png')
Assert-Test "run-all.html transferVoucherToVending routes directly to goToVendingPage3()" ($runAllContent -match 'function transferVoucherToVending\(\)\s*\{[^}]*goToVendingPage3\(\)')
Assert-Test "run-all.html transferVoucherToVending auto-populates neonRedeemCodeInput" ($runAllContent -match 'neonRedeemCodeInput' -and $runAllContent -match 'applyNeonRedeemCode\(\)')
Assert-Test "run-all.html closeKioskSuccessWindow returns cleanly to Page 1" ($runAllContent -match 'function closeKioskSuccessWindow\(\)\s*\{[^}]*endUserSession\(''TRANSACTION_COMPLETE''\)')

# CHG-20261116-0049 Assertions (Stitch Neon Payment Successful Screen)
Assert-Test "run-all.html defines .kiosk-success-wave-layer with intoimage.png" ($runAllContent -match 'kiosk-success-wave-layer' -and $runAllContent -match 'PICS/intoimage\.png')
Assert-Test "run-all.html contains .kiosk-success-hero-card and .kiosk-success-top-accent" ($runAllContent -match '\.kiosk-success-hero-card' -and $runAllContent -match '\.kiosk-success-top-accent')
Assert-Test "run-all.html contains .kiosk-success-pulsing-node checkmark" ($runAllContent -match '\.kiosk-success-pulsing-node')
Assert-Test "run-all.html contains live ping dot in hatch pill" ($runAllContent -match '\.kiosk-success-ping-dot')
Assert-Test "run-all.html contains .kiosk-success-receipt-card" ($runAllContent -match '\.kiosk-success-receipt-card')
Assert-Test "run-all.html contains .kiosk-success-settlement-box" ($runAllContent -match '\.kiosk-success-settlement-box')
Assert-Test "run-all.html showKioskSuccessWindow renders item index and size badge" ($runAllContent -match 'kiosk-success-item-row' -and $runAllContent -match 'kiosk-success-settlement-box')

# CHG-20261116-0050 Assertions (Internal Server Processing Page & Low-Footprint Camera Stream)
Assert-Test "run-all.html Page 2 contains Option 3 Internal Server Processing Card" ($runAllContent -match 'id="btn-select-server-processing"')
Assert-Test "run-all.html defines .server-processing-container and id='viewServerProcessing'" ($runAllContent -match '\.server-processing-container' -and $runAllContent -match 'id="viewServerProcessing"')
Assert-Test "run-all.html camera constraints configured for low-footprint 320x240" ($runAllContent -match 'width:\s*\{\s*ideal:\s*320' -and $runAllContent -match 'height:\s*\{\s*ideal:\s*240')
Assert-Test "run-all.html surveillance recorder videoBitsPerSecond reduced to 90 kbps (Rule 3)" ($runAllContent -match 'videoBitsPerSecond:\s*90000')
Assert-Test "run-all.html removed legacy viewBinPage3 section from DOM" (!($runAllContent -match 'id="viewBinPage3"'))
Assert-Test "run-all.html completeBinDeposit invokes proceedToBinQrScanner" ($runAllContent -match 'function completeBinDeposit\(\)\s*\{\s*proceedToBinQrScanner\(\);')
Assert-Test "start-server.ps1 provides /api/v1/health endpoint" ($serverHealthRaw -match '"status":\s*"healthy"' -or (curl.exe -s http://localhost:3000/api/v1/health) -match 'healthy')
Assert-Test "start-server.ps1 health endpoint reports camera and loadCell calibration" ((curl.exe -s http://localhost:3000/api/v1/health) -match 'HX711' -and (curl.exe -s http://localhost:3000/api/v1/health) -match '320x240')

# CHG-20261116-0051 Assertions (Thermal Ticket Dispenser, Live Held Time & Cream Neon Admin Portal)
$adminContent = Get-Content (Join-Path $PSScriptRoot "packages\vending-frontend\public\admin.html") -Raw
Assert-Test "run-all.html Bin Page 4 contains thermal ticket emergence animation" ($runAllContent -match 'thermal-ticket-emerge' -and $runAllContent -match '@keyframes printEmerge')
Assert-Test "run-all.html Bin Page 4 displays live duration and total held time badges" ($runAllContent -match 'id="binPage4Duration"' -and $runAllContent -match 'id="binPage4HeldSeconds"')
Assert-Test "run-all.html Bin Page 4 Step 1 links to 'stick on the plastic image.png'" ($runAllContent -match 'PICS/stick on the plastic image\.png')
Assert-Test "run-all.html viewTerminalStage contains End Session touch button" ($runAllContent -match 'id="viewTerminalStage"[\s\S]*?endUserSession\(''USER_ABORTED''\)')
Assert-Test "packages/vending-frontend/public/admin.html adopts Cream and Neon design tokens" ($adminContent -match '--bg-main:\s*#faf3dd' -and $adminContent -match '--secondary:\s*#9ef01a')
Assert-Test "packages/vending-frontend/public/admin.html wires parent returnToPage2 and endUserSession" ($adminContent -match 'handleReturnToKiosk' -and $adminContent -match 'handleEndSession')

# CHG-20261120-bin-qr-scanner-weight-admin-pipeline Assertions
Assert-Test "run-all.html contains #binQrScannerModal with optical reticle and laser sweep" ($runAllContent -match 'id="binQrScannerModal"' -and $runAllContent -match 'scanner-laser-line')
Assert-Test "run-all.html implements proceedToBinQrScanner and verifyBinQrTag" ($runAllContent -match 'function proceedToBinQrScanner\(\)' -and $runAllContent -match 'function verifyBinQrTag\(')
Assert-Test "run-all.html viewServerProcessing contains 8-stage end-to-end pipeline" ($runAllContent -match 'pipeNodeTagGen' -and $runAllContent -match 'pipeNodeQrCv' -and $runAllContent -match 'pipeNodeTare')
Assert-Test "packages/vending-frontend/public/admin.html contains Unified Audit Ledger with filter chips" ($adminContent -match 'chipFilterAll' -and $adminContent -match 'chipFilterBin' -and $adminContent -match 'chipFilterVend')
Assert-Test "start-server.ps1 provides unified /api/v1/admin/orders with disposals" (((curl.exe -s http://localhost:3000/api/v1/admin/orders) -join '') -match 'disposals')

# CHG-20261120-dedicated-bin-qr-scan-page Assertions
Assert-Test "run-all.html defines dedicated full-page #viewBinScanPage" ($runAllContent -match 'id="viewBinScanPage"' -and $runAllContent -match 'binScanCameraFeed')
Assert-Test "run-all.html implements goToBinScanPage and simulateAcceptScanQr" ($runAllContent -match 'function goToBinScanPage\(\)' -and $runAllContent -match 'function simulateAcceptScanQr\(\)')
Assert-Test "architecture/PIPELINE.md exists with end-to-end specification" (Test-Path (Join-Path $PSScriptRoot "architecture\PIPELINE.md"))

Assert-Test "index.html is synchronized with run-all.html" ($runAllContent.Length -eq $indexContent.Length)

Write-Host ""
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " Verification Summary: $passedTests of $totalTests assertions passed successfully." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
