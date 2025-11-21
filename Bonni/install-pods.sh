#!/usr/bin/env bash
set -e

echo ""
echo "****************************"
echo "* Installing iOS Pods      *"
echo "****************************"
echo ""

cd "$(dirname "$0")"

# Check if example app has working pods
if [ -d "../example/ios/Pods" ] && [ -f "../example/ios/Podfile.lock" ]; then
  echo "📦 Using pre-installed pods from example app..."
  echo "   (This avoids CocoaPods xcodeproj hang issue)"
  echo ""
  
  cd ios
  rm -rf Pods Podfile.lock
  cp -R ../../example/ios/Pods .
  cp ../../example/ios/Podfile.lock .
  
  echo "✅ Pods copied successfully!"
  echo ""
  echo "Installed $(ls Pods | wc -l | xargs) pods"
  echo ""
  
  cd ..
  exit 0
fi

# Fallback: Try normal pod install (may hang on some systems)
echo "⚠️  Example pods not found, attempting normal installation..."
echo "   This may hang due to xcodeproj gem issues..."
echo ""

cd ios

# Clear extended attributes that can cause xcodeproj to hang
xattr -cr ../vendor ../node_modules . 2>/dev/null || true

# Ensure bundle is installed
bundle install

# Try pod install with timeout
echo "Installing pods (max 5 minutes)..."
NO_FLIPPER=1 bundle exec pod install &
POD_PID=$!

# Wait up to 5 minutes
for i in {1..60}; do
  sleep 5
  if ! ps -p $POD_PID > /dev/null 2>&1; then
    if [ -d "Pods" ] && [ -f "Podfile.lock" ]; then
      echo ""
      echo "✅ Pod installation completed!"
      cd ..
      exit 0
    else
      echo ""
      echo "❌ Pod installation failed"
      cd ..
      exit 1
    fi
  fi
  
  if [ $i -eq 12 ]; then echo "[1 min] Still running..."; fi
  if [ $i -eq 24 ]; then echo "[2 min] Still running..."; fi
  if [ $i -eq 36 ]; then echo "[3 min] Still running..."; fi
  if [ $i -eq 48 ]; then echo "[4 min] Still running..."; fi
done

# Timeout
kill -9 $POD_PID 2>/dev/null
echo ""
echo "❌ Pod installation timed out after 5 minutes"
echo "   See PODS_WORKAROUND.md for manual solutions"
cd ..
exit 1
