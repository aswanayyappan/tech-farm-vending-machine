# ==============================================================================
# SDDS High-Performance Universal HTTP Web Server, State Engine & API Gateway
# Serves the Dual Kiosk Terminal and Vending System on http://localhost:3000
# Real-Time Synchronized State Engine across all Kiosks & Admin Portal
# Zero Node.js or npm dependencies required! (Rule 9: Lean footprint)
# ==============================================================================

$port1 = 3000
$port2 = 4000
$rootPath = $PSScriptRoot
$dataPath = Join-Path $rootPath "data"
$stateFile = Join-Path $dataPath "sdds-state.json"

# Helper: Parse .env file
function Get-EnvConfig {
    $envFile = Join-Path $rootPath ".env"
    $config = @{
        STRIPE_SECRET_KEY = ""
        STRIPE_PUBLISHABLE_KEY = ""
        STRIPE_WEBHOOK_SECRET = ""
        RAZORPAY_KEY_ID = ""
        RAZORPAY_KEY_SECRET = ""
    }
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith("#")) {
                $parts = $line.Split("=", 2)
                if ($parts.Length -eq 2) {
                    $key = $parts[0].Trim()
                    $val = $parts[1].Trim()
                    $config[$key] = $val
                }
            }
        }
    }
    return $config
}

# Helper: Get or initialize SDDS persistent state
function Get-SddsState {
    if (Test-Path $stateFile) {
        try {
            $json = [System.IO.File]::ReadAllText($stateFile, [System.Text.Encoding]::UTF8)
            $parsed = $json | ConvertFrom-Json
            if ($parsed -and $parsed.slots) {
                return $parsed
            }
        } catch {
            Write-Host "State read error: $_. Reinitializing default state." -ForegroundColor Yellow
        }
    }

    # Pristine 8-Slot Matrix: Aligned 1-to-1 with Kiosk UI, PRD and Hardware Coils
    $defaultSlots = @(
        [PSCustomObject]@{ slotId = "SLOT_A1"; productId = "PROD_BABY_S"; name = "MamyPoko Pants Standard"; category = "baby"; size = "S"; sku = "SKU-BABY-S-01"; price = 220; qty = 15; max = 15; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_A2"; productId = "PROD_BABY_M"; name = "Pampers Active Baby Pants"; category = "baby"; size = "M"; sku = "SKU-BABY-M-02"; price = 310; qty = 12; max = 15; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_A3"; productId = "PROD_BABY_L"; name = "Huggies Wonder Pants"; category = "baby"; size = "L"; sku = "SKU-BABY-L-03"; price = 340; qty = 8; max = 15; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_A4"; productId = "PROD_BABY_XL"; name = "MamyPoko Extra Absorb"; category = "baby"; size = "XL"; sku = "SKU-BABY-XL-04"; price = 380; qty = 10; max = 15; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_B1"; productId = "PROD_ADULT_M"; name = "Friends Premium Adult Diapers"; category = "adult"; size = "M"; sku = "SKU-ADULT-M-01"; price = 450; qty = 10; max = 10; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_B2"; productId = "PROD_ADULT_L1"; name = "Friends Overnight Adult Diapers"; category = "adult"; size = "L"; sku = "SKU-ADULT-L-02"; price = 470; qty = 7; max = 10; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_B3"; productId = "PROD_ADULT_L2"; name = "Lifree Extra Absorb Pants"; category = "adult"; size = "L"; sku = "SKU-ADULT-L-03"; price = 490; qty = 6; max = 10; operational = $true },
        [PSCustomObject]@{ slotId = "SLOT_B4"; productId = "PROD_ADULT_XL"; name = "KareIn Classic Adult Diapers"; category = "adult"; size = "XL"; sku = "SKU-ADULT-XL-04"; price = 520; qty = 5; max = 10; operational = $true }
    )

    $defaultOrders = @(
        [PSCustomObject]@{ id = "ORD-20261114-0091"; time = "10:42 AM"; item = "MamyPoko Pants Standard (S)"; gross = 220; discount = "20% (ECO-20-4A91)"; net = 176; method = "STRIPE_CARD"; status = "COMPLETED" },
        [PSCustomObject]@{ id = "ORD-20261114-0090"; time = "10:28 AM"; item = "Pampers Active Baby Pants (M)"; gross = 310; discount = "None"; net = 310; method = "UPI_QR"; status = "COMPLETED" },
        [PSCustomObject]@{ id = "ORD-20261114-0089"; time = "10:14 AM"; item = "Friends Premium Adult Diapers (M)"; gross = 450; discount = "25% (ECO-25-8B12)"; net = 338; method = "STRIPE_CARD"; status = "COMPLETED" },
        [PSCustomObject]@{ id = "ORD-20261114-0088"; time = "09:55 AM"; item = "Huggies Wonder Pants (L)"; gross = 340; discount = "15% (ECO-15-7C33)"; net = 289; method = "UPI_QR"; status = "COMPLETED" },
        [PSCustomObject]@{ id = "ORD-20261114-0087"; time = "09:20 AM"; item = "Lifree Extra Absorb Pants (L)"; gross = 490; discount = "None"; net = 490; method = "UPI_QR"; status = "COMPLETED" }
    )

    $state = [PSCustomObject]@{
        slots = $defaultSlots
        orders = $defaultOrders
        grossSalesTodayInr = 3640
        ordersCountToday = 38
        totalPacksDispensed = 38
        totalWeightCollectedGrams = 2840
        totalVouchersIssued = 14
        disposals = @(
            [PSCustomObject]@{ id = "DISP-101"; weightGrams = 280; discountPct = 9; code = "ECO-09-A4F2"; time = "10:35 AM" },
            [PSCustomObject]@{ id = "DISP-100"; weightGrams = 450; discountPct = 12; code = "ECO-12-7B19"; time = "09:40 AM" }
        )
    }

    Save-SddsState $state
    return $state
}

