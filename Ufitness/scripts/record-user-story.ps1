$ErrorActionPreference = 'Continue'
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\acer\OneDrive\Desktop\foodApp\Ufitness_mobile_localtest\Ufitness"

function Tap([int]$x, [int]$y, [int]$ms = 1000) {
  Write-Host "TAP $x $y"
  & $adb shell input tap $x $y | Out-Null
  Start-Sleep -Milliseconds $ms
}
function Swipe([int]$y1 = 1750, [int]$y2 = 800) {
  & $adb shell input swipe 540 $y1 540 $y2 300 | Out-Null
  Start-Sleep -Milliseconds 450
}
function TabHome { Tap 108 2338 1500 }
function TabMeals { Tap 324 2338 2500 }
function TabWorkout { Tap 540 2338 4000 }
function TabCommunity { Tap 756 2338 3000 }
function TabProfile { Tap 972 2338 2500 }

Write-Host "Open UFitness"
& $adb reverse tcp:8082 tcp:8082 | Out-Null
& $adb shell input keyevent 3 | Out-Null
Start-Sleep -Seconds 1
& $adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8082" | Out-Null
Start-Sleep -Seconds 14

# If already inside the app, log out so the recording can start at sign up
TabProfile
1..4 | ForEach-Object { Swipe 1900 700 }
Tap 576 2036 2500   # SIGN OUT
Start-Sleep -Seconds 3

Write-Host "RECORD story"
& $adb shell rm -f /sdcard/ufitness-story.mp4 | Out-Null
$job = Start-Job -ScriptBlock {
  param($a)
  & $a shell screenrecord --bit-rate 8000000 --time-limit 180 /sdcard/ufitness-story.mp4
} -ArgumentList $adb
Start-Sleep -Seconds 2

Write-Host "=== 1 SIGN UP ==="
Tap 761 1834 2000          # Register
Tap 541 1967 4000          # Create Account
# Combined fitness setup
Tap 780 736 600            # Muscle building
Tap 516 1331 800           # Experience
Tap 540 1500 700
Tap 167 1805 500           # APK
Swipe 1900 800
Tap 506 2200 2500          # Continue
Tap 1008 185 2000          # Skip if Continue missed

Write-Host "=== 2 WORKOUT ==="
TabWorkout
Tap 1000 185 1800          # Skip gender onboarding
Start-Sleep -Seconds 2
Tap 135 2168 2200          # inner Home
Start-Sleep -Seconds 1
Tap 540 1550 2500          # Start today's workout
Start-Sleep -Seconds 4     # ready countdown / session
Tap 70 160 1500            # leave player if opened
Tap 675 2168 2500          # Workouts catalog
Tap 270 850 2500           # open a program
Start-Sleep -Seconds 3
Tap 70 160 1500
Tap 135 2168 1200

Write-Host "=== 3 GROCERY LIST ==="
TabMeals
Tap 800 1400 600           # dismiss offline alert if any
# Do not tap meal cards (they open YouTube). Scroll to grocery card.
1..4 | ForEach-Object { Swipe 1600 700 }
Tap 220 1700 2500          # Grocery list card (left side, not download)
Start-Sleep -Seconds 2
Tap 180 700 700            # daily/weekly cadence
Tap 400 700 700
Tap 200 950 700            # store chips
Tap 450 950 700
Tap 700 950 700
Tap 540 1300 800           # check an item
Tap 540 1500 800
Tap 540 1700 800
Start-Sleep -Seconds 2
Tap 80 160 1500            # back to Meals

Write-Host "=== 4 BUDDIES + MENTORS ==="
TabCommunity
Start-Sleep -Seconds 2
Tap 680 520 3000           # Buddies
Start-Sleep -Seconds 2
Swipe 1700 800
Start-Sleep -Seconds 2
Tap 70 155 1600
TabCommunity
Tap 920 520 3000           # Mentors
Start-Sleep -Seconds 2
Swipe 1700 800
Start-Sleep -Seconds 2
Tap 70 155 1600

Write-Host "=== 5 COMMUNITY SCROLL ==="
TabCommunity
Start-Sleep -Seconds 2
Swipe 1600 800
Swipe 1600 800
Start-Sleep -Seconds 2

Write-Host "=== 6 SIGN OUT ==="
TabProfile
Start-Sleep -Seconds 2
1..4 | ForEach-Object { Swipe 1900 700 }
Tap 576 2036 3500          # SIGN OUT

Write-Host "=== 7 LOGIN ==="
Start-Sleep -Seconds 2
Tap 541 1652 4000          # Login
Start-Sleep -Seconds 3

$pidof = (& $adb shell pidof screenrecord | Out-String).Trim().Split()[0]
if ($pidof) { & $adb shell kill -2 $pidof | Out-Null }
Start-Sleep -Seconds 3
try { Stop-Job $job -Force; Remove-Job $job -Force } catch {}

$local = Join-Path $outDir "ufitness-user-story.mp4"
& $adb pull /sdcard/ufitness-story.mp4 $local
Get-Item $local | Format-List FullName, Length, LastWriteTime
node -e "const fs=require('fs'); const b=fs.readFileSync(process.argv[1]); const n=b.indexOf(Buffer.from('mvhd')); console.log('sec', (b.readUInt32BE(n+20)/b.readUInt32BE(n+16)).toFixed(1));" $local
Write-Host "DONE"
