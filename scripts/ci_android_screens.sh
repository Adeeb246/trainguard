#!/bin/sh
# CI only: installs the app in the emulator, opens it and takes the three screenshots.
# Failures go to annotations, the one CI output readable without a GitHub login.
fail() {
  echo "::error::$1: $(tr '\n' ' ' < step.log | cut -c1-600)"
  echo "::error::Crash log: $(adb logcat -d -b crash 2>&1 | tail -n 15 | tr '\n' ' ' | cut -c1-1500)"
  exit 1
}

adb wait-for-device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk > step.log 2>&1 || fail "Install failed"
adb shell am start -W -n com.trainguard.app/.MainActivity > step.log 2>&1 || fail "Launch failed"
mkdir -p shots
for shot in 1-pass 2-journey 3-safety; do
  sleep 20
  adb exec-out screencap -p > "shots/$shot.png" 2> step.log || fail "Screenshot failed"
done
