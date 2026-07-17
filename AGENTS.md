# BEEP React Native App - Agent Knowledge Base & Repository Guidelines

This document serves as the primary knowledge base and rule set for AI agents (Gemini/Antigravity) working on the `beep-react-native-app` project. It must be consulted and adhered to during all development tasks.

## 1. Project Architecture & Stack
- **Framework**: React Native (with Expo modules and CLI).
- **State Management**: Redux Toolkit (located in `App/Stores`).
- **Navigation**: React Navigation (using hooks like `useFocusEffect` for lifecycle-aware logic).
- **Core Structure**:
  - `App/Containers/`: Contains the UI screens (e.g., `HomeScreen`, `WizardScreens`, `MaintenanceScreen`, `LogFileScreen`).
  - `App/Helpers/`: Core utilities. `BleHelpers.ts` is the crucial singleton that manages all Bluetooth Low Energy interactions.
  - `App/Models/`: Data parsers that convert raw binary payloads from the firmware into structured TypeScript objects.
  - `App/Components/`: Reusable UI elements, such as `DeviceQuickActions`.
- **Coding Style**: Match existing TypeScript/TSX style. Avoid mass reformatting. Prefer descriptive names for BLE commands and parsers that map 1:1 to firmware terms.

## 2. Firmware & BLE Integration
This repo is the Expo React Native commissioning app for BEEP base (Android and iOS). It must stay in sync with:
- Firmware: `/Users/orlo_1/beep-base-firmware-2` (BLE service UUIDs, command IDs, log file format, DFU behavior).
- Backend: `/Users/orlo_1/BEEP` (firmware index and flashlog upload endpoints).

**Treat the firmware BLE protocol as the source of truth.** When you add or change a BLE command, update both `App/Helpers/BleHelpers.ts` and the corresponding parser in `App/Models`, and verify the command ID and payload layout against `Code/nRF/PRJ/App/beep_types.h` and `Code/nRF/PRJ/App/beep_protocol.c` in the firmware repo.

- **BLE Characteristics**:
  - `BEEP_SERVICE`: `be4768a1-719f-4bad-5040-c6ebc5f8c31b`
  - `CONTROL_POINT_CHARACTERISTIC`: Used for sending commands and receiving configuration data.
  - `LOG_FILE_CHARACTERISTIC`: Used to stream massive binary sensor logs from the flash memory. Keep `BEEP_SERVICE`, `LOG_FILE_CHARACTERISTIC`, and control point UUIDs aligned with the firmware base UUID (the app uses the 128-bit representation).
- **Log Downloads**: The app requests the flash size, triggers a read, and listens to the log characteristic. It parses individual frames, merges them, and uploads them to the backend API. Due to React Navigation constraints (`usePreventRemove`), downloads must finish while the app remains on the `LogFileScreen` (background headless OS transfers are not currently implemented).
- **MTU Optimization (Speed Boost)**: Android BLE transfers historically default to a very slow 20-byte Maximum Transmission Unit. The app explicitly calls `BleManager.requestMTU(peripheralId, 512)` upon connection to drastically speed up custom log downloads and config reads. *(Note: This does not affect Firmware DFU, which handles its own MTU natively within the Nordic Android SDK).*

## 3. Backend Integration
- **Firmware Index**: `ApiService.getFirmwares()` pulls from `firmware/firmware_index.json` (see `/Users/orlo_1/BEEP/firmware_index.json`).
- **Flash Log Uploads**: Logs are posted to `POST /sensors/flashlog` (routes in `/Users/orlo_1/BEEP/routes/api.php`).
- If the log upload format changes, update backend parsing in `app/Models/FlashLog.php` and keep the app’s uploader in sync.

## 4. Development & Environment Constraints
- **Disk Space**: The local macOS development environment is **severely disk-constrained**.
- **Build Failures**: Native compilation (specifically the C++ NDK layer for Android) routinely fails with `No space left on device` or throws random Gradle Evaluation errors.
- **Cleanup Routine**: Before running heavy builds (like `./gradlew assembleDebug bundleRelease`), aggressive cache clearing is required:
  ```bash
  rm -rf ~/.gradle/caches ~/.gradle/daemon android/.gradle android/app/build android/app/.cxx ios/build ios/Pods
  ```
  *Note: Make sure to run cleanup scripts synchronously before triggering background Gradle compilation, or the build daemons will crash from file lock collisions.* You may also need to write `{}` to `package-lock.json` temporarily to even run `rm` commands if the disk is fully at 100% capacity, followed by a restoring `npm install`.

## 5. Recent Fixes & Improvements (v3.2)
- **Automatic BLE Scanning**: Rewrote the `HomeScreen` auto-scan logic. It uses a safe `useFocusEffect` combined with a `useRef` to trigger a non-blocking 10-second BLE scan immediately upon screen focus. Active devices float dynamically to the top of the list in real-time.
- **Wizard Connection State UI Fix**: Patched a fallback logic hole in `WizardPairPeripheralScreen.tsx` (`getSubTitle()`). The subtitle now properly displays "Connected" alongside the device's firmware and hardware versions once successfully paired.
- **LoRaWAN Configuration**: Refactored the `WizardLoRaManualScreen`. Implemented a seamless "Smart Paste" capability that detects and parses raw hex strings or JSON objects directly from the clipboard.
- **Maintenance Flow Auto-Download**: Updated `MaintenanceScreen.tsx` to pass an `autoStart: true` parameter when navigating to the LogFileScreen. `LogFileScreen` now listens for this parameter and automatically initiates the flash log download process.
- **Aesthetics**: Polished `DeviceQuickActions`. Replaced the dark gray backgrounds with a clean `Colors.snow` layout featuring rounded corners, subtle drop shadows, and lighter text for a premium "floating panel" aesthetic.