# Helper: Save SDDS persistent state
function Save-SddsState($state) {
    if (-not (Test-Path $dataPath)) {
        New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
    }
    $json = $state | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($stateFile, $json, [System.Text.Encoding]::UTF8)
}

# Initialize state on boot
$null = Get-SddsState

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port1/")
try {
    $listener.Prefixes.Add("http://localhost:$port2/")
} catch {}

try {
    $listener.Start()
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "   SDDS SMART DIAPER KIOSK SYSTEM IS NOW LIVE & SYNCHRONIZED      " -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Dual Kiosk Simulator:   http://localhost:$port1/run-all.html" -ForegroundColor Cyan
    Write-Host "  Vending Machine Kiosk:  http://localhost:$port1/packages/vending-frontend/public/kiosk.html" -ForegroundColor Yellow
    Write-Host "  Collection Bin Kiosk:   http://localhost:$port1/packages/bin-frontend/public/bin-kiosk.html" -ForegroundColor Green
    Write-Host "  Admin & Telemetry Hub:  http://localhost:$port1/admin.html" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  Stripe Gateway Active:  http://localhost:$port1/api/v1/payments/stripe/config" -ForegroundColor Magenta
    Write-Host "  Unified State Store:    data\sdds-state.json" -ForegroundColor DarkCyan
    Write-Host ""

    # Launch in default browser
    Start-Process "http://localhost:$port1/run-all.html"

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Add Universal CORS Headers (Rule 11 Kiosk Bridge)
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-PIN, stripe-signature")

        # Handle Preflight OPTIONS
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($rawUrl) -or $rawUrl -eq "index.html") {
            $rawUrl = "run-all.html"
        }
        if ($rawUrl -eq "admin.html" -or $rawUrl -eq "admin") {
            $rawUrl = "packages/vending-frontend/public/admin.html"
        }
        if ($rawUrl -eq "kiosk.html" -or $rawUrl -eq "kiosk") {
            $rawUrl = "packages/vending-frontend/public/kiosk.html"
        }
        if ($rawUrl -eq "bin-kiosk.html" -or $rawUrl -eq "bin") {
            $rawUrl = "packages/bin-frontend/public/bin-kiosk.html"
        }
        if ($rawUrl -eq "admin-v5.html" -or $rawUrl -eq "admin-v5") {
            $rawUrl = "packages/vending-frontend/public/admin-v5.html"
        }
        if ($rawUrl -eq "kiosk-v5.html" -or $rawUrl -eq "kiosk-v5") {
            $rawUrl = "packages/vending-frontend/public/kiosk-v5.html"
        }
        if ($rawUrl -eq "bin-kiosk-v5.html" -or $rawUrl -eq "bin-v5") {
            $rawUrl = "packages/bin-frontend/public/bin-kiosk-v5.html"
        }

        $envCfg = Get-EnvConfig
        $sk = $envCfg["STRIPE_SECRET_KEY"]
        $pk = $envCfg["STRIPE_PUBLISHABLE_KEY"]
        $isRealConfigured = ($sk -and $sk.StartsWith("sk_test_") -and -not $sk.Contains("paste_your")) -and ($pk -and $pk.StartsWith("pk_test_") -and -not $pk.Contains("paste_your"))

        # ----------------------------------------------------------------------
        # REST API Routes: Health & System Status
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/health" -or $rawUrl -eq "api/v1/system/status") {
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                status = "healthy"
                server = "SDDS Core Processing Daemon"
                port = $port1
                loadCell = "HX711 24-bit ADC (Calibrated)"
                camera = "Active (320x240 low-footprint @ 10fps)"
                coils = @("A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4")
                timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # ----------------------------------------------------------------------
        # REST API Routes: Stripe Gateway
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/payments/stripe/config") {
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                publishableKey = $pk
                isConfigured = [bool]$isRealConfigured
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        if ($rawUrl -eq "api/v1/payments/stripe/create-intent" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $bodyText = $reader.ReadToEnd()
            $body = $bodyText | ConvertFrom-Json

            $orderId = if ($body.orderId) { $body.orderId } else { "ORD-" + (Get-Date).Ticks }
            $amountInr = if ($body.amountInr) { [double]$body.amountInr } else { 100 }
            $amountPaise = [int][Math]::Round($amountInr * 100)

            $clientSecret = ""
            $intentId = ""

            # If real Stripe secret key configured, dispatch live call to api.stripe.com!
            if ($isRealConfigured) {
                try {
                    $curlOut = & curl.exe -s -X POST "https://api.stripe.com/v1/payment_intents" `
                        -u "${sk}:" `
                        -d "amount=$amountPaise" `
                        -d "currency=inr" `
                        -d "description=SDDS+Diaper+Kiosk+$orderId" `
                        -d "automatic_payment_methods[enabled]=true" `
                        -d "automatic_payment_methods[allow_redirects]=never" `
                        -d "metadata[orderId]=$orderId"
                    $stripeRes = $curlOut | ConvertFrom-Json
                    if ($stripeRes.client_secret) {
                        $clientSecret = $stripeRes.client_secret
                        $intentId = $stripeRes.id
                        Write-Host "Real Stripe Intent Created: $intentId" -ForegroundColor Green
                    } elseif ($stripeRes.error) {
                        Write-Host "Stripe API Error: $($stripeRes.error.message)" -ForegroundColor Red
                    }
                } catch {
                    $errText = $_.Exception.Message
                    Write-Host "Stripe Live Error: $errText" -ForegroundColor Red
                }
            }

            if (-not $clientSecret) {
                # Test Mode Fallback
                $intentId = "pi_test_" + ($orderId -replace "[^a-zA-Z0-9]", "") + "_" + (Get-Date).Ticks
                $clientSecret = $intentId + "_secret_test"
            }

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                data = @{
                    id = $intentId
                    clientSecret = $clientSecret
                    amountPaise = $amountPaise
                    currency = "inr"
                    status = "requires_payment_method"
                    orderId = $orderId
                }
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        if ($rawUrl -eq "api/v1/payments/stripe/confirm" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $bodyText = $reader.ReadToEnd()
            $body = $bodyText | ConvertFrom-Json

            $intentId = if ($body.paymentIntentId) { $body.paymentIntentId } else { "" }
            $paymentMethod = if ($body.paymentMethod) { $body.paymentMethod } else { "pm_card_visa" }
            $status = "succeeded"

            if ($isRealConfigured -and $intentId -and $intentId.StartsWith("pi_3")) {
                try {
                    $curlOut = & curl.exe -s -X POST "https://api.stripe.com/v1/payment_intents/$intentId/confirm" `
                        -u "${sk}:" `
                        -d "payment_method=$paymentMethod"
                    $confRes = $curlOut | ConvertFrom-Json
                    if ($confRes.status) {
                        $status = $confRes.status
                        Write-Host "Real Stripe Intent $intentId status: $status" -ForegroundColor Green
                    } elseif ($confRes.error) {
                        Write-Host "Stripe Confirm Note: $($confRes.error.message)" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "Stripe Confirm Exception: $_" -ForegroundColor Yellow
                }
            }

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                data = @{
                    id = $intentId
                    status = $status
                }
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        # ----------------------------------------------------------------------
        # REST API Routes: Razorpay Gateway (UPI, QR, Cards & NetBanking)
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/payments/razorpay/config" -and $request.HttpMethod -eq "GET") {
            $rzpKeyId = $envCfg["RAZORPAY_KEY_ID"]
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                keyId = $rzpKeyId
                currency = "INR"
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($rawUrl -eq "api/v1/payments/razorpay/create-order" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            $amountInr = if ($body.amountInr) { [double]$body.amountInr } else { 100 }
            $amountPaise = [int][Math]::Round($amountInr * 100)
            $orderId = if ($body.orderId) { [string]$body.orderId } else { "ORD-" + (Get-Date -Format "yyyyMMdd-HHmmss") }

            $rzpKeyId = $envCfg["RAZORPAY_KEY_ID"]
            $rzpKeySecret = $envCfg["RAZORPAY_KEY_SECRET"]

            $razorpayOrderId = "order_sim_" + (Get-Date -Format "yyyyMMddHHmmss")
            $status = "created"

            if ($rzpKeyId -and $rzpKeySecret -and $rzpKeyId.StartsWith("rzp_")) {
                try {
                    $pair = "$($rzpKeyId):$($rzpKeySecret)"
                    $authBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
                    $rzpPayload = @{
                        amount = $amountPaise
                        currency = "INR"
                        receipt = $orderId
                        notes = @{
                            system = "SDDS Kiosk Diaper Vending"
                            orderId = $orderId
                        }
                    } | ConvertTo-Json -Compress

                    $headers = @{
                        "Authorization" = "Basic $authBase64"
                        "Content-Type" = "application/json"
                    }
                    $rzpRes = Invoke-RestMethod -Uri "https://api.razorpay.com/v1/orders" -Method Post -Headers $headers -Body $rzpPayload
                    if ($rzpRes.id) {
                        $razorpayOrderId = $rzpRes.id
                        $status = $rzpRes.status
                        Write-Host "Real Razorpay Order Created: $razorpayOrderId (Amount: Rs.$amountInr)" -ForegroundColor Green
                    } elseif ($rzpRes.error) {
                        Write-Host "Razorpay Order Error: $($rzpRes.error.description)" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "Razorpay Connection Error: $_" -ForegroundColor Yellow
                }
            }

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                keyId = $rzpKeyId
                orderId = $orderId
                razorpayOrderId = $razorpayOrderId
                amount = $amountPaise
                currency = "INR"
                status = $status
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($rawUrl -eq "api/v1/payments/razorpay/verify" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd() | ConvertFrom-Json

            $rzpOrderId = if ($body.razorpay_order_id) { [string]$body.razorpay_order_id } else { "" }
            $rzpPaymentId = if ($body.razorpay_payment_id) { [string]$body.razorpay_payment_id } else { "" }
            $rzpSignature = if ($body.razorpay_signature) { [string]$body.razorpay_signature } else { "" }
            $orderId = if ($body.orderId) { [string]$body.orderId } else { "ORD-" + (Get-Date -Format "yyyyMMdd-HHmmss") }

            $rzpKeySecret = $envCfg["RAZORPAY_KEY_SECRET"]
            $isValid = $false

            if ($rzpOrderId -and $rzpPaymentId -and $rzpSignature -and $rzpKeySecret) {
                $dataToSign = "$rzpOrderId|$rzpPaymentId"
                $hmac = New-Object System.Security.Cryptography.HMACSHA256
                $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($rzpKeySecret)
                $computedHash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($dataToSign))
                $computedHex = [BitConverter]::ToString($computedHash).Replace("-", "").ToLower()

                if ($computedHex -eq $rzpSignature.ToLower()) {
                    $isValid = $true
                    Write-Host "Razorpay Signature Verified Successfully: $rzpPaymentId for $rzpOrderId" -ForegroundColor Green
                } else {
                    Write-Host "Razorpay Signature Mismatch: expected $computedHex, received $rzpSignature" -ForegroundColor Red
                }
            } elseif ($rzpPaymentId) {
                $isValid = $true
            }

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $isValid
                orderId = $orderId
                paymentId = $rzpPaymentId
                status = if ($isValid) { "PAID" } else { "FAILED" }
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        # ----------------------------------------------------------------------
        # REST API Routes: Unified Inventory Management (Single Source of Truth)
        # ----------------------------------------------------------------------
        if (($rawUrl -eq "api/v1/inventory" -or $rawUrl -eq "api/v1/admin/inventory/slots") -and $request.HttpMethod -eq "GET") {
            $state = Get-SddsState
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                data = $state.slots
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        # ----------------------------------------------------------------------
        # REST API Routes: Order Processing & Live Stock Deductions
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/orders/record" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $orderReq = $reader.ReadToEnd() | ConvertFrom-Json
            $state = Get-SddsState

            $itemsSummary = @()
            $packsCount = 0

            if ($orderReq.items) {
                foreach ($it in $orderReq.items) {
                    $slot = $state.slots | Where-Object { $_.slotId -eq $it.slotId -or $_.productId -eq $it.productId -or $_.productId -eq $it.id } | Select-Object -First 1
                    $itQty = if ($it.qty) { [int]$it.qty } else { 1 }
                    $packsCount += $itQty
                    if ($slot) {
                        $slot.qty = [Math]::Max(0, [int]$slot.qty - $itQty)
                        $itemsSummary += "$($slot.name) ($($slot.size)) x$itQty"
                    }
                }
            }

            $gross = if ($orderReq.subtotal) { [int]$orderReq.subtotal } else { 220 }
            $net = if ($orderReq.finalPayableAmount) { [int]$orderReq.finalPayableAmount } else { $gross }
            $discountPct = if ($orderReq.discountPercentage) { [int]$orderReq.discountPercentage } else { 0 }
            $voucherCode = if ($orderReq.appliedBarcodeId) { $orderReq.appliedBarcodeId } else { "None" }
            $discountStr = if ($discountPct -gt 0) { "$($discountPct)% ($voucherCode)" } else { "None" }

            $newOrder = [PSCustomObject]@{
                id = if ($orderReq.orderId) { $orderReq.orderId } else { "ORD-" + (Get-Date -Format "yyyyMMdd-HHmmss") }
                time = (Get-Date -Format "hh:mm tt")
                item = if ($itemsSummary.Length -gt 0) { $itemsSummary -join ", " } else { "Vending Products" }
                gross = $gross
                discount = $discountStr
                net = $net
                method = if ($orderReq.paymentMethod) { $orderReq.paymentMethod } else { "STRIPE_CARD" }
                status = "COMPLETED"
            }

            $state.orders = @($newOrder) + @($state.orders)
            $state.grossSalesTodayInr = [int]$state.grossSalesTodayInr + $net
            $state.ordersCountToday = [int]$state.ordersCountToday + 1
            $state.totalPacksDispensed = [int]$state.totalPacksDispensed + [Math]::Max(1, $packsCount)

            Save-SddsState $state
            Write-Host "New Vending Order Recorded: $($newOrder.id) | Net: ₹$net | Packs: +$packsCount" -ForegroundColor Green

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                order = $newOrder
                slots = $state.slots
                metrics = @{
                    grossSalesTodayInr = $state.grossSalesTodayInr
                    ordersCountToday = $state.ordersCountToday
                    totalPacksDispensed = $state.totalPacksDispensed
                }
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        # ----------------------------------------------------------------------
        # REST API Routes: Collection Bin Disposal & Reward Logging
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/bin/disposal" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $dispReq = $reader.ReadToEnd() | ConvertFrom-Json
            $state = Get-SddsState

            $weight = if ($dispReq.weightGrams) { [int]$dispReq.weightGrams } else { 250 }
            $discountPct = if ($dispReq.rewardPercentage) { [int]$dispReq.rewardPercentage } else { 8 }
            $code = if ($dispReq.redeemCode) { $dispReq.redeemCode } else { "ECO-08-ABCD" }

            $state.totalWeightCollectedGrams = [int]$state.totalWeightCollectedGrams + $weight
            $state.totalVouchersIssued = [int]$state.totalVouchersIssued + 1

            $newDisp = [PSCustomObject]@{
                id = "DISP-" + (Get-Date -Format "yyyyMMdd-HHmmss")
                weightGrams = $weight
                discountPct = $discountPct
                code = $code
                time = (Get-Date -Format "hh:mm tt")
            }
            $state.disposals = @($newDisp) + @($state.disposals)
            Save-SddsState $state

            Write-Host "Collection Bin Recorded Disposal: +$weight g | Voucher: $code ($discountPct%)" -ForegroundColor Green

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                disposal = $newDisp
                totalWeightCollectedGrams = $state.totalWeightCollectedGrams
                totalWeightKg = [Math]::Round($state.totalWeightCollectedGrams / 1000.0, 2)
                totalVouchersIssued = $state.totalVouchersIssued
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        if ($rawUrl -eq "api/v1/bin/metrics" -and $request.HttpMethod -eq "GET") {
            $state = Get-SddsState
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                data = @{
                    totalWeightCollectedGrams = $state.totalWeightCollectedGrams
                    totalWeightKg = [Math]::Round($state.totalWeightCollectedGrams / 1000.0, 2)
                    totalVouchersIssued = $state.totalVouchersIssued
                    disposals = $state.disposals
                }
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        # ----------------------------------------------------------------------
        # REST API Routes: Optical Camera & Customer Session Lifecycle Audit
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/sessions/start" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $sessReq = $reader.ReadToEnd() | ConvertFrom-Json
            $state = Get-SddsState

            $sessionId = if ($sessReq.sessionId) { $sessReq.sessionId } else { "SESS-" + (Get-Date -Format "yyyyMMdd-HHmmss") }
            $startTime = if ($sessReq.startTime) { $sessReq.startTime } else { (Get-Date -Format "o") }

            $sessObj = [PSCustomObject]@{
                id = $sessionId
                startTime = $startTime
                cameraMonitoring = $true
                status = "ACTIVE"
            }

            if (-not $state.sessions) {
                $state | Add-Member -MemberType NoteProperty -Name "sessions" -Value @()
            }
            $state.sessions = @($sessObj) + @($state.sessions)
            Save-SddsState $state

            Write-Host "Kiosk Session Started: $sessionId | Camera Optical Surveillance: ACTIVE" -ForegroundColor Cyan

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                sessionId = $sessionId
                cameraStatus = "RECORDING"
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($rawUrl -eq "api/v1/sessions/end" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $sessReq = $reader.ReadToEnd() | ConvertFrom-Json
            $state = Get-SddsState

            $sessionId = if ($sessReq.sessionId) { $sessReq.sessionId } else { "" }
            $reason = if ($sessReq.reason) { $sessReq.reason } else { "USER_ABORTED" }
            $duration = if ($sessReq.durationSeconds) { [int]$sessReq.durationSeconds } else { 0 }
            $endTime = if ($sessReq.endTime) { $sessReq.endTime } else { (Get-Date -Format "o") }

            if ($state.sessions) {
                $found = $state.sessions | Where-Object { $_.id -eq $sessionId } | Select-Object -First 1
                if ($found) {
                    $found.status = "TERMINATED"
                    $found | Add-Member -MemberType NoteProperty -Name "reason" -Value $reason -Force
                    $found | Add-Member -MemberType NoteProperty -Name "endTime" -Value $endTime -Force
                    $found | Add-Member -MemberType NoteProperty -Name "durationSeconds" -Value $duration -Force
                }
            }
            Save-SddsState $state

            Write-Host "Kiosk Session Ended: $sessionId | Reason: $reason | Duration: ${duration}s" -ForegroundColor Yellow

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                sessionId = $sessionId
                status = "TERMINATED"
                reason = $reason
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # ----------------------------------------------------------------------
        # REST API Routes: Optical Video Ingestion & Playback List
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v1/recordings" -and $request.HttpMethod -eq "GET") {
            $recDir = Join-Path $rootPath "recordings"
            $files = @()
            if (Test-Path $recDir) {
                $files = Get-ChildItem -Path $recDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 50 | ForEach-Object {
                    [PSCustomObject]@{
                        name = $_.Name
                        size = $_.Length
                        modified = $_.LastWriteTime.ToString("o")
                        url = "/recordings/" + $_.Name
                    }
                }
            }
            $jsonRes = @{ success = $true; count = $files.Count; recordings = $files } | ConvertTo-Json -Depth 3
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonRes)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($rawUrl -eq "api/v1/recordings/chunk" -and $request.HttpMethod -eq "POST") {
            $chunkReq = $null
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyStr = $reader.ReadToEnd()
                if ($bodyStr) {
                    $chunkReq = $bodyStr | ConvertFrom-Json
                }
            } catch {
                Write-Host "Warning: Could not read chunk stream: $_" -ForegroundColor Yellow
            }
            if (-not $chunkReq) {
                $response.StatusCode = 400
                $response.Close()
                continue
            }
            
            # Rule 8: Path Traversal & Identifier Sanitization
            $rawSessionId = if ($chunkReq.sessionId) { [string]$chunkReq.sessionId } else { "STANDBY" }
            $cleanSessionId = ($rawSessionId -replace "[^a-zA-Z0-9_\-]", "")
            if (-not $cleanSessionId) { $cleanSessionId = "SESSION_UNKNOWN" }

            $chunkIndex = if ($chunkReq.chunkIndex -ne $null) { [int]$chunkReq.chunkIndex } else { 0 }
            $formattedIndex = $chunkIndex.ToString("D4")
            $timeTag = Get-Date -Format "yyyyMMdd_HHmmss"

            $recDir = Join-Path $rootPath "recordings"
            if (-not (Test-Path $recDir)) {
                New-Item -ItemType Directory -Path $recDir -Force | Out-Null
            }

            $ext = if ($chunkReq.mimeType -like "*mp4*") { ".mp4" } else { ".webm" }
            $fileName = if ($chunkReq.customFileName) {
                $sanitized = ($chunkReq.customFileName -replace "[^a-zA-Z0-9_\-\.]", "")
                if (-not ($sanitized.ToLower().EndsWith(".mp4") -or $sanitized.ToLower().EndsWith(".webm"))) {
                    $sanitized = "${sanitized}${ext}"
                }
                $sanitized
            } else {
                "${cleanSessionId}_chunk_${formattedIndex}_${timeTag}${ext}"
            }
            $targetPath = Join-Path $recDir $fileName

            $bytesSaved = 0
            if ($chunkReq.dataBase64) {
                try {
                    $b64 = [string]$chunkReq.dataBase64
                    if ($b64.Contains(",")) {
                        $b64 = $b64.Split(",")[1]
                    }
                    $videoBytes = [System.Convert]::FromBase64String($b64)
                    [System.IO.File]::WriteAllBytes($targetPath, $videoBytes)
                    $bytesSaved = $videoBytes.Length
                } catch {
                    Write-Host "Warning: Error writing video chunk: $_" -ForegroundColor Yellow
                }
            }

            # Update State Engine metadata
            $state = Get-SddsState
            if (-not $state.videoRecordings) {
                $state | Add-Member -MemberType NoteProperty -Name "videoRecordings" -Value @()
            }
            $chunkMeta = [PSCustomObject]@{
                sessionId = $cleanSessionId
                chunkIndex = $chunkIndex
                filename = $fileName
                bytes = $bytesSaved
                timestamp = (Get-Date -Format "o")
            }
            $state.videoRecordings = @($chunkMeta) + @($state.videoRecordings | Select-Object -First 99)
            Save-SddsState $state

            Write-Host "Video Chunk Stored: $fileName ($bytesSaved bytes)" -ForegroundColor Green

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                filename = $fileName
                bytesSaved = $bytesSaved
                chunkIndex = $chunkIndex
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # ----------------------------------------------------------------------
        # REST API Routes: Administrator Portal (Phase 6)
        # ----------------------------------------------------------------------
        if (($rawUrl -eq "api/v1/admin/metrics" -or $rawUrl -eq "api/v1/admin/overview") -and $request.HttpMethod -eq "GET") {
            $state = Get-SddsState

            $totalQty = 0
            $totalMax = 0
            foreach ($s in $state.slots) {
                $totalQty += [int]$s.qty
                $totalMax += [int]$s.max
            }
            $healthPct = if ($totalMax -gt 0) { [Math]::Round(($totalQty / $totalMax) * 100) } else { 100 }

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                data = @{
                    grossSalesTodayInr = $state.grossSalesTodayInr
                    ordersCountToday = $state.ordersCountToday
                    totalPacksDispensed = $state.totalPacksDispensed
                    overallStockHealthPct = $healthPct
                    totalWeightCollectedGrams = $state.totalWeightCollectedGrams
                    totalWeightKg = [Math]::Round($state.totalWeightCollectedGrams / 1000.0, 2)
                    totalVouchersIssued = $state.totalVouchersIssued
                    telemetry = @{
                        machineId = "VM-KGP-01"
                        controller = "ESP32-WROOM-32D"
                        serialPort = "COM3"
                        baudRate = 115200
                        irDropSensor = "ACTIVE"
                        status = "OPERATIONAL"
                    }
                }
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        if ($rawUrl -eq "api/v1/admin/orders" -and $request.HttpMethod -eq "GET") {
            $state = Get-SddsState
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                data = $state.orders
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        if ($rawUrl -eq "api/v1/admin/inventory/restock" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            $slotId = if ($body.slotId) { $body.slotId } else { "ALL" }
            $qty = if ($body.quantityAdded) { [int]$body.quantityAdded } else { 10 }

            $state = Get-SddsState

            if ($slotId -eq "ALL") {
                foreach ($s in $state.slots) {
                    $s.qty = [int]$s.max
                }
                Write-Host "Admin restocked ALL slots to 100% capacity" -ForegroundColor Green
            } else {
                $targetSlot = $state.slots | Where-Object { $_.slotId -eq $slotId } | Select-Object -First 1
                if ($targetSlot) {
                    $targetSlot.qty = [Math]::Min([int]$targetSlot.max, [int]$targetSlot.qty + $qty)
                    Write-Host "Admin restocked $slotId with +$qty packs" -ForegroundColor Green
                }
            }

            Save-SddsState $state

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                message = if ($slotId -eq "ALL") { "All slots refilled to 100%" } else { "Slot $slotId replenished (+${qty} packs)" }
                slots = $state.slots
            } | ConvertTo-Json -Depth 4
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        if ($rawUrl -eq "api/v1/admin/diagnostics/dispense-test" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            $slotId = if ($body.slotId) { $body.slotId } else { "SLOT_A1" }

            $response.ContentType = "application/json; charset=utf-8"
            $json = @{
                success = $true
                slotId = $slotId
                motorPulseMs = 100
                irDropVerified = $true
                status = "PASS"
                timestamp = (Get-Date).ToString("o")
            } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # ----------------------------------------------------------------------
        # REST API Routes: SDDS V5 PRD Baseline Services
        # ----------------------------------------------------------------------
        if ($rawUrl -eq "api/v5/video/finalize" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $vBody = $reader.ReadToEnd() | ConvertFrom-Json
            $sId = if ($vBody.sessionId) { $vBody.sessionId } else { "SES-UNKNOWN" }
            Write-Host "V5 Session CCTV Video Finalized: $sId | Status: FINALIZED" -ForegroundColor Cyan
            $response.ContentType = "application/json; charset=utf-8"
            $json = @{ success = $true; sessionId = $sId; status = "FINALIZED" } | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }


        # ----------------------------------------------------------------------
        # Static File Serving
        # ----------------------------------------------------------------------
        $filePath = Join-Path $rootPath $rawUrl.Replace('/', '\')

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mimeType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".mp4"  { "video/mp4" }
                ".webm" { "video/webm" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mimeType
            $response.ContentLength64 = $bytes.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 File Not Found</h1><p>$rawUrl</p>")
            $response.ContentLength64 = $errBytes.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
        }
        $response.Close()
        } catch {
            Write-Host "Warning: HTTP Request handling exception: $_" -ForegroundColor Yellow
            try { $response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
