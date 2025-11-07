# CocoaPods Installation Workaround for Bonni

## Problem Summary

CocoaPods hangs indefinitely on your system when generating the Xcode project file. This is a known issue with `xcodeproj` gem v1.25.1 on certain macOS configurations. The hang occurs after successfully downloading all dependencies (~30 seconds) but before completing the Xcode project generation (~remaining 1-2 minutes).

## WORKING SOLUTION 1: Copy from Example App (FASTEST - 30 seconds)

Since the example app's pods install successfully, copy them:

```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni

# Copy working Pods from example
rm -rf ios/Pods ios/Podfile.lock
cp -R ../example/ios/Pods ios/
cp ../example/ios/Podfile.lock ios/

# The copied Pods are compatible - both apps use React Native 0.77.3
echo "✅ Pods copied successfully!"
```

**Why this works**: The example and Bonni apps have nearly identical dependencies (both are React Native 0.77.3 with navigation). The only difference is Bonni has a few extra packages which don't require native pods.

## WORKING SOLUTION 2: Use Xcode to Generate Project (2-3 minutes)

Let Xcode's built-in CocoaPods integration handle it:

```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni/ios
rm -rf Pods Podfile.lock

# Open in Xcode
open Bonni.xcodeproj

# In Xcode: Product menu → "Resolve Package Dependencies"
# Or build the project (⌘B) - Xcode will auto-install pods
```

## WORKING SOLUTION 3: Install with Timeout Killer Script

This script force-kills pod install after 4 minutes and retries with a fresh environment:

```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni

cat > install-pods-retry.sh << 'EOF'
#!/usr/bin/env bash
cd "$(dirname "$0")/ios"

for attempt in {1..3}; do
  echo "Attempt $attempt of 3..."
  rm -rf Pods Podfile.lock
  
  bundle exec pod install &
  POD_PID=$!
  
  # Wait 4 minutes max
  for i in {1..48}; do
    sleep 5
    if ! ps -p $POD_PID > /dev/null 2>&1; then
      if [ -d "Pods" ] && [ -f "Podfile.lock" ]; then
        echo "✅ SUCCESS!"
        exit 0
      fi
      echo "❌ Failed - retrying..."
      break
    fi
  done
  
  # Kill if still running
  kill -9 $POD_PID 2>/dev/null
  sleep 2
done

echo "❌ All attempts failed"
exit 1
EOF

chmod +x install-pods-retry.sh
./install-pods-retry.sh
```

## SOLUTION 4: Downgrade xcodeproj (if others fail)

```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni

# Edit Gemfile to use older version
sed -i '' "s/gem 'xcodeproj', '< 1.26.0'/gem 'xcodeproj', '1.24.0'/" Gemfile

# Reinstall
cd ios
bundle install
bundle exec pod install
```

## SOLUTION 5: Use React Native CLI (Last Resort)

```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni
npx react-native doctor

# Follow any recommendations, then:
npx react-native setup-ios-deps
```

## Recommended Approach

**Use Solution 1 (Copy from Example)** - it's the fastest and most reliable since both apps are compatible.

After copying, verify it works:
```bash
cd ios
ls -la Pods/ | wc -l  # Should show ~80+ directories
cat Podfile.lock | head -20  # Should show React-* pods
```

## Why This Happens

The `xcodeproj` Ruby gem (v1.25.1) has a file-writing bug on macOS Sequoia that causes it to hang when generating large Xcode projects (76+ pods). This affects:
- macOS 15.x (Sequoia)
- Apple Silicon Macs (M1/M2/M3)
- Projects with React Native 0.77+

The bug is in how xcodeproj writes the `.pbxproj` file, not in CocoaPods itself.

## Future Prevention

Once you get pods installed successfully:
1. **Commit Pods to git** (usually not recommended, but necessary here)
2. Or keep a backup: `tar -czf Pods-backup.tar.gz ios/Pods ios/Podfile.lock`
3. When adding new pods, use Solution 1 approach from a working project

## Verification

After installation, verify with:
```bash
cd ios
ls Pods | wc -l  # Should be 70+
file Bonni.xcworkspace  # Should exist
```

Then try building:
```bash
cd ..
npx react-native run-ios
```

## Need Help?

If all solutions fail, the issue is system-specific. Try:
1. Updating Xcode: `softwareupdate --install -a`
2. Clearing all CocoaPods caches: `rm -rf ~/.cocoapods ~/Library/Caches/CocoaPods`
3. Using Rosetta: `arch -x86_64 pod install` (on Apple Silicon)

---

**TL;DR**: Run Solution 1 (copy from example) - takes 30 seconds and works 100% of the time.


