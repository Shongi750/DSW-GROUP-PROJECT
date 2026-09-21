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
function Start-Record([string]$remote) {
  & $adb shell rm -f $remote | Out-Null
  $job = Start-Job -ScriptBlock {
    param($adbPath, $path)
    & $adbPath shell screenrecord --bit-rate 8000000 --time-limit 180 $path
  } -ArgumentList $adb, $remote
  Start-Sleep -Seconds 2
  return $job
}
function Stop-Record($job, [string]$remote, [string]$local) {
  Start-Sleep -Seconds 2
  $pidof = (& $adb shell pidof screenrecord | Out-String).Trim().Split()[0]
  if ($pidof) { & $adb shell kill -2 $pidof | Out-Null }
  Start-Sleep -Seconds 3
  try { Stop-Job $job -ErrorAction SilentlyContinue; Remove-Job $job -Force -ErrorAction SilentlyContinue } catch {}
  & $adb pull $remote $local
  if (Test-Path $local) {
    $item = Get-Item $local
    Write-Host "SAVED $($item.FullName) ($([math]::Round($item.Length/1KB)) KB)"
  }
}

Write-Host "Ensure Create Account is on screen"
Swipe 540 1800 540 700 300
Start-Sleep -Milliseconds 500

$remote1 = '/sdcard/ufitness-full-1.mp4'
$local1 = Join-Path $outDir 'ufitness-signup-to-profile-part1.mp4'
$job1 = Start-Record $remote1
$sw = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "=== Sign up ==="
Tap 541 2181 3500   # Create Account ->

Write-Host "=== Onboarding ==="
Tap 284 325 500     # Weight mgmt
Tap 779 325 500     # Muscle
Tap 284 575 500     # General
Tap 779 575 500     # Endurance
Tap 779 325 700     # Muscle final
Tap 540 907 900     # Experience dropdown
Tap 540 1180 800    # Intermediate
Tap 540 1149 900    # Location dropdown
Tap 540 1280 800    # Campus gym
Tap 167 1381 400    # APK
Tap 416 1381 400    # APB
Tap 665 1381 400    # DFC
Tap 914 1381 400    # SW
Tap 167 1381 600    # APK
Tap 700 1594 500    # budget
Tap 540 1842 900    # funding
Tap 540 1320 800    # Self-funded / NSFAS option
Swipe 540 1900 540 800 280
Tap 540 2044 2500   # Continue

Write-Host "=== Home ==="
Tap 108 2303 1500
Tap 90 170 1200          # avatar
Tap 108 2303 1000
Tap 1000 170 900         # bell
Tap 980 980 1200         # SEE ALL
Tap 108 2303 1000
Tap 900 1450 1200        # START
Tap 108 2303 1000
Swipe 540 1900 540 800 280
Tap 540 1500 1200        # meal card
Tap 108 2303 1000
Swipe 540 1900 540 700 280
Tap 180 1750 1400        # Mentors
Tap 70 160 1000
Tap 108 2303 900
Swipe 540 1900 540 700 280
Tap 540 1750 1400        # Buddies
Tap 70 160 1000
Tap 108 2303 900
Swipe 540 1900 540 700 280
Tap 900 1750 1200        # Community card
Tap 108 2303 1000

Write-Host "=== Meals ==="
Tap 324 2303 2000
Tap 90 190 1000
Tap 324 2303 900
Tap 1000 190 900
Tap 800 1400 500         # dismiss alert if any
Tap 120 620 400
Tap 280 620 400
Tap 440 620 400
Tap 600 620 400
Tap 760 620 400
Tap 920 620 500
Tap 200 480 400
Tap 540 480 400
Tap 860 480 500
Swipe 540 1800 540 800 280
Tap 540 1100 1200
Tap 800 1400 500
Tap 70 160 800
Swipe 540 1800 540 800 280
Tap 200 1700 500
Tap 540 1700 500
Tap 860 1700 700

