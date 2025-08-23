
# BEEP React Native App Analysis

## Project Overview

This is a React Native application designed to interact with BEEP base devices, which are BLE-enabled hardware for beehive monitoring. The application allows users to scan for, connect to, and configure these devices, as well as view sensor data and perform firmware updates.

## Core Technologies

*   **React Native:** The application is built using React Native and TypeScript.
*   **Redux:** State management is handled by Redux, with `redux-persist` for offline storage.
*   **React Navigation:** Navigation between screens is managed by React Navigation.
*   **react-native-ble-manager:** BLE communication is handled by this library.

## BLE Implementation

The core of the application's functionality lies in its interaction with the BEEP base devices via BLE.

*   **`BleHelpers.ts`:** This file is the central hub for all BLE-related operations. It defines constants for BLE services and characteristics, and provides a comprehensive set of methods for scanning, connecting, reading, and writing data to the devices.
*   **Custom BLE Service:** The application uses a custom BLE service with the UUID `be4768a1-719f-4bad-5040-c6ebc5f8c31b`.
*   **Command-Based Communication:** Communication with the BEEP base devices is command-based. The `COMMANDS` object in `BleHelpers.ts` defines a rich set of commands for a wide range of functionalities, including:
    *   Reading sensor data (temperature, weight, audio, tilt, etc.)
    *   Configuring device settings (LoRaWAN, clock, etc.)
    *   Performing firmware updates
    *   Managing data logs

## Key Features

*   **Device Discovery and Pairing:** The app can scan for nearby BEEP base devices and establish a connection.
*   **Device Configuration:** Users can configure a wide range of settings on the BEEP base devices.
*   **Sensor Data Visualization:** The app provides screens for viewing data from various sensors.
*   **Firmware Updates:** The app supports over-the-air (OTA) firmware updates for the BEEP base devices.
*   **Data Logging:** The app can download and export log files from the devices for analysis.
*   **Dual Device Lists:** HomeScreen shows both API-registered devices and nearby BLE devices with automatic deduplication.

## Application Structure

The application follows a standard React Native project structure, with a clear separation of concerns:

*   **`Components`:** Reusable UI components.
*   **`Containers`:** Screens and their associated logic.
*   **`Helpers`:** Utility functions, including the `BleHelpers.ts` file.
*   **`Models`:** Data models for the application.
*   **`Sagas`:** Redux sagas for handling side effects, such as API calls.
*   **`Services`:** Services for interacting with external APIs.
*   **`Stores`:** Redux store configuration, including actions, reducers, and selectors.
*   **`Theme`:** Styles and theme-related configuration.

## Recent Improvements (August 2025)

### BLE Scanning Enhancements

*   **HomeScreen BLE Integration:** Added BLE scanning directly to HomeScreen, showing both API devices and nearby BEEP base devices
*   **Smart Deduplication:** Prevents duplicate devices when the same device exists in both API and BLE scan results
*   **Focus-Based Scanning:** Implements `useFocusEffect` to start/stop scanning based on screen focus, preventing concurrent scan conflicts
*   **Fast Connection Path:** PeripheralDetailScreen now skips scanning if already connected to the target device
*   **Stable React Keys:** Device list uses stable keys (`api-${id}` or `ble-${hardwareId}`) instead of array indices
*   **Improved Error Handling:** More granular error handling that only disconnects failed peripherals rather than all connections

### Navigation Flows

*   **API Devices:** Tap → PeripheralDetailScreen with `connect: true` → Auto-scan and connect
*   **BLE-Only Devices:** Tap → Wizard screen for pairing and registration
*   **Scan Management:** Automatic scan pause when navigating away from HomeScreen or WizardPairPeripheralScreen

### Platform Compatibility

*   **Android:** Full support for bonded peripherals display and Bluetooth enable prompts
*   **iOS:** Graceful handling of Android-only APIs (getBondedPeripherals)
*   **Permissions:** Proper handling of location (Android <12) and Bluetooth (Android 12+) permissions
