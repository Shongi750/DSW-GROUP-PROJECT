$ErrorActionPreference = 'Continue'
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness"
$xmlPath = Join-Path $outDir "scripts\ui.xml"
$parts = @()

function Adb { & $adb @args }

function Sleep-Ms([int]$ms) { Start-Sleep -Milliseconds $ms }

function Tap([int]$x, [int]$y, [int]$waitMs = 900) {
  Write-Host "TAP $x $y"
  Adb shell input tap $x $y | Out-Null
  Sleep-Ms $waitMs
}

function Swipe([int]$x1, [int]$y1, [int]$x2, [int]$y2, [int]$ms = 280) {
  Adb shell input swipe $x1 $y1 $x2 $y2 $ms | Out-Null
  Sleep-Ms 350
}

function Swipe-Up { Swipe 540 1900 540 650 280 }

function Dump-Ui {
  try {
    $p = Start-Process -FilePath $adb -ArgumentList @('shell','uiautomator','dump','/sdcard/ui.xml') -WindowStyle Hidden -PassThru
    if (-not $p.WaitForExit(10000)) {
      try { $p.Kill() } catch {}
      return ''
    }
    Adb pull /sdcard/ui.xml $xmlPath | Out-Null
    if (Test-Path $xmlPath) { return (Get-Content $xmlPath -Raw -ErrorAction SilentlyContinue) }
  } catch {}
  return ''
}

function Center-FromMatch($m) {
  return @{
    x = [int](([int]$m.Groups[1].Value + [int]$m.Groups[3].Value) / 2)
    y = [int](([int]$m.Groups[2].Value + [int]$m.Groups[4].Value) / 2)
  }
}

