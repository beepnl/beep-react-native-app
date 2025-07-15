#!/bin/bash

# Fix React Native Doctor Issues
echo "Fixing React Native environment..."

# 1. Set JAVA_HOME to Java 17 (supported version)
export JAVA_HOME=/usr/local/opt/openjdk@17
echo "export JAVA_HOME=/usr/local/opt/openjdk@17" >> ~/.zshrc

# 2. Set ANDROID_HOME to Android SDK location
export ANDROID_HOME=$HOME/Library/Android/sdk
echo "export ANDROID_HOME=$HOME/Library/Android/sdk" >> ~/.zshrc

# 3. Add Android tools to PATH
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> ~/.zshrc

# 4. Add Java 17 to PATH
export PATH=/usr/local/opt/openjdk@17/bin:$PATH
echo "export PATH=/usr/local/opt/openjdk@17/bin:\$PATH" >> ~/.zshrc

echo "Environment variables set:"
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo ""
echo "Java version:"
java -version
echo ""
echo "Android SDK tools:"
which adb
echo ""
echo "Environment fix complete! Run 'source ~/.zshrc' or restart your terminal to apply changes permanently."