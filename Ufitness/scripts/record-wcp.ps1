$ErrorActionPreference = 'Continue'
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness"
$xmlPath = Join-Path $outDir "scripts\ui.xml"

function Tap([int]$x, [int]$y, [int]$waitMs = 1200) {
  Write-Host "TAP $x $y"
  & $adb shell input tap $x $y | Out-Null
  Start-Sleep -Milliseconds $waitMs
}
function Swipe { & $adb shell input swipe 540 1800 540 800 280 | Out-Null; Start-Sleep -Milliseconds 500 }
function Dump {
  $p = Start-Process -FilePath $adb -ArgumentList @('shell','uiautomator','dump','/sdcard/ui.xml') -WindowStyle Hidden -PassThru
  if (-not $p.WaitForExit(10000)) { try { $p.Kill() } catch {}; return '' }
  & $adb pull /sdcard/ui.xml $xmlPath | Out-Null
  if (Test-Path $xmlPath) { return (Get-Content $xmlPath -Raw -ErrorAction SilentlyContinue) }
  return ''
}

Write-Host "Starting screenrecord for Workout / Community / Profile"
& $adb shell rm -f /sdcard/ufitness-wcp.mp4 | Out-Null
$job = Start-Job -ScriptBlock {
  param($adbPath)
  & $adbPath shell screenrecord --bit-rate 8000000 --time-limit 180 /sdcard/ufitness-wcp.mp4
} -ArgumentList $adb
Start-Sleep -Seconds 2

Write-Host "=== WORKOUT ==="
Tap 540 2300 4000
# Skip workout onboarding if present
Tap 1000 185 1500
Tap 540 2050 1500   # NEXT / Continue as guest fallback
Start-Sleep -Seconds 2
# Inner tabs sit above UFitness bar
Tap 135 2168 2200   # Workout Home
Swipe
Tap 540 1100 1500
Tap 405 2168 2200   # Plan
Swipe
Tap 540 1000 1500
Tap 675 2168 2500   # Workouts catalog
Tap 270 950 2000    # a program
Start-Sleep -Seconds 2
Tap 70 160 1500
Tap 810 950 1800
Start-Sleep -Seconds 1
Tap 70 160 1500
Tap 945 2168 2200   # Insights
Swipe
Start-Sleep -Seconds 2

Write-Host "=== COMMUNITY ==="
Tap 756 2300 3500
Start-Sleep -Seconds 2
Tap 180 520 2500    # Groups
Start-Sleep -Seconds 2
Swipe
Tap 70 160 1500
Tap 756 2300 1200
Tap 420 520 2500    # Challenges
Start-Sleep -Seconds 2
Tap 70 160 1500
Tap 756 2300 1200
Tap 680 520 2800    # Buddies
Start-Sleep -Seconds 2
Swipe
Tap 70 160 1600
Tap 756 2300 1200
Tap 920 520 2800    # Mentors
Start-Sleep -Seconds 2
Swipe
Tap 70 160 1600
Tap 756 2300 1500
Swipe
Start-Sleep -Seconds 2

Write-Host "=== PROFILE ==="
Tap 972 2300 3000
Start-Sleep -Seconds 2
Tap 1007 209 1500   # bell
Tap 800 1400 800
Tap 644 615 2000    # pencil / edit
Start-Sleep -Seconds 2
Tap 74 185 1600
Tap 543 1489 2000   # Edit Profile Details
Start-Sleep -Seconds 2
Tap 74 185 1500
Tap 543 1639 2000   # Campus
Start-Sleep -Seconds 2
Tap 74 185 1500
Tap 543 1789 2000   # Fitness Goals
Start-Sleep -Seconds 2
Tap 74 185 1500
Tap 543 2063 1600   # Notifications
Tap 800 1400 800
Swipe
Tap 543 1824 1600   # Privacy
Tap 800 1400 800
Swipe
Start-Sleep -Seconds 3

$pidof = (& $adb shell pidof screenrecord | Out-String).Trim().Split()[0]
if ($pidof) { & $adb shell kill -2 $pidof | Out-Null }
Start-Sleep -Seconds 3
try { Stop-Job $job -Force; Remove-Job $job -Force } catch {}

$local = Join-Path $outDir 'ufitness-workout-community-profile.mp4'
& $adb pull /sdcard/ufitness-wcp.mp4 $local
Get-Item $local | Format-List FullName, Length, LastWriteTime

Write-Host "---- FINAL SCREEN ----"
$xml = Dump
node (Join-Path $outDir 'scripts\parse-ui.js') $xmlPath
Write-Host "DONE"