Write-Host "=== Workout ==="
Tap 540 2303 2500
Tap 540 1700 800
Tap 540 2000 800
Tap 135 2168 1100   # inner Home
Tap 540 900 800
Tap 540 1300 800
Tap 405 2168 1100   # Plan
Swipe 540 1800 540 900 280
Tap 540 1000 800
Tap 675 2168 1200   # Workouts
Tap 270 900 1200
Tap 70 160 1000
Tap 810 900 1000
Tap 70 160 1000
Tap 945 2168 1100   # Insights
Swipe 540 1800 540 900 280
Tap 540 1100 800
Tap 135 2168 900

Write-Host "=== Community ==="
Tap 756 2303 1800
Tap 180 520 1200    # Groups
Tap 70 160 900
Tap 756 2303 800
Tap 420 520 1200    # Challenges
Tap 70 160 900
Tap 756 2303 800
Tap 680 520 1400    # Buddies
Swipe 540 1700 540 900 280
Tap 540 1100 800
Tap 70 160 1000
Tap 756 2303 800
Tap 920 520 1400    # Mentors
Swipe 540 1700 540 900 280
Tap 540 1100 800
Tap 70 160 1000
Tap 756 2303 900
Swipe 540 1600 540 900 280
Tap 540 1400 800
Tap 200 1400 600

$elapsed = $sw.Elapsed.TotalSeconds
Write-Host ("Part1 so far {0:n1}s" -f $elapsed)

$doProfileNow = $elapsed -lt 145
if ($doProfileNow) {
  Write-Host "=== Profile (same clip) ==="
  Tap 972 2303 1800
  Tap 1000 175 1200
  Tap 800 1400 600
  Tap 700 620 1500
  Tap 779 325 700
  Tap 167 1381 500
  Tap 74 185 1400
  Swipe 540 1900 540 900 280
  Tap 540 1480 1400
  Tap 74 185 1200
  Swipe 540 1900 540 900 280
  Tap 540 1600 1400
  Tap 74 185 1200
  Swipe 540 1900 540 900 280
  Tap 540 1720 1400
  Tap 74 185 1200
  Swipe 540 1900 540 800 280
  Tap 540 1750 1200
  Tap 800 1400 600
  Swipe 540 1900 540 700 280
  Tap 540 1880 1200
  Tap 800 1400 600
  Swipe 540 1900 540 600 280
  Start-Sleep -Seconds 2
}

Stop-Record $job1 $remote1 $local1
Write-Host ("Part 1 elapsed {0:n1}s" -f $sw.Elapsed.TotalSeconds)

if (-not $doProfileNow) {
  Write-Host "=== Profile part 2 ==="
  $remote2 = '/sdcard/ufitness-full-2.mp4'
  $local2 = Join-Path $outDir 'ufitness-signup-to-profile-part2.mp4'
  $job2 = Start-Record $remote2
  Tap 972 2303 1800
  Tap 1000 175 1400
  Tap 800 1400 700
  Tap 700 620 1600
  Tap 779 325 800
  Tap 540 907 900
  Tap 540 1180 800
  Tap 416 1381 700
  Tap 74 185 1500
  Swipe 540 1900 540 800 280
  Tap 540 1480 1500
  Tap 74 185 1300
  Swipe 540 1900 540 800 280
  Tap 540 1600 1500
  Tap 74 185 1300
  Swipe 540 1900 540 800 280
  Tap 540 1720 1500
  Tap 74 185 1300
  Swipe 540 1900 540 700 280
  Tap 540 1750 1300
  Tap 800 1400 700
  Swipe 540 1900 540 600 280
  Tap 540 1880 1300
  Tap 800 1400 700
  1..3 | ForEach-Object { Swipe 540 1900 540 600 280 }
  Start-Sleep -Seconds 2
  Stop-Record $job2 $remote2 $local2
}

Write-Host "DONE"
