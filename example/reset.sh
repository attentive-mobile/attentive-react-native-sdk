#!/usr/bin/env bash
echo ""
echo "************************"
echo "* Clean all the things *"
echo "************************"
echo ""

# General cleanup
watchman watch-del-all
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/npm-*

# Android cleanup (BEFORE removing node_modules)
cd android || exit
# Stop gradle daemon to release locks
./gradlew --stop 2>/dev/null || true
rm -rf build
rm -rf .gradle
rm -rf app/build
# Clean gradle caches thoroughly
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/daemon
./gradlew clean --refresh-dependencies 2>/dev/null || echo "Gradle clean failed (expected if no node_modules)"

# iOS cleanup
cd ../ios || exit
rm -rf Pods
rm -rf build
rm -rf Podfile.lock
pod deintegrate
npm cache clean --force
pod cache clean --all
# Remove local podspecs cache to avoid version conflicts
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData

# General cleanup (AFTER Android/iOS specific cleanup)
cd ..
rm -rf node_modules

# Install all the things
echo ""
echo "**************************"
echo "* Install all the things *"
echo "**************************"
echo ""
npm install
cd ios || exit
# Install pods with repo update to ensure fresh dependencies
RCT_NEW_ARCH_ENABLED=1 pod install --repo-update
cd ..
echo "Project cleaned and dependencies installed!"
exit 0
