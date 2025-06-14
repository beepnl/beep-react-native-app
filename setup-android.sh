#!/bin/bash

# BEEP React Native Android Setup Script
# This script helps set up the Android development environment for building the BEEP app

set -e

echo "🔧 Setting up Android build environment for BEEP React Native app..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Some steps may not work on other platforms."
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    print_error "Homebrew is required but not installed. Please install it from https://brew.sh/"
    exit 1
fi

print_success "Homebrew found"

# Check Java installation
print_status "Checking Java installation..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    print_success "Java found: $JAVA_VERSION"
    
    # Check if Java 17 is available (required for AGP 8.0+)
    if /usr/libexec/java_home -v 17 &> /dev/null; then
        JAVA_17_HOME=$(/usr/libexec/java_home -v 17)
        print_success "Java 17 found at: $JAVA_17_HOME"
        export JAVA_HOME="$JAVA_17_HOME"
    else
        print_warning "Java 17 not found. Installing..."
        brew install openjdk@17
        JAVA_17_HOME=$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home
        export JAVA_HOME="$JAVA_17_HOME"
        print_success "Java 17 installed"
    fi
else
    print_warning "Java not found. Installing Java 17..."
    brew install openjdk@17
    JAVA_17_HOME=$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home
    export JAVA_HOME="$JAVA_17_HOME"
    print_success "Java 17 installed"
fi

# Check Android SDK
print_status "Checking Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        print_warning "ANDROID_HOME not set, using default: $ANDROID_HOME"
    elif [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        print_warning "ANDROID_HOME not set, using default: $ANDROID_HOME"
    else
        print_error "Android SDK not found. Please install Android Studio or SDK tools."
        print_error "Set ANDROID_HOME environment variable to your SDK location."
        exit 1
    fi
else
    print_success "ANDROID_HOME found: $ANDROID_HOME"
fi

# Check Android SDK tools
if [ ! -d "$ANDROID_HOME/platform-tools" ]; then
    print_error "Android platform-tools not found in $ANDROID_HOME"
    print_error "Please install Android SDK platform-tools"
    exit 1
fi

# Add to PATH if not already there
if [[ ":$PATH:" != *":$ANDROID_HOME/platform-tools:"* ]]; then
    export PATH="$PATH:$ANDROID_HOME/platform-tools"
    print_status "Added Android platform-tools to PATH"
fi

if [[ ":$PATH:" != *":$ANDROID_HOME/tools:"* ]] && [ -d "$ANDROID_HOME/tools" ]; then
    export PATH="$PATH:$ANDROID_HOME/tools"
    print_status "Added Android tools to PATH"
fi

# Check for required Android API levels
print_status "Checking Android API levels..."
REQUIRED_API=34
if [ -d "$ANDROID_HOME/platforms/android-$REQUIRED_API" ]; then
    print_success "Android API $REQUIRED_API found"
else
    print_warning "Android API $REQUIRED_API not found"
    print_warning "Please install it using Android Studio SDK Manager or sdkmanager"
fi

# Check build tools
REQUIRED_BUILD_TOOLS="34.0.0"
if [ -d "$ANDROID_HOME/build-tools/$REQUIRED_BUILD_TOOLS" ]; then
    print_success "Android Build Tools $REQUIRED_BUILD_TOOLS found"
else
    print_warning "Android Build Tools $REQUIRED_BUILD_TOOLS not found"
    print_warning "Please install it using Android Studio SDK Manager or sdkmanager"
fi

# Generate debug keystore if it doesn't exist
print_status "Checking debug keystore..."
KEYSTORE_PATH="./android/app/debug.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    print_warning "Debug keystore not found. Generating..."
    cd android/app
    keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
    cd ../..
    print_success "Debug keystore generated"
else
    print_success "Debug keystore found"
fi

# Clean and prepare Gradle
print_status "Cleaning Gradle cache and preparing build..."
cd android
./gradlew clean
print_success "Gradle clean completed"

# Test Gradle build
print_status "Testing Gradle configuration..."
if ./gradlew tasks &> /dev/null; then
    print_success "Gradle configuration is valid"
else
    print_error "Gradle configuration has issues. Check the output above."
    exit 1
fi

cd ..

# Set up environment variables for current session
cat << EOF > .env.android
export JAVA_HOME="$JAVA_HOME"
export ANDROID_HOME="$ANDROID_HOME"
export PATH="\$PATH:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/tools"
EOF

print_success "Environment variables saved to .env.android"
print_status "To use in current shell: source .env.android"

# Create .env file for React Native
if [ ! -f ".env" ]; then
    cat << EOF > .env
JAVA_HOME=$JAVA_HOME
ANDROID_HOME=$ANDROID_HOME
EOF
    print_success "Created .env file for React Native"
fi

echo ""
print_success "✅ Android setup completed successfully!"
echo ""
print_status "To build the Android app:"
echo "  1. Source environment: source .env.android"
echo "  2. Start Metro: yarn start"
echo "  3. In another terminal: yarn android"
echo ""
print_status "Or build manually:"
echo "  cd android && ./gradlew assembleDebug"
echo ""
print_warning "Make sure you have:"
print_warning "  - Android Studio installed with SDK Manager"
print_warning "  - Android 34 SDK and build tools installed"
print_warning "  - An Android emulator or physical device connected"