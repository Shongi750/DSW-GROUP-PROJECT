@echo off
REM UFitness - start Expo for Expo Go (SDK 57)
REM Usage: double-click, or run "start-ufitness.bat tunnel" if LAN/hotspot does not work.
cd /d "%~dp0"
if not exist node_modules (
  echo Installing packages, first run only...
  call npm install
)
if not exist .env (
  echo.
  echo WARNING: .env is missing. Copy .env.example to .env and paste the shared
  echo Supabase URL and anon key from Karabo. The app cannot sign in without it.
  echo.
)
if /I "%1"=="tunnel" (
  call npx expo start --tunnel --go --clear
) else (
  call npx expo start --lan --go --clear
)
