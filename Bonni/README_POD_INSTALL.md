# Pod Installation Guide for Bonni

## The Problem

CocoaPods installation for this React Native 0.77.3 project can hang at various stages due to:
1. Extended file attributes (`com.apple.provenance`)  
2. The `xcodeproj` Ruby gem hanging during Xcode project generation
3. Large dependency tree (76+ pods)
4. Hermes engine download (28MB)

## Solutions

### Option 1: Use the Wrapper Script (Recommended)

Run the install script directly:
```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni
bash install-pods.sh
```

Or use npm:
```bash
npm run pods
```

### Option 2: Manual Installation

If the wrapper script doesn't work, run these commands manually:

```bash
cd /Users/zheref/Xpaces/attentive-react-native-sdk/Bonni

# 1. Clean extended attributes
xattr -cr vendor 2>/dev/null || true
xattr -cr node_modules 2>/dev/null || true  
xattr -cr ios 2>/dev/null || true

# 2. Navigate to iOS directory
cd ios

# 3. Install bundle
bundle install

# 4. Install pods with verbose output (so you can see progress)
NO_FLIPPER=1 bundle exec pod install --verbose
```

## What to Expect

The installation process takes **2-5 minutes** and goes through these stages:

1. **Codegen** (~10 seconds): Generating native module interfaces
2. **Analyzing dependencies** (~30 seconds): Resolving 76+ pod dependencies  
3. **Downloading** (~60 seconds): Downloading Hermes engine (28MB + 20MB)
4. **Installing** (~20 seconds): Installing 76 pods
5. **Generating Xcode project** (~60-120 seconds): Creating `.xcodeproj` files

⚠️ **The script may appear hung during "Generating Xcode project"** - this is normal! The xcodeproj gem is CPU-intensive but doesn't output progress.

## Troubleshooting

### Script appears hung with no output
**Cause**: Extended attributes on script file  
**Solution**:
```bash
xattr -c Bonni/install-pods.sh
bash Bonni/install-pods.sh
```

### Hangs at "Installing target `DoubleConversion`"
**Cause**: xcodeproj gem is generating files (normal, just slow)  
**Solution**: Wait 2-3 minutes. If truly hung (10+ minutes), try:
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install --verbose --no-repo-update
```

### "Operation not permitted" on bundler.lock  
**Cause**: Extended attributes on vendor directory  
**Solution**:
```bash
xattr -cr Bonni/vendor
```

### Download hangs on Hermes engine
**Cause**: Network timeout  
**Solution**: Check network, try again. The file is 28MB and downloads from Maven Central.

## Success Indicators

You'll know it worked when you see:
```
Pod installation complete! There are X dependencies from the Podfile...
```

And these files exist:
- `ios/Pods/` directory
- `ios/Podfile.lock` file
- `ios/Bonni.xcworkspace/` directory

## Still Having Issues?

1. Check that `node_modules` is fully installed: `npm install`
2. Ensure bundle is installed: `cd ios && bundle install`
3. Try the example app's method: `cd ../example && npm run pods` to compare
4. Check Ruby version: `ruby --version` (should be >= 2.6.10)
5. Check CocoaPods version: `bundle exec pod --version` (should be ~1.15.2)

## Alternative: Pre-configured Pods

If pod installation continues to fail, you can copy the working Pods from the example app:
```bash
cp -r ../example/ios/Pods ./ios/
cp ../example/ios/Podfile.lock ./ios/
```

Then run: `cd ios && bundle exec pod install`


