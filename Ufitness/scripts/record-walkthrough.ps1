$ErrorActionPreference = 'Continue'
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$xmlPath = "$env:TEMP\ufitness-ui.xml"
$outDir = "C:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness"
$remoteVideo = "/sdcard/ufitness-walkthrough.mp4"
$localVideo = Join-Path $outDir "ufitness-sign-in-to-sign-out.mp4"

function Dump-Ui {
  cmd /c "`"$adb`" shell uiautomator dump /sdcard/ui.xml >NUL 2>&1"
  cmd /c "`"$adb`" pull /sdcard/ui.xml `"$xmlPath`" >NUL 2>&1"
  if (Test-Path $xmlPath) { return Get-Content $xmlPath -Raw -ErrorAction SilentlyContinue }
  return ""
}

function Parse-Center([string]$xml, [string]$pattern) {
  $m = [regex]::Match($xml, $pattern)
  if (-not $m.Success) { return $null }
  $l = [int]$m.Groups[1].Value
  $t = [int]$m.Groups[2].Value
  $r = [int]$m.Groups[3].Value
  $b = [int]$m.Groups[4].Value
  return @{ x = [int](($l + $r) / 2); y = [int](($t + $b) / 2) }
}

function Find-TextCenter([string]$text) {
  $xml = Dump-Ui
  $escaped = [regex]::Escape($text)
  $a = Parse-Center $xml "text=`"$escaped`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`""
  if ($a) { return $a }
  return Parse-Center $xml "bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*text=`"$escaped`""
}

function Wait-Text([string]$text, [int]$seconds = 20) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    $pt = Find-TextCenter $text
    if ($pt) { return $pt }
    Start-Sleep -Milliseconds 400
  }
  return $null
}

function Tap-Text([string]$text, [int]$seconds = 20) {
  $pt = Wait-Text $text $seconds
  if (-not $pt) {
    Write-Host "MISSING: $text"
    return $false
  }
  Write-Host "TAP $text ($($pt.x),$($pt.y))"
  & $adb shell input tap $pt.x $pt.y
  Start-Sleep -Milliseconds 700
  return $true
}

function Tap-Any([string[]]$texts, [int]$seconds = 8) {
  foreach ($text in $texts) {
    if (Tap-Text $text $seconds) { return $true }
  }
  return $false
}

function Swipe-Up {
  & $adb shell input swipe 540 1700 540 700 280
  Start-Sleep -Milliseconds 400
}

function Dismiss-Dialogs {
  Tap-Any @('OK', 'Ok', 'Dismiss', 'Close', 'GOT IT') 3 | Out-Null
  & $adb shell input keyevent 4
  Start-Sleep -Milliseconds 400
}

function Tap-Edit([int]$index) {
  $xml = Dump-Ui
  $matches = [regex]::Matches($xml, 'class="android.widget.EditText"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"')
  if ($matches.Count -eq 0) {
    $matches = [regex]::Matches($xml, 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*class="android.widget.EditText"')
  }
  if ($matches.Count -le $index) { return $false }
  $m = $matches[$index]
  $x = [int](([int]$m.Groups[1].Value + [int]$m.Groups[3].Value) / 2)
  $y = [int](([int]$m.Groups[2].Value + [int]$m.Groups[4].Value) / 2)
  & $adb shell input tap $x $y
  Start-Sleep -Milliseconds 400
  return $true
}

function Type-Text([string]$value) {
  $encoded = $value.Replace(' ', '%s').Replace('@', '%40')
  & $adb shell input text $encoded
  Start-Sleep -Milliseconds 400
}

function Select-Then-Next([string]$choice, [string]$nextLabel = 'Next') {
  if (-not (Tap-Text $choice 12)) {
    Swipe-Up
    if (-not (Tap-Text $choice 6)) { return $false }
  }
  Start-Sleep -Milliseconds 400
  if (-not (Tap-Text $nextLabel 8)) {
    Swipe-Up
    return Tap-Text $nextLabel 8
  }
  return $true
}

Write-Host "Reloading Expo..."
& $adb reverse tcp:8082 tcp:8082 | Out-Null
& $adb shell am force-stop host.exp.exponent
Start-Sleep -Seconds 1
& $adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8082" | Out-Null
Start-Sleep -Seconds 8
Dismiss-Dialogs

if (Wait-Text 'Profile' 8) {
  Write-Host "Already signed in. Logging out first..."
  Dismiss-Dialogs
  Tap-Text 'Profile' 8 | Out-Null
  Start-Sleep -Seconds 1
  Swipe-Up
  if (-not (Tap-Text 'Log out' 8)) { Tap-Text 'Logout' 4 | Out-Null }
  Start-Sleep -Seconds 2
}

Write-Host "Opening from welcome..."
& $adb shell am force-stop host.exp.exponent
Start-Sleep -Seconds 1

Write-Host "Starting screenrecord..."
& $adb shell rm -f $remoteVideo
$recordJob = Start-Job -ScriptBlock {
  param($adb, $remoteVideo)
  & $adb shell screenrecord --bit-rate 8000000 --time-limit 180 $remoteVideo
} -ArgumentList $adb, $remoteVideo

Start-Sleep -Seconds 1
& $adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8082" | Out-Null

Write-Host "Waiting for Login..."
if (-not (Wait-Text 'Welcome Back' 25)) {
  Wait-Text 'Login' 10 | Out-Null
}
Start-Sleep -Seconds 1

if (-not (Tap-Edit 0)) { Tap-Text 'Student Email' 6 | Out-Null }
Type-Text 'demo@uj.ac.za'
if (-not (Tap-Edit 1)) { Tap-Text 'Password' 6 | Out-Null }
Type-Text 'demo1234'
Tap-Text 'Login' 10 | Out-Null
Start-Sleep -Seconds 2

if (Wait-Text "What's your fitness goal?" 8) {
  Write-Host "Onboarding..."
  Select-Then-Next 'Improve general fitness' 'Next' | Out-Null
  Select-Then-Next 'Beginner' 'Next' | Out-Null
  Select-Then-Next 'Gym' 'Next' | Out-Null
  Select-Then-Next 'Under R500' 'Next' | Out-Null
  Select-Then-Next 'NSFAS' 'Next' | Out-Null
  Select-Then-Next 'Auckland Park Kingsway (APK)' 'Finish' | Out-Null
}

Write-Host "On Home..."
Wait-Text 'UFitness' 15 | Out-Null
Start-Sleep -Seconds 2

Write-Host "Opening Profile..."
Tap-Text 'Profile' 12 | Out-Null
Start-Sleep -Seconds 2
Swipe-Up
Start-Sleep -Seconds 1
Tap-Text 'Log out' 12 | Out-Null
Start-Sleep -Seconds 3

Write-Host "Stopping screenrecord..."
$pidof = & $adb shell pidof screenrecord
if ($pidof) {
  & $adb shell kill -2 $pidof.Trim()
}
Start-Sleep -Seconds 3
try { Stop-Job $recordJob -ErrorAction SilentlyContinue; Remove-Job $recordJob -Force -ErrorAction SilentlyContinue } catch {}

& $adb pull $remoteVideo $localVideo
Write-Host "Saved $localVideo"
if (Test-Path $localVideo) { Get-Item $localVideo | Format-List FullName, Length, LastWriteTime }
