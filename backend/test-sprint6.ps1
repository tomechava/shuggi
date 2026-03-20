# ============================================================
# SPRINT 6 - SECURITY TEST SUITE
# Run from: backend/ folder
# Usage: .\test-sprint6.ps1
# ============================================================

$BASE = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }
$passed = 0
$failed = 0

function Test-Pass($msg) {
    Write-Host "  OK $msg" -ForegroundColor Green
    $script:passed++
}

function Test-Fail($msg) {
    Write-Host "  FAIL $msg" -ForegroundColor Red
    $script:failed++
}

function Test-Section($title) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
}

# ============================================================
# TEST 1 - HEALTH CHECK
# ============================================================
Test-Section "1. HEALTH CHECK"

try {
    $health = Invoke-RestMethod -Uri "$BASE/health" -Method GET
    if ($health.status -eq "ok") { Test-Pass "Status is ok" } else { Test-Fail "Status is $($health.status)" }
    if ($health.database -eq "connected") { Test-Pass "Database connected" } else { Test-Fail "Database: $($health.database)" }
    if ($health.environment) { Test-Pass "Environment: $($health.environment)" } else { Test-Fail "Environment missing" }
    if ($health.uptime -gt 0) { Test-Pass "Uptime: $($health.uptime)s" } else { Test-Fail "Uptime missing" }
} catch {
    Test-Fail "Health endpoint unreachable: $_"
}

# ============================================================
# TEST 2 - SECURITY HEADERS
# ============================================================
Test-Section "2. SECURITY HEADERS - HELMET"

try {
    $response = Invoke-WebRequest -Uri "$BASE/health" -Method GET
    $h = $response.Headers
    if ($h["X-Content-Type-Options"]) { Test-Pass "X-Content-Type-Options present" } else { Test-Fail "X-Content-Type-Options missing" }
    if ($h["X-Frame-Options"]) { Test-Pass "X-Frame-Options present" } else { Test-Fail "X-Frame-Options missing" }
    if ($h["X-DNS-Prefetch-Control"]) { Test-Pass "X-DNS-Prefetch-Control present" } else { Test-Fail "X-DNS-Prefetch-Control missing" }
} catch {
    Test-Fail "Could not check headers: $_"
}

# ============================================================
# TEST 3 - RATE LIMITING
# ============================================================
Test-Section "3. RATE LIMITING - 10 requests per 60s per IP"

Write-Host "  Sending 11 rapid requests to /health..." -ForegroundColor Yellow
$rateLimitHit = $false
for ($i = 1; $i -le 11; $i++) {
    try {
        Invoke-RestMethod -Uri "$BASE/health" -Method GET | Out-Null
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 429) {
            $rateLimitHit = $true
            Test-Pass "Rate limit triggered on request $i (429)"
            break
        }
    }
}
if (-not $rateLimitHit) { Test-Fail "Rate limit never triggered after 11 requests" }

Write-Host "  Waiting 65 seconds for rate limit reset..." -ForegroundColor Yellow
Start-Sleep -Seconds 65

try {
    Invoke-RestMethod -Uri "$BASE/health" -Method GET | Out-Null
    Test-Pass "Requests work again after cooldown"
} catch {
    Test-Fail "Still rate limited after cooldown: $_"
}

# ============================================================
# TEST 4 - REGISTRATION AND EMAIL VERIFICATION
# ============================================================
Test-Section "4. REGISTRATION AND EMAIL VERIFICATION"

$testEmail = "testuser_$(Get-Date -Format 'HHmmss')@gmail.com"
$testPassword = "Test123!"

# 4a. Register
try {
    $body = @{ email = $testEmail; password = $testPassword; name = "Sprint6 Tester" } | ConvertTo-Json
    $reg = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -Body $body -Headers $headers
    if ($reg.user.isEmailVerified -eq $false) { Test-Pass "isEmailVerified is false on registration" } else { Test-Fail "isEmailVerified should be false" }
    if ($reg.message -match "verify") { Test-Pass "Response message mentions email verification" } else { Test-Fail "Message missing verification hint" }
    Write-Host "  --> Check your Gmail inbox for: $testEmail" -ForegroundColor Yellow
} catch {
    Test-Fail "Registration failed: $_"
}

# 4b. Login before verification - should work with soft flag
try {
    $body = @{ email = $testEmail; password = $testPassword } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $body -Headers $headers
    if ($login.accessToken) { Test-Pass "Login allowed before verification - soft block" } else { Test-Fail "No access token returned" }
    if ($login.emailVerificationRequired -eq $true) { Test-Pass "emailVerificationRequired flag is true" } else { Test-Fail "emailVerificationRequired flag missing or false" }
} catch {
    Test-Fail "Login failed: $_"
}

