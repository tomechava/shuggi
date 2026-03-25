$BASE = "http://localhost:3000"
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
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
}

Test-Section "1. LOGIN"

try {
    $response = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body '{"email":"admin@shuggi.com","password":"Admin123*"}' -ContentType "application/json" -SessionVariable session
    $body = $response.Content | ConvertFrom-Json
    $cookie = $response.Headers["Set-Cookie"]

    if ($body.accessToken) { Test-Fail "accessToken en body - no debe estar" } else { Test-Pass "accessToken NO en body" }
    if ($null -ne $body.emailVerificationRequired) { Test-Pass "emailVerificationRequired presente: $($body.emailVerificationRequired)" } else { Test-Fail "emailVerificationRequired ausente" }
    if ($cookie -and $cookie -match "access_token") { Test-Pass "Cookie access_token seteada" } else { Test-Fail "Cookie access_token NO encontrada" }
    if ($cookie -match "httponly") { Test-Pass "Cookie tiene flag httpOnly" } else { Test-Fail "Cookie NO tiene httpOnly" }
    if ($cookie -match "path=/") { Test-Pass "Cookie tiene path=/" } else { Test-Fail "Cookie NO tiene path=/" }
} catch {
    Test-Fail "Login fallido: $_"
}

Test-Section "2. GET /auth/me CON COOKIE"

try {
    $me = Invoke-RestMethod -Uri "$BASE/auth/me" -Method GET -WebSession $session
    if ($me.user.id) { Test-Pass "user.id: $($me.user.id)" } else { Test-Fail "user.id ausente" }
    if ($me.user.email) { Test-Pass "user.email: $($me.user.email)" } else { Test-Fail "user.email ausente" }
    if ($me.user.role) { Test-Pass "user.role: $($me.user.role)" } else { Test-Fail "user.role ausente" }
} catch {
    Test-Fail "GET /auth/me fallido: $_"
}

Test-Section "3. GET /auth/me SIN COOKIE - debe 401"

try {
    Invoke-RestMethod -Uri "$BASE/auth/me" -Method GET
    Test-Fail "Debia retornar 401"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) { Test-Pass "401 correcto sin cookie" } else { Test-Fail "Status inesperado: $status" }
}

Test-Section "4. LOGOUT"

try {
    $logout = Invoke-RestMethod -Uri "$BASE/auth/logout" -Method POST -WebSession $session
    if ($logout.message -match "Logged out") { Test-Pass "Logout OK: $($logout.message)" } else { Test-Fail "Mensaje inesperado: $($logout.message)" }
} catch {
    Test-Fail "Logout fallido: $_"
}

Test-Section "5. GET /auth/me POST-LOGOUT - debe 401"

try {
    Invoke-RestMethod -Uri "$BASE/auth/me" -Method GET -WebSession $session
    Test-Fail "Debia retornar 401 post-logout"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) { Test-Pass "401 correcto post-logout" } else { Test-Fail "Status inesperado: $status" }
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
$color = if ($failed -eq 0) { "Green" } else { "Yellow" }
Write-Host "  RESULTS: $passed passed, $failed failed" -ForegroundColor $color
Write-Host "==============================" -ForegroundColor Cyan