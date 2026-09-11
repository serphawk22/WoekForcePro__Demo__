#!/usr/bin/env pwsh

Write-Host "🔍 WorkForcePro - Redirect Loop Verification"
Write-Host "============================================="
Write-Host ""

function Test-PortListening {
    param(
        [int]$Port
    )

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return (@($connections).Count -gt 0)
    }
    catch {
        try {
            $netstat = netstat -ano | Select-String ":$Port\s"
            return ($null -ne $netstat)
        }
        catch {
            return $false
        }
    }
}

Write-Host "1️⃣ Checking servers..."
$backendRunning = Test-PortListening -Port 8000
$frontendRunning = Test-PortListening -Port 3000

if (-not $backendRunning) {
    Write-Host "❌ Backend NOT running on port 8000"
    Write-Host "   Start with: cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
}
else {
    Write-Host "✅ Backend running on port 8000"
}

if (-not $frontendRunning) {
    Write-Host "❌ Frontend NOT running on port 3000"
    Write-Host "   Start with: cd frontend; npm run dev"
}
else {
    Write-Host "✅ Frontend running on port 3000"
}

Write-Host ""
Write-Host "2️⃣ Testing login API..."

$loginBody = @{
    email = "admin@gmail.com"
    password = "admin"
} | ConvertTo-Json -Compress

try {
    $loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/auth/login/json" -ContentType "application/json" -Body $loginBody

    if ($loginResponse.access_token) {
        Write-Host "✅ Login API working"
        $role = $loginResponse.role
        Write-Host "   Role: $role"
    }
    else {
        Write-Host "❌ Login API failed"
        $loginResponse | ConvertTo-Json -Depth 10 | Write-Host
    }
}
catch {
    Write-Host "❌ Login API failed"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "3️⃣ Manual Testing Steps:"
Write-Host ""
Write-Host "   A. Clear browser data:"
Write-Host "      - Open browser console (F12)"
Write-Host "      - Run: localStorage.clear()"
Write-Host ""
Write-Host "   B. Test login page (no redirect loop):"
Write-Host "      - Visit: http://localhost:3000/login"
Write-Host "      - Expected: Page loads once, no repeated requests"
Write-Host "      - Console should be quiet (no flood of logs)"
Write-Host ""
Write-Host "   C. Test admin login:"
Write-Host "      - Email: admin@gmail.com"
Write-Host "      - Password: admin"
Write-Host "      - Expected: Redirects to /admin/dashboard in < 1 second"
Write-Host ""
Write-Host "   D. Test employee login:"
Write-Host "      - Clear localStorage first"
Write-Host "      - Email: john@example.com"
Write-Host "      - Password: password123"
Write-Host "      - Expected: Redirects to /employee/dashboard"
Write-Host ""
Write-Host "   E. Test already logged in:"
Write-Host "      - While logged in, visit: http://localhost:3000/login"
Write-Host "      - Expected: Immediately redirects to your dashboard"
Write-Host ""
Write-Host "4️⃣ Success Indicators:"
Write-Host "   ✅ Login page loads instantly"
Write-Host "   ✅ No 'Too many redirects' error"
Write-Host "   ✅ Console shows clean, minimal logs"
Write-Host "   ✅ Navigation happens in < 1 second"
Write-Host "   ✅ No browser freeze or hang"
Write-Host ""
Write-Host "5️⃣ If you see issues:"
Write-Host "   - Check browser console for errors"
Write-Host "   - Check Network tab for repeated requests"
Write-Host "   - Clear localStorage and cookies"
Write-Host "   - Hard refresh (Ctrl+F5)"
Write-Host ""
Write-Host "📖 Full testing guide: REDIRECT_LOOP_FIXED.md"
Write-Host ""
