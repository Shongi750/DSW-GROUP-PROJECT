$ErrorActionPreference = 'Continue'
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness"
$xmlPath = Join-Path $outDir "scripts\ui.xml"

function Tap([int]$x, [int]$y, [int]$waitMs = 1200) {
  Write-Host "TAP $x $y"
  & $adb shell input tap $x $y | Out-Null
  Start-Sleep -Milliseconds $waitMs
}
function Swipe { & $adb shell input swipe 540 1750 540 850 280 | Out-Null; Start-Sleep -Milliseconds 450 }

function Screen-Texts {
  $p = Start-Process -FilePath $adb -ArgumentList @('shell','uiautomator','dump','/sdcard/ui.xml') -WindowStyle Hidden -PassThru
  if (-not $p.WaitForExit(12000)) { try { $p.Kill() } catch {}; return @() }
  & $adb pull /sdcard/ui.xml $xmlPath | Out-Null
  $raw = Get-Content $xmlPath -Raw -ErrorAction SilentlyContinue
  if (-not $raw) { return @() }
  return [regex]::Matches($raw, 'text="([^"]{2,40})"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
}

Write-Host "Reopen UFitness"
& $adb reverse tcp:8082 tcp:8082 | Out-Null
& $adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8082" | Out-Null
Start-Sleep -Seconds 10
$texts = Screen-Texts
Write-Host ("BOOT: " + (($texts | Select-Object -First 18) -join ' | '))

if ($texts -match 'Welcome Back' -or $texts -match 'Register') {
  Tap 541 1652 3000
  $texts = Screen-Texts
  Write-Host ("AFTER LOGIN: " + (($texts | Select-Object -First 14) -join ' | '))
}
if ($texts -match 'fitness goal' -or $texts -match 'SKIP') {
  Tap 1008 185 2500
}

Write-Host "Starting record"
& $adb shell rm -f /sdcard/ufitness-wcp.mp4 | Out-Null
$job = Start-Job -ScriptBlock {
  param($adbPath)
  & $adbPath shell screenrecord --bit-rate 8000000 --time-limit 180 /sdcard/ufitness-wcp.mp4
} -ArgumentList $adb
Start-Sleep -Seconds 2

# Stay in the tab bar only (y ~ 2338). Never tap meal cards.
Write-Host "=== WORKOUT TAB ==="
Tap 540 2338 5000
Tap 1000 185 2000    # Skip workout onboarding if shown
Start-Sleep -Seconds 2
Tap 135 2168 2500    # inner Home
Start-Sleep -Seconds 2
Tap 405 2168 2500    # Plan
Start-Sleep -Seconds 2
Tap 675 2168 2800    # Workouts
Start-Sleep -Seconds 2
Tap 945 2168 2500    # Insights
Start-Sleep -Seconds 2

Write-Host "=== COMMUNITY TAB ==="
Tap 756 2338 4000
Start-Sleep -Seconds 2
Tap 180 520 2500
Start-Sleep -Seconds 2
Tap 70 160 1600
Tap 756 2338 1500
Tap 420 520 2500
Start-Sleep -Seconds 2
Tap 70 160 1600
Tap 756 2338 1500
Tap 680 520 2800
Start-Sleep -Seconds 2
Tap 70 160 1600
Tap 756 2338 1500
Tap 920 520 2800
Start-Sleep -Seconds 2
Tap 70 160 1600
Tap 756 2338 2000

Write-Host "=== PROFILE TAB ==="
Tap 972 2338 4000
Start-Sleep -Seconds 3
Tap 1007 209 1600
Tap 800 1400 800
Tap 543 1489 2200
Start-Sleep -Seconds 2
Tap 74 185 1600
Tap 543 1639 2200
Start-Sleep -Seconds 2
Tap 74 185 1600
Tap 543 1789 2200
Start-Sleep -Seconds 2
Tap 74 185 1600
Swipe
Start-Sleep -Seconds 3

$pidof = (& $adb shell pidof screenrecord | Out-String).Trim().Split()[0]
if ($pidof) { & $adb shell kill -2 $pidof | Out-Null }
Start-Sleep -Seconds 3
try { Stop-Job $job -Force; Remove-Job $job -Force } catch {}

$local = Join-Path $outDir 'ufitness-workout-community-profile.mp4'
& $adb pull /sdcard/ufitness-wcp.mp4 $local
Get-Item $local | Format-List FullName, Length, LastWriteTime

Write-Host "---- FINAL ----"
$texts = Screen-Texts
Write-Host (($texts | Select-Object -First 20) -join ' | ')
Write-Host "DONE"