function Find-Label([string]$xml, [string]$text) {
  if (-not $xml) { return $null }
  $escaped = [regex]::Escape($text)
  $patterns = @(
    "content-desc=`"[^`"]*$escaped[^`"]*`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"",
    "text=`"$escaped`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"",
    "bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*text=`"$escaped`"",
    "bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*content-desc=`"[^`"]*$escaped"
  )
  foreach ($pattern in $patterns) {
    $m = [regex]::Match($xml, $pattern)
    if ($m.Success) { return (Center-FromMatch $m) }
  }
  return $null
}

function Unique-Texts([string]$xml) {
  if (-not $xml) { return @() }
  return [regex]::Matches($xml, 'text="([^"]{2,40})"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
}

$script:fastMode = $false

function Tap-Label([string]$text, [int]$seconds = 8, [hashtable]$fallback = $null) {
  if ($script:fastMode -and $fallback) {
    Write-Host "FAST $text ($($fallback.x),$($fallback.y))"
    Tap $fallback.x $fallback.y 800
    return $true
  }
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    $xml = Dump-Ui
    $pt = Find-Label $xml $text
    if ($pt) {
      Write-Host "FOUND $text ($($pt.x),$($pt.y))"
      Tap $pt.x $pt.y 800
      return $true
    }
    Sleep-Ms 350
  }
  if ($fallback) {
    Write-Host "FALLBACK $text ($($fallback.x),$($fallback.y))"
    Tap $fallback.x $fallback.y 800
    return $true
  }
  Write-Host "MISSING $text"
  return $false
}

function Has-Text([string]$needle) {
  $xml = Dump-Ui
  return ($xml -and $xml.IndexOf($needle) -ge 0)
}

function Dismiss-Alert {
  if ($script:fastMode) {
    Tap 800 1400 350
    return
  }
  $xml = Dump-Ui
  foreach ($label in @('OK','Ok','GOT IT','Got it','Dismiss','Close','WAIT','Wait')) {
    $pt = Find-Label $xml $label
    if ($pt) { Tap $pt.x $pt.y 600; return }
  }
}

function Tab-Home { Tap 108 2303 1100 }
function Tab-Meals { Tap 324 2303 1400 }
function Tab-Workout { Tap 540 2303 1600 }
function Tab-Community { Tap 756 2303 1400 }
function Tab-Profile { Tap 972 2303 1400 }

function Inner-WorkoutTab([int]$index) {
  # Nested workout tabs sit just above UFitness tab bar
  $xs = @(135, 405, 675, 945)
  Tap $xs[$index] 2168 1200
}

function Start-Record([string]$remote) {
  Adb shell rm -f $remote | Out-Null
  $job = Start-Job -ScriptBlock {
    param($adbPath, $path)
    & $adbPath shell screenrecord --bit-rate 6000000 --time-limit 180 $path
  } -ArgumentList $adb, $remote
  Sleep-Ms 1200
  return $job
}

function Stop-Record($job, [string]$remote, [string]$local) {
  $pidof = (Adb shell pidof screenrecord 2>$null)
  if ($pidof) {
    $id = ($pidof | Out-String).Trim().Split()[0]
    if ($id) { Adb shell kill -2 $id | Out-Null }
  }
  Sleep-Ms 2500
  try { Stop-Job $job -ErrorAction SilentlyContinue; Remove-Job $job -Force -ErrorAction SilentlyContinue } catch {}
  Adb pull $remote $local
  if (Test-Path $local) {
    $item = Get-Item $local
    Write-Host "SAVED $($item.FullName) ($([math]::Round($item.Length/1MB, 2)) MB)"
    return $true
  }
  Write-Host "FAILED to pull $remote"
  return $false
}

function Reach-Login {
  Write-Host "=== Preparing Login / Register ==="
  Adb reverse tcp:8082 tcp:8082 | Out-Null
  Dismiss-Alert

  $xml = Dump-Ui
  $texts = Unique-Texts $xml
  Write-Host ("SCREEN: " + (($texts | Select-Object -First 18) -join ' | '))

  if ($xml -match 'Welcome Back' -or $xml -match 'Create Account' -or $xml -match 'UFITNESS') {
    Write-Host "Already on auth"
    if ($xml -match 'Create Account' -and $xml -notmatch 'Welcome Back') {
      Tap-Label 'Log In' 4 @{ x = 700; y = 2200 } | Out-Null
      Sleep-Ms 800
    }
    return
  }

  if ($xml -match 'SKIP' -or $xml -match 'Muscle building') {
    Tap 74 185 1200
    $xml = Dump-Ui
  }

  if ($xml -match 'Profile' -or $xml -match 'Edit Profile' -or $xml -match 'SIGN OUT' -or $xml -match 'Privacy') {
    Tab-Profile
    1..5 | ForEach-Object { Swipe-Up }
    if (-not (Tap-Label 'SIGN OUT' 6 @{ x = 540; y = 1980 })) {
      Tap 540 2050 900
      Tap 540 1880 900
    }
    Sleep-Ms 2500
  } elseif ($xml -match 'Home' -or $xml -match 'Meals' -or $xml -match 'Workout') {
    Tab-Profile
    Sleep-Ms 1000
    1..5 | ForEach-Object { Swipe-Up }
    Tap-Label 'SIGN OUT' 6 @{ x = 540; y = 1980 } | Out-Null
    Sleep-Ms 2500
  }

  $tries = 0
  while ($tries -lt 8) {
    $xml = Dump-Ui
    if ($xml -match 'Welcome Back' -or $xml -match 'Register' -or $xml -match 'Create Account') { break }
    if ($xml -match 'UFITNESS' -and $xml -notmatch 'Profile') { Sleep-Ms 1500; break }
    Tab-Profile
    Swipe-Up; Swipe-Up
    Tap-Label 'SIGN OUT' 3 @{ x = 540; y = 1960 } | Out-Null
    Sleep-Ms 1500
    $tries++
  }
}

function Tour-AuthOnboarding {
  Write-Host "=== Sign up ==="
  $regPt = if ($script:registerPt) { $script:registerPt } else { @{ x = 780; y = 1980 } }
  Tap-Label 'Register' 10 $regPt | Out-Null
  Sleep-Ms 1200
  Tap 980 980 600  # password eye (prefilled form)
  if (-not (Tap-Label 'Create Account' 8 @{ x = 540; y = 1880 })) {
    Swipe-Up
    Tap 540 1880 1000
  }
  Sleep-Ms 1800

  Write-Host "=== Combined fitness setup ==="
  # Click every goal, campus, dropdown, slider, continue
  Tap 284 325 500   # Weight mgmt
  Tap 779 325 500   # Muscle building
  Tap 284 575 500   # General fitness
  Tap 779 575 700   # Endurance
  Tap 779 325 700   # Muscle building (final)

  Tap 540 907 900   # Experience
  if (-not (Tap-Label 'Intermediate' 4 @{ x = 540; y = 1180 })) { Tap-Label 'Beginner' 3 @{ x = 540; y = 1100 } | Out-Null }

  Tap 540 1149 900  # Location
  if (-not (Tap-Label 'Campus gym' 4 @{ x = 540; y = 1280 })) { Tap-Label 'Gym' 3 @{ x = 540; y = 1160 } | Out-Null }

  Tap 167 1381 400  # APK
  Tap 416 1381 400  # APB
  Tap 665 1381 400  # DFC
  Tap 914 1381 400  # SW
  Tap 167 1381 600  # APK final

  Tap 700 1594 400  # budget slider
  Tap 540 1842 900  # funding
  if (-not (Tap-Label 'Self-funded' 4 @{ x = 540; y = 1320 })) { Tap-Label 'NSFAS' 3 @{ x = 540; y = 1200 } | Out-Null }

  if (-not (Tap-Label 'Continue' 6 @{ x = 540; y = 2044 })) {
    Swipe-Up
    Tap 540 2044 1200
  }
  Sleep-Ms 1800
}

function Tour-Home {
  Write-Host "=== Home ==="
  Tab-Home
  Dismiss-Alert
  Tap 90 170 800          # avatar -> Profile
  Tab-Home
  Tap 1000 170 700        # notifications
  Tap-Label 'SEE ALL' 5 @{ x = 980; y = 980 } | Out-Null
  Sleep-Ms 900
  Tab-Home
  Tap-Label 'START' 5 @{ x = 900; y = 1450 } | Out-Null
  Sleep-Ms 900
  Tab-Home
  Swipe-Up
  Tap-Label 'Grilled Power Bowl' 4 @{ x = 540; y = 1500 } | Out-Null
  Sleep-Ms 900
  Tab-Home
  Swipe-Up
  Tap-Label 'Mentors' 4 @{ x = 180; y = 1750 } | Out-Null
  Sleep-Ms 1100
  Tap 70 160 900          # header back if stack
  Tab-Home
  Swipe-Up
  Tap-Label 'Buddies' 4 @{ x = 540; y = 1750 } | Out-Null
  Sleep-Ms 1100
  Tap 70 160 900
  Tab-Home
  Swipe-Up
  Tap 900 1750 1000   # Campus Connect Community card (not the tab)
  Tab-Home
}

function Tour-Meals {
  Write-Host "=== Meals ==="
  Tab-Meals
  Sleep-Ms 1600
  Dismiss-Alert
  Tap 90 190 700          # avatar
  Tab-Meals
  Tap 1000 190 700        # bell
  Dismiss-Alert
  # Day chips / budget / goals / meal cards
  Tap 120 620 500
  Tap 280 620 500
  Tap 440 620 500
  Tap 600 620 500
  Tap 760 620 500
  Tap 920 620 600
  Tap 200 480 500         # budget/goal area
  Tap 540 480 500
  Tap 860 480 600
  Swipe-Up
  Tap 540 1100 900        # first meal card
  Sleep-Ms 800
  Dismiss-Alert
  Tap 540 1600 700
  Tap 70 160 800
  Swipe-Up
  Tap 200 1700 600
  Tap 540 1700 600
  Tap 860 1700 700
}

function Tour-Workout {
  Write-Host "=== Workout ==="
  Tab-Workout
  Sleep-Ms 2000
  if ($script:fastMode) {
    Tap 540 1700 700
    Tap 540 2000 700
  } else {
    $xml = Dump-Ui
    if ($xml -match 'Continue on this device' -or $xml -match 'without an account') {
      Tap-Label 'Continue on this device' 5 @{ x = 540; y = 1700 } | Out-Null
      Sleep-Ms 800
      $xml = Dump-Ui
    }
    if ($xml -match 'Gender' -or $xml -match 'Male') {
      Tap-Label 'Male' 4 @{ x = 540; y = 1100 } | Out-Null
      Tap-Label 'Next' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'Next' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'Next' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'Next' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'Next' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'Next' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'I agree' 3 @{ x = 540; y = 1900 } | Out-Null
      Tap-Label 'Accept' 3 @{ x = 540; y = 2000 } | Out-Null
      Tap-Label 'Continue' 3 @{ x = 540; y = 2000 } | Out-Null
    }
  }

  Inner-WorkoutTab 0   # Home
  Tap 540 900 800
  Tap 540 1300 800
  Inner-WorkoutTab 1   # Plan
  Swipe-Up
  Tap 540 1000 800
  Inner-WorkoutTab 2   # Workouts catalog
  Tap 270 900 900
  Sleep-Ms 800
  Tap 70 160 900
  Tap 810 900 900
  Sleep-Ms 800
  Tap 70 160 900
  Inner-WorkoutTab 3   # Insights
  Swipe-Up
  Tap 540 1100 800
  Inner-WorkoutTab 0
}

function Tour-Community {
  Write-Host "=== Community ==="
  Tab-Community
  Sleep-Ms 1400
  Tap-Label 'Groups' 5 @{ x = 180; y = 520 } | Out-Null
  Sleep-Ms 900
  Tap 70 160 800
  Tab-Community
  Tap-Label 'Challenges' 5 @{ x = 420; y = 520 } | Out-Null
  Sleep-Ms 900
  Tap 70 160 800
  Tab-Community
  Tap-Label 'Buddies' 5 @{ x = 680; y = 520 } | Out-Null
  Sleep-Ms 1200
  Swipe-Up
  Tap 540 1100 800
  Tap 70 160 900
  Tab-Community
  Tap-Label 'Mentors' 5 @{ x = 920; y = 520 } | Out-Null
  Sleep-Ms 1200
  Swipe-Up
  Tap 540 1100 800
  Tap 70 160 900
  Tab-Community
  Swipe-Up
  Tap 540 1400 800   # feed post / like
  Tap 200 1400 600
  Tap 900 400 700    # compose / check-in if present
  Dismiss-Alert
}

function Tour-Profile {
  Write-Host "=== Profile ==="
  Tab-Profile
  Sleep-Ms 1200
  Tap 1000 175 800     # header bell
  Dismiss-Alert
  Tap 700 620 800      # pencil badge
  Sleep-Ms 1000
  # On setup: click a couple of controls then back
  Tap 779 325 500
  Tap 167 1381 400
  Tap 74 185 1100      # back to profile
  Tap-Label 'Edit Profile Details' 5 @{ x = 540; y = 1480 } | Out-Null
  Sleep-Ms 900
  Tap 74 185 1100
  Swipe-Up
  Tap-Label 'Campus Selection' 4 @{ x = 540; y = 1600 } | Out-Null
  Sleep-Ms 900
  Tap 74 185 1100
  Swipe-Up
  Tap-Label 'Fitness Goals' 4 @{ x = 540; y = 1720 } | Out-Null
  Sleep-Ms 900
  Tap 74 185 1100
  Swipe-Up
  Tap-Label 'Notifications' 4 @{ x = 540; y = 1750 } | Out-Null
  Dismiss-Alert
  Swipe-Up
  Tap-Label 'Privacy' 4 @{ x = 540; y = 1880 } | Out-Null
  Dismiss-Alert
  Swipe-Up
  Tap-Label 'SIGN OUT' 4 @{ x = 540; y = 1980 } | Out-Null
}

# ---------- run ----------
Write-Host "Device:"
Adb devices -l
Reach-Login
$xml = Dump-Ui
Write-Host ("AUTH SCREEN: " + ((Unique-Texts $xml | Select-Object -First 20) -join ' | '))
$reg = Find-Label $xml 'Register'
$script:registerPt = @{ x = 780; y = 1980 }
if ($reg) {
  $script:registerPt = $reg
  Write-Host "Register at $($reg.x),$($reg.y)"
}

$remote1 = '/sdcard/ufitness-signup-part1.mp4'
$local1 = Join-Path $outDir 'ufitness-signup-to-profile-part1.mp4'
$job1 = Start-Record $remote1
$script:fastMode = $true
$sw = [System.Diagnostics.Stopwatch]::StartNew()

Tour-AuthOnboarding
Tour-Home
Tour-Meals

$didWorkout = $false
$didCommunity = $false
$didProfile = $false
$needPart2 = $sw.Elapsed.TotalSeconds -gt 150
if (-not $needPart2) {
  Tour-Workout
  $didWorkout = $true
  if ($sw.Elapsed.TotalSeconds -gt 160) { $needPart2 = $true }
}
if (-not $needPart2) {
  Tour-Community
  $didCommunity = $true
  if ($sw.Elapsed.TotalSeconds -gt 160) { $needPart2 = $true }
}
if (-not $needPart2) {
  Tour-Profile
  $didProfile = $true
}

Stop-Record $job1 $remote1 $local1 | Out-Null
$parts += $local1
Write-Host ("Part 1 elapsed {0:n1}s" -f $sw.Elapsed.TotalSeconds)

if (-not $didWorkout -or -not $didCommunity -or -not $didProfile) {
  Write-Host "=== Recording part 2 ==="
  $remote2 = '/sdcard/ufitness-signup-part2.mp4'
  $local2 = Join-Path $outDir 'ufitness-signup-to-profile-part2.mp4'
  $job2 = Start-Record $remote2
  if (-not $didWorkout) { Tour-Workout }
  if (-not $didCommunity) { Tour-Community }
  if (-not $didProfile) { Tour-Profile }
  Stop-Record $job2 $remote2 $local2 | Out-Null
  $parts += $local2
}

Write-Host "RECORDINGS:"
$parts | ForEach-Object { if (Test-Path $_) { Get-Item $_ | Select-Object FullName, Length, LastWriteTime } }
