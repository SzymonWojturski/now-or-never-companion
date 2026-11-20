#!/usr/bin/env bash
# Starts the emulator (if no device is connected), Metro, and opens the app.
# Ctrl+C stops Metro. The emulator is left running.
# Usage: ./run-android.sh [avd_name]     (default: Pixel_10_Pro)
set -euo pipefail

AVD="${1:-Pixel_10_Pro}"
PKG="com.anonymous.nowornevercompanion"
PORT=8081

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"

cd "$(dirname "$0")"

# 1. Emulator: reuse a connected device, otherwise start the AVD.
if ! adb devices | awk 'NR>1 && $2=="device"' | grep -q .; then
  echo ">> Starting emulator $AVD..."
  nohup emulator -avd "$AVD" -no-snapshot-save > /tmp/emulator-"$AVD".log 2>&1 &
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
fi

# 2. The debug build loads its JS from Metro, so the device must reach it.
adb reverse tcp:$PORT tcp:$PORT >/dev/null

# 3. If the app is not installed yet, build and install it.
if ! adb shell pm list packages | grep -q "package:$PKG"; then
  echo ">> App not installed, building (first time takes several minutes)..."
  npx expo run:android --no-bundler
fi

# 4. Open the app once Metro answers.
(
  until curl -s "http://localhost:$PORT/status" | grep -q "packager-status:running"; do sleep 1; done
  adb shell am force-stop "$PKG"
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
) &

# 5. Metro in the foreground; Ctrl+C (or closing the terminal) stops it.
cleanup() { fuser -k "$PORT/tcp" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM HUP
echo ">> Starting Metro on :$PORT (Ctrl+C to stop)"
npx expo start --port "$PORT"
