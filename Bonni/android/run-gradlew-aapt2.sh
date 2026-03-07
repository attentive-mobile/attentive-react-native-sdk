#!/bin/sh
# Injects android.aapt2FromMavenOverride into gradle.properties before running
# Gradle, then restores the file. AGP only reads this from gradle.properties
# (before any build.gradle runs), so it must be set there for macOS arm64.
# Uses SDK from local.properties or ANDROID_HOME/ANDROID_SDK_ROOT.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

BUILD_TOOLS_VERSION="35.0.0"
SDK_DIR=""
AAPT2_PATH=""

if [ -f local.properties ]; then
    SDK_DIR=$(grep '^sdk\.dir=' local.properties 2>/dev/null | cut -d= -f2- | tr -d '\r')
fi
if [ -z "$SDK_DIR" ]; then
    SDK_DIR="$ANDROID_HOME"
fi
if [ -z "$SDK_DIR" ]; then
    SDK_DIR="$ANDROID_SDK_ROOT"
fi
if [ -n "$SDK_DIR" ]; then
    AAPT2_PATH="$SDK_DIR/build-tools/$BUILD_TOOLS_VERSION/aapt2"
    if [ ! -f "$AAPT2_PATH" ]; then
        AAPT2_PATH=""
    fi
fi

if [ -n "$AAPT2_PATH" ]; then
    cp gradle.properties gradle.properties.bak
    echo "android.aapt2FromMavenOverride=$AAPT2_PATH" >> gradle.properties
fi

./gradlew.real "$@"
result=$?

if [ -n "$AAPT2_PATH" ]; then
    mv gradle.properties.bak gradle.properties
fi

exit $result
