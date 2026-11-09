#!/bin/sh
# CI only: installs the app in the emulator, opens it and takes a series of screenshots.
# Results go to annotations, the one CI output readable without a GitHub login. Every step has a
# time limit, because a dead emulator makes adb wait forever.
fail() {
  echo "::error::$1: $(tr '\n' ' ' < step.log | cut -c1-600)"
  echo "::error::Devices: $(timeout 10 adb devices 2>&1 | tr '\n' ' ') Crash log: $(timeout 20 adb logcat -d -b crash 2>&1 | tail -n 15 | tr '\n' ' ' | cut -c1-1500)"
  exit 1
}

timeout 120 adb wait-for-device > step.log 2>&1 || fail "The emulator went away"
timeout 240 adb install -r android/app/build/outputs/apk/debug/app-debug.apk > step.log 2>&1 || fail "Install failed"
echo "::notice::Installed: $(tail -n 1 step.log)"
timeout 120 adb shell am start -W -n com.trainguard.app/.MainActivity > step.log 2>&1 || fail "Launch failed"
echo "::notice::Launched: $(tr '\n' ' ' < step.log | cut -c1-300)"
mkdir -p shots
for shot in 01 02 03 04 05 06 07 08 09 10 11 12; do
  sleep 8
  timeout 60 adb exec-out screencap -p > "shots/$shot.png" 2> step.log || fail "Screenshot $shot failed"
done
