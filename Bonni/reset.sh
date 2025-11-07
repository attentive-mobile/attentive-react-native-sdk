#!/usr/bin/env bash
echo ""
echo "************************"
echo "* Clean all the things *"
echo "************************"
echo ""

# General cleanup
echo "General cleanup"
watchman watch-del-all
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/npm-*

# Android cleanup (BEFORE removing node_modules)
echo "Android cleanup (BEFORE removing node_modules)"
cd android || exit
# Kill any gradle daemons to release locks
pkill -f gradle-daemon 2>/dev/null || true
# Remove build directories and gradle caches
echo "Removing build directories and gradle caches"
rm -rf build
rm -rf .gradle
rm -rf app/build
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/daemon
# Note: Skipping gradlew commands as they can hang; direct file deletion is more reliable

# iOS cleanup
echo "iOS cleanup"
cd ../ios || exit
echo "Removing Pods, build, and Podfile.lock"
rm -rf Pods
rm -rf build
rm -rf Podfile.lock
# Remove local podspecs cache to avoid version conflicts
echo "Removing local podspecs cache"
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData
# Note: Skipping 'pod deintegrate' and 'pod cache clean' as they can hang
# Direct file deletion is more reliable for cleanup purposes

# General cleanup (AFTER Android/iOS specific cleanup)
cd ..
# Clean npm cache
npm cache clean --force
rm -rf node_modules

# Install all the things
echo ""
echo "**************************"
echo "* Install all the things *"
echo "**************************"
echo ""
npm install

# Install iOS pods using our wrapper script
./install-pods.sh

echo ""
echo "✅ Project cleaned and dependencies installed!"
exit 0
