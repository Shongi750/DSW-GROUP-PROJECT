$ErrorActionPreference = 'Continue'
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness"

function Tap([int]$x, [int]$y, [int]$waitMs = 1000) {
  Write-Host "TAP $x $y"
  & $adb shell input tap $x $y | Out-Null
  Start-Sleep -Milliseconds $waitMs
}
function Swipe([int]$x1, [int]$y1, [int]$x2, [int]$y2, [int]$ms = 280) {
  & $adb shell input swipe $x1 $y1 $x2 $y2 $ms | Out-Null
  Start-Sleep -Milliseconds 400
}

Write-Host "Starting screenrecord"
& $adb shell rm -f /sdcard/ufitness-full.mp4 | Out-Null
$job = Start-Job -ScriptBlock {
  param($adbPath)
  & $adbPath shell screenrecord --bit-rate 8000000 --time-limit 180 /sdcard/ufitness-full.mp4
} -ArgumentList $adb
Start-Sleep -Seconds 2

Write-Host "=== Login / Sign up ==="
Tap 351 1472 700          # Remember me
Tap 771 1472 900          # Forgot Password
Tap 761 1834 1800         # Register
Tap 541 1967 3500         # Create Account

Write-Host "=== Onboarding ==="
Tap 284 736 450
Tap 780 736 450
Tap 284 1051 450
Tap 779 1051 450
Tap 780 736 600           # Muscle final
Tap 516 1331 900          # Experience
Tap 540 1550 800          # option
Tap 516 1572 900          # Location
Tap 540 1700 800
Tap 167 1805 350
Tap 416 1805 350
Tap 665 1805 350
Tap 914 1805 350
Tap 167 1805 500
Swipe 540 1900 540 700 280
Tap 516 2030 900          # Funding
Tap 540 1550 800
Tap 506 2200 2800         # Continue (slightly above nav)

Write-Host "=== Home ==="
Tap 108 2303 1400
Tap 90 211 1200           # avatar
Tap 108 2303 900
Tap 988 211 900           # bell
Tap 970 903 1400          # SEE ALL
Tap 108 2303 900
Tap 849 1747 1400         # START
Tap 108 2303 900
Swipe 540 1900 540 800 280
Tap 659 2134 1200         # meal card
Tap 108 2303 900
Swipe 540 1900 540 700 280
Tap 180 1750 1400         # Mentors card
Tap 70 160 1000
Tap 108 2303 800
Swipe 540 1900 540 700 280
Tap 540 1750 1400         # Buddies
Tap 70 160 1000
Tap 108 2303 800

Write-Host "=== Meals ==="
Tap 324 2303 2000
Tap 90 190 1000
Tap 324 2303 800
Tap 1000 190 800
Tap 800 1400 500
Tap 140 650 400
Tap 300 650 400
Tap 460 650 400
Tap 620 650 400
Tap 780 650 400
Tap 940 650 500
Swipe 540 1800 540 800 280
Tap 540 1100 1100
Tap 800 1400 400
Tap 70 160 700

Write-Host "=== Workout ==="
Tap 540 2303 2500
Tap 135 2168 1100
Tap 540 900 800
Tap 405 2168 1100
Swipe 540 1700 540 900 280
Tap 675 2168 1200
Tap 270 950 1200
Tap 70 160 1000
Tap 945 2168 1100
Tap 540 1100 800

Write-Host "=== Community ==="
Tap 756 2303 1800
Tap 180 520 1300          # Groups
Tap 70 160 900
Tap 756 2303 700
Tap 420 520 1300          # Challenges
Tap 70 160 900
Tap 756 2303 700
Tap 680 520 1400          # Buddies
Tap 70 160 1000
Tap 756 2303 700
Tap 920 520 1400          # Mentors
Tap 70 160 1000
Tap 756 2303 800
Swipe 540 1600 540 900 280
Tap 540 1400 800

Write-Host "=== Profile ==="
Tap 972 2303 1800
Tap 1007 209 1200         # bell
Tap 800 1400 600
Tap 644 615 1500          # pencil -> setup
Tap 780 736 600
Tap 74 185 1400
Tap 543 1489 1400         # Edit Profile
Tap 74 185 1200
Tap 543 1639 1400         # Campus
Tap 74 185 1200
Tap 543 1789 1400         # Goals
Tap 74 185 1200
Tap 543 2063 1200         # Notifications
Tap 800 1400 600
Swipe 540 1900 540 700 280
Tap 543 1824 1200         # Privacy (after scroll)
Tap 800 1400 600
Swipe 540 1900 540 700 280
Tap 576 2036 1500         # SIGN OUT
Start-Sleep -Seconds 2

$pidof = (& $adb shell pidof screenrecord | Out-String).Trim().Split()[0]
if ($pidof) { & $adb shell kill -2 $pidof | Out-Null }
Start-Sleep -Seconds 3
try { Stop-Job $job -Force; Remove-Job $job -Force } catch {}

$local = Join-Path $outDir 'ufitness-signup-to-profile.mp4'
& $adb pull /sdcard/ufitness-full.mp4 $local
Get-Item $local | Format-List FullName, Length, LastWriteTime
Write-Host "DONE"
