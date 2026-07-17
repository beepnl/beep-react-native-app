#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

adb="$ANDROID_HOME/platform-tools/adb"
if [[ ! -x "$adb" ]]; then
  echo "Android adb not found at $adb" >&2
  exit 1
fi

if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  serial="$ANDROID_SERIAL"
else
  devices="$("$adb" devices | awk 'NR > 1 && $2 == "device" { print $1 }')"
  device_count="$(printf '%s\n' "$devices" | awk 'NF { count++ } END { print count + 0 }')"
  if [[ "$device_count" -eq 0 ]]; then
    echo "No authorized Android device is connected." >&2
    exit 1
  fi
  if [[ "$device_count" -gt 1 ]]; then
    echo "Multiple Android devices are connected. Set ANDROID_SERIAL first." >&2
    exit 1
  fi
  serial="$devices"
fi

architecture="$("$adb" -s "$serial" shell getprop ro.product.cpu.abi | tr -d '\r')"
case "$architecture" in
  arm64-v8a|armeabi-v7a|x86|x86_64) ;;
  *)
    echo "Unsupported or unknown Android ABI: $architecture" >&2
    exit 1
    ;;
esac

device_name="$("$adb" devices -l | awk -v serial="$serial" '
  $1 == serial {
    for (i = 1; i <= NF; i++) {
      if ($i ~ /^model:/) {
        sub(/^model:/, "", $i)
        print $i
        exit
      }
    }
  }
')"
if [[ -z "$device_name" ]]; then
  echo "Could not determine the Expo device name for $serial." >&2
  exit 1
fi

export ANDROID_SERIAL="$serial"
export ORG_GRADLE_PROJECT_reactNativeArchitectures="$architecture"
export ORG_GRADLE_PROJECT_androidDebugArchitectures="$architecture"

"$adb" -s "$serial" reverse tcp:8081 tcp:8081
exec npx expo run:android --device "$device_name" "$@"
