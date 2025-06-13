# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application for BEEP Base - a beehive monitoring system that communicates with Bluetooth Low Energy (BLE) devices. The app allows users to configure, calibrate, and monitor beehive sensors including temperature, weight, audio, tilt, and LoRaWAN connectivity.

## Build and Development Commands

### Setup
```bash
# Install dependencies
yarn install

# Setup iOS (requires macOS)
cd ios && pod install && cd ..

# Create configuration file
# Copy App/Config/index.staging.ts or index.production.ts to App/Config/index.ts and configure API endpoints
```

### Running the Application

#### iOS
```bash
# Setup iOS (requires macOS)
cd ios && pod install && cd ..

# Start Metro bundler
yarn start

# Run on iOS (requires Xcode and iOS simulator)
react-native run-ios
```

#### Android
```bash
# First-time Android setup (automated)
./setup-android.sh

# Manual Android setup requirements:
# - Java 17+ (recommended: OpenJDK 17)
# - Android SDK API 34
# - Android Build Tools 34.0.0
# - ANDROID_HOME environment variable set

# Start Metro bundler
yarn start

# Run on Android (requires Android Studio and emulator/device)
react-native run-android

# Alternative: build manually
cd android && ./gradlew assembleDebug
```

## Architecture

The application follows a Redux-based architecture with clear separation of concerns:

### Core Architecture Components

- **Redux Store**: Global state management with persistence via `redux-persist`
- **Redux Saga**: Handles side effects and async operations (API calls, BLE communication)
- **React Navigation**: Stack-based navigation with authenticated and unauthenticated flows
- **BLE Communication**: Custom Bluetooth Low Energy manager for BEEP Base device communication

### Directory Structure

- **App/Components**: Reusable UI components
- **App/Containers**: Screen containers (smart components)
- **App/Services**: External service interfaces (API, Navigation, BLE)
- **App/Stores**: Redux stores (actions, reducers, selectors)
- **App/Sagas**: Redux saga middleware for async operations
- **App/Models**: Data models and parsers for BLE communication
- **App/Helpers**: Utility functions and custom hooks
- **App/Theme**: Styling constants and themes

### Key Services

#### BleHelpers (`App/Helpers/BleHelpers.ts`)
- Central BLE communication manager
- Handles device scanning, connection, and data exchange
- Command definitions for BeepBase device communication
- Log file management and data parsing
- Uses `react-native-ble-manager` with custom protocol implementation

#### ApiService (`App/Services/ApiService.ts`)
- HTTP client using `apisauce`
- Handles authentication and device registration
- Supports both production and test API endpoints
- Token-based authentication management

### State Management

The Redux store is organized into domains:
- **auth**: Authentication state
- **api**: API request state and errors
- **settings**: Application settings with persistence
- **user**: User data with persistence
- **beepBase**: BLE device state, sensor data, and connection status

### Navigation Flow

- **AuthStack**: Login screen for unauthenticated users
- **AppStack**: Main application screens for authenticated users
- **WizardStack**: Setup wizard for new device configuration

### Bluetooth Communication

The app communicates with BEEP Base devices using a custom BLE protocol:
- Service UUID: `be4768a1-719f-4bad-5040-c6ebc5f8c31b`
- Control Point Characteristic: `000068b0-0000-1000-8000-00805f9b34fb`
- Log File Characteristic: `be4768a3-719f-4bad-5040-c6ebc5f8c31b`

Commands include sensor readings, configuration, firmware updates, and log file transfers.

## Development Notes

### Build Requirements

#### Android
- **Java**: OpenJDK 17+ (required for Android Gradle Plugin 8.0+)
- **Android SDK**: API 34 (targetSdkVersion)
- **Build Tools**: 34.0.0
- **Gradle**: 8.0.2 (configured in wrapper)
- **AGP**: 8.0.2 (Android Gradle Plugin)
- **Environment**: ANDROID_HOME must be set

#### iOS  
- **Xcode**: Latest version for React Native compatibility
- **CocoaPods**: For native dependency management
- **iOS SDK**: 11.0+ minimum deployment target

### Configuration
- Environment-specific configs in `App/Config/`: copy staging or production config to `index.ts`
- TypeScript configuration optimized for React Native
- Metro bundler configured for React Native assets
- Automated Android setup script: `./setup-android.sh`

### Platform-Specific Code
- iOS: Uses CocoaPods for native dependencies
- Android: Modern Gradle build system with updated dependencies
- BLE permissions: Configured for Android 12+ (API 31+) requirements
- Cross-platform BLE implementation with platform-specific permission requests

### Build Optimizations
- **Hermes**: Enabled by default for better JavaScript performance
- **Proguard/R8**: Enabled for release builds
- **Gradle**: Parallel builds and caching enabled
- **Memory**: Optimized JVM settings (4GB heap)

### Key Dependencies
- React Native 0.70+ (check node_modules for exact version)
- Redux ecosystem: redux, react-redux, redux-persist, redux-saga
- Bluetooth: react-native-ble-manager
- Navigation: @react-navigation/native, @react-navigation/native-stack
- Internationalization: react-i18next
- File operations: react-native-fs, react-native-file-access

### Troubleshooting
- **Build failures**: Run `./setup-android.sh` to verify environment
- **Java issues**: Ensure Java 17+ is installed and JAVA_HOME is set
- **Android SDK**: Use Android Studio SDK Manager to install required components
- **Gradle cache**: `cd android && ./gradlew clean` to clear build cache
- **Metro cache**: `yarn start --reset-cache` to clear Metro bundler cache

### Testing
- Jest configuration for unit testing
- React Native Testing Library for component testing
- No test scripts appear to be configured in the current setup