# 4c. Verify with invalid token
try {
    $body = @{ token = "completelyinvalidtoken" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/auth/verify-email" -Method POST -Body $body -Headers $headers
    Test-Fail "Should have rejected invalid token"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Test-Pass "Invalid token correctly rejected (400)" } else { Test-Fail "Wrong status for invalid token: $status" }
}

# ============================================================
# TEST 5 - RESEND VERIFICATION
# ============================================================
Test-Section "5. RESEND VERIFICATION"

# 5a. Resend for existing unverified user
try {
    $body = @{ email = $testEmail } | ConvertTo-Json
    $resend = Invoke-RestMethod -Uri "$BASE/auth/resend-verification" -Method POST -Body $body -Headers $headers
    if ($resend.message) { Test-Pass "Resend returned message: $($resend.message)" } else { Test-Fail "No message returned" }
} catch {
    Test-Fail "Resend failed: $_"
}

# 5b. Resend immediately again - should hit 5-min cooldown
try {
    $body = @{ email = $testEmail } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/auth/resend-verification" -Method POST -Body $body -Headers $headers
    Test-Fail "Should have been rate limited by 5-min cooldown"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Test-Pass "5-minute cooldown enforced (400)" } else { Test-Fail "Wrong status: $status" }
}

# 5c. Resend for non-existent email - should not leak user existence
try {
    $body = @{ email = "ghost_$(Get-Date -Format 'HHmmss')@nowhere.com" } | ConvertTo-Json
    $ghost = Invoke-RestMethod -Uri "$BASE/auth/resend-verification" -Method POST -Body $body -Headers $headers
    if ($ghost.message) { Test-Pass "Non-existent email handled silently - no user leak" } else { Test-Fail "Response may leak user existence" }
} catch {
    Test-Fail "Should return silent success for unknown email: $_"
}

# ============================================================
# TEST 6 - PASSWORD RESET
# ============================================================
Test-Section "6. PASSWORD RESET"

# 6a. Request reset for existing user
try {
    $body = @{ email = $testEmail } | ConvertTo-Json
    $forgot = Invoke-RestMethod -Uri "$BASE/auth/forgot-password" -Method POST -Body $body -Headers $headers
    if ($forgot.message) { Test-Pass "Forgot password accepted: $($forgot.message)" } else { Test-Fail "No message returned" }
    Write-Host "  --> Check Gmail for password reset email" -ForegroundColor Yellow
} catch {
    Test-Fail "Forgot password failed: $_"
}

# 6b. Request reset for non-existent email - should not leak
try {
    $body = @{ email = "ghost2_$(Get-Date -Format 'HHmmss')@nowhere.com" } | ConvertTo-Json
    $ghostReset = Invoke-RestMethod -Uri "$BASE/auth/forgot-password" -Method POST -Body $body -Headers $headers
    if ($ghostReset.message) { Test-Pass "Non-existent email handled silently" } else { Test-Fail "Response leaked user existence" }
} catch {
    Test-Fail "Should return silent success for unknown email: $_"
}

# 6c. Reset with invalid token
try {
    $body = @{ token = "invalidresettoken"; newPassword = "NewPass123!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/auth/reset-password" -Method POST -Body $body -Headers $headers
    Test-Fail "Should have rejected invalid reset token"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Test-Pass "Invalid reset token correctly rejected (400)" } else { Test-Fail "Wrong status: $status" }
}

# ============================================================
# TEST 7 - INPUT VALIDATION
# ============================================================
Test-Section "7. INPUT VALIDATION - DTO GUARDS"

# 7a. Register with invalid email format
try {
    $body = @{ email = "notanemail"; password = "Test123!"; name = "Test" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -Body $body -Headers $headers
    Test-Fail "Should have rejected invalid email"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Test-Pass "Invalid email format rejected (400)" } else { Test-Fail "Wrong status: $status" }
}

# 7b. Register with missing required fields
try {
    $body = @{ email = "valid@email.com" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -Body $body -Headers $headers
    Test-Fail "Should have rejected missing password"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Test-Pass "Missing required fields rejected (400)" } else { Test-Fail "Wrong status: $status" }
}

# 7c. Register with extra unknown fields - forbidNonWhitelisted blocks them
try {
    $body = @{ email = "extra_$(Get-Date -Format 'HHmmss')@gmail.com"; password = "Test123!"; name = "Test"; hackerField = "malicious" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -Body $body -Headers $headers
    Test-Fail "Should have blocked unknown fields"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Test-Pass "Unknown fields blocked by forbidNonWhitelisted (400)" } else { Test-Fail "Wrong status: $status" }
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
$color = if ($failed -eq 0) { "Green" } else { "Yellow" }
Write-Host "  RESULTS: $passed passed, $failed failed" -ForegroundColor $color
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  Sprint 6 security tests all passed. Ready to commit." -ForegroundColor Green
} else {
    Write-Host "  $failed test(s) failed. Review above before committing." -ForegroundColor Yellow
}