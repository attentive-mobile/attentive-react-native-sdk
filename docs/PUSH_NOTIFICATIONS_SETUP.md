# Push Notifications Setup Guide for TestFlight

This guide provides step-by-step instructions to enable push notifications for the Bonni app when archiving and uploading to TestFlight.

## ✅ What's Already Implemented

Based on the latest commits (commit `fdd1d94` - "Enable sample app for PNs"), the following has been completed:

### Code Implementation ✅
1. **Push Notification Library**: `@react-native-community/push-notification-ios` v1.11.0 installed
2. **AppDelegate.swift**: Complete push notification handling implementation:
   - Device token registration forwarding
   - Error handling
   - Foreground notification handling
   - Background notification handling
   - UNUserNotificationCenter delegate setup
3. **App.tsx**: Complete React Native push notification setup:
   - Device token registration listeners
   - Permission requests
   - Foreground notification handling
   - Background notification handling
   - Initial notification handling (app launched from notification)
   - Integration with Attentive SDK (`registerDeviceToken`, `handleForegroundNotification`, `handlePushOpened`)
4. **Bridging Header**: Configured to expose `RNCPushNotificationIOS` to Swift
5. **Info.plist**: Contains `UIBackgroundModes` with `remote-notification` entry
6. **Entitlements File**: Created with `aps-environment` (now set to `production` for TestFlight)

### Project Configuration ✅
- Bundle Identifier: `com.attentive.rn.example.Bonni`
- Entitlements file linked in build settings
- Swift bridging header configured
- Pods installed and configured

---

## 📋 Step-by-Step Setup for TestFlight

### Step 1: Apple Developer Portal - App ID Configuration

1. **Log in to Apple Developer Portal**
   - Go to https://developer.apple.com/account
   - Sign in with your Apple Developer account

2. **Navigate to Certificates, Identifiers & Profiles**
   - Click on "Certificates, Identifiers & Profiles" in the sidebar

3. **Configure App ID**
   - Click on "Identifiers" in the sidebar
   - Find and select your App ID: `com.attentive.rn.example.Bonni`
   - If it doesn't exist, click "+" to create a new App ID:
     - Description: "Bonni Beauty App"
     - Bundle ID: `com.attentive.rn.example.Bonni`
     - Capabilities: Check "Push Notifications"
   - If it exists, click on it and ensure "Push Notifications" capability is enabled
   - Click "Save"

### Step 2: Create APNs Authentication Key (Recommended) or Certificate

#### Option A: APNs Authentication Key (Recommended - Works for all apps)

1. **Create APNs Key**
   - In Apple Developer Portal, go to "Keys" section
   - Click "+" to create a new key
   - Key Name: "Bonni APNs Key" (or any descriptive name)
   - Check "Apple Push Notifications service (APNs)"
   - Click "Continue" then "Register"
   - **IMPORTANT**: Download the `.p8` key file immediately (you can only download it once)
   - Note the Key ID shown on the page
   - Note your Team ID (found in the top right corner of the portal)

2. **Configure Your Push Notification Platform**
   - Upload the `.p8` key file to your push notification platform
   - Provide the Key ID and Team ID
   - The platform will use this key to send push notifications

#### Option B: APNs Certificate (Alternative - App-specific)

1. **Create APNs Certificate**
   - In Apple Developer Portal, go to "Certificates" section
   - Click "+" to create a new certificate
   - Select "Apple Push Notification service SSL (Sandbox & Production)"
   - Select your App ID: `com.attentive.rn.example.Bonni`
   - Follow the certificate creation wizard
   - Download the certificate and install it in Keychain Access
   - Export as `.p12` file for your push notification platform

### Step 3: Xcode Project Configuration

1. **Open Xcode Project**
   ```bash
   cd Bonni/ios
   open Bonni.xcworkspace
   ```
   ⚠️ **Important**: Always open `.xcworkspace`, not `.xcodeproj`

2. **Select the Bonni Target**
   - In Xcode, select the "Bonni" project in the navigator
   - Select the "Bonni" target
   - Go to "Signing & Capabilities" tab

3. **Configure Signing**
   - Check "Automatically manage signing"
   - Select your Team from the dropdown
   - Ensure Bundle Identifier is: `com.attentive.rn.example.Bonni`
   - Xcode should automatically create/update the provisioning profile

4. **Verify Push Notifications Capability**
   - In the "Signing & Capabilities" tab, click "+ Capability"
   - Add "Push Notifications" if it's not already there
   - Verify that the capability shows as enabled (green checkmark)

5. **Verify Entitlements**
   - Ensure `Bonni.entitlements` is selected in "Code Signing Entitlements"
   - Verify the entitlements file contains:
     ```xml
     <key>aps-environment</key>
     <string>production</string>
     ```
   - For TestFlight, this MUST be `production` (not `development`)

### Step 4: Build Configuration for Archive

1. **Select Release Scheme**
   - In Xcode, select "Any iOS Device" or a connected device (not a simulator)
   - Product → Scheme → Edit Scheme
   - Ensure "Archive" uses "Release" configuration

2. **Clean Build Folder**
   - Product → Clean Build Folder (Shift + Cmd + K)

3. **Archive the Build**
   - Product → Archive
   - Wait for the archive to complete
   - The Organizer window should open automatically

### Step 5: Upload to TestFlight

1. **Distribute App**
   - In the Organizer window, select your archive
   - Click "Distribute App"
   - Select "App Store Connect"
   - Click "Next"

2. **Select Distribution Options**
   - Choose "Upload" (not "Export")
   - Click "Next"

3. **Select Distribution Content**
   - Ensure "Include bitcode for iOS content" is unchecked (React Native doesn't use bitcode)
   - Click "Next"

4. **Review and Upload**
   - Review the app information
   - Click "Upload"
   - Wait for the upload to complete

5. **Verify in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Navigate to your app
   - Go to TestFlight tab
   - Wait for processing to complete (can take 10-30 minutes)
   - Once processed, the build will be available for testing

### Step 6: Test Push Notifications

1. **Install App from TestFlight**
   - Install the app on a physical iOS device via TestFlight
   - Launch the app

2. **Grant Push Notification Permission**
   - The app will request push notification permission on first launch
   - Tap "Allow" to grant permission

3. **Verify Device Token Registration**
   - Check the Xcode console or device logs for:
     ```
     [Attentive] Device token registered: <token>...
     ```
   - The device token should be registered with your push notification platform

4. **Send Test Push Notification**
   - Use your push notification platform to send a test notification
   - The notification should appear on the device
   - Verify the app handles the notification correctly (foreground, background, terminated states)

---

## 🔧 Troubleshooting

### Issue: "No valid 'aps-environment' entitlement found"

**Solution**: 
- Ensure `Bonni.entitlements` file exists and is linked in Build Settings
- Verify `aps-environment` is set to `production` (not `development`)
- Clean build folder and rebuild

### Issue: Push notifications work in development but not in TestFlight

**Solution**:
- Verify `aps-environment` is set to `production` in entitlements
- Ensure you're using production APNs certificates/keys (not sandbox)
- Check that Push Notifications capability is enabled in Apple Developer Portal

### Issue: "Failed to register for remote notifications"

**Solution**:
- Ensure the app is running on a physical device (not simulator)
- Check that push notification permissions were granted
- Verify the App ID has Push Notifications enabled in Apple Developer Portal
- Check device network connectivity

### Issue: Device token not received

**Solution**:
- Verify `UNUserNotificationCenter.current().delegate = self` is set in AppDelegate
- Check that `registerForPushNotifications()` is called in App.tsx
- Ensure the app has requested and received notification permissions
- Check Xcode console for error messages

### Issue: Notifications not appearing when app is in foreground

**Solution**:
- Verify `userNotificationCenter(_:willPresent:withCompletionHandler:)` is implemented in AppDelegate
- Ensure completion handler is called with appropriate options: `[.banner, .sound, .badge]`

---

## 📝 Important Notes

1. **Development vs Production**:
   - For local development/testing: Use `aps-environment: development`
   - For TestFlight/App Store: Use `aps-environment: production`
   - The current configuration uses `production` for TestFlight compatibility

2. **Simulator Limitations**:
   - Push notifications do NOT work on iOS Simulator
   - Always test on a physical device

3. **Provisioning Profiles**:
   - Xcode will automatically manage provisioning profiles if "Automatically manage signing" is enabled
   - Ensure your Apple Developer account has the necessary permissions

4. **Bundle Identifier**:
   - Must match exactly: `com.attentive.rn.example.Bonni`
   - Must be registered in Apple Developer Portal with Push Notifications enabled

5. **APNs Environment**:
   - TestFlight uses the **production** APNs environment
   - Development builds can use either development or production (depending on provisioning profile)

---

## 🔄 Switching Between Development and Production

If you need to switch between development and production APNs environments:

1. **For Development Testing**:
   - Edit `Bonni/ios/Bonni/Bonni.entitlements`
   - Change `aps-environment` to `development`
   - Use development provisioning profile

2. **For TestFlight/Production**:
   - Edit `Bonni/ios/Bonni/Bonni.entitlements`
   - Change `aps-environment` to `production`
   - Use production/distribution provisioning profile

Alternatively, you can create separate entitlements files and configure them per build configuration in Xcode.

---

## ✅ Verification Checklist

Before uploading to TestFlight, verify:

- [ ] Push Notifications capability enabled in Apple Developer Portal for App ID
- [ ] APNs key or certificate created and configured in your push notification platform
- [ ] `aps-environment` set to `production` in `Bonni.entitlements`
- [ ] Push Notifications capability added in Xcode (Signing & Capabilities)
- [ ] Code signing configured with correct Team and Bundle ID
- [ ] App builds and archives successfully
- [ ] Archive uploaded to App Store Connect
- [ ] Build processed successfully in TestFlight
- [ ] App installed on physical device via TestFlight
- [ ] Push notification permission granted
- [ ] Device token received and logged
- [ ] Test push notification sent and received successfully

---

## 📚 Additional Resources

- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [React Native Push Notification iOS Library](https://github.com/react-native-community/push-notification-ios)
- [Apple Developer Portal](https://developer.apple.com/account)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## 🎯 Summary

The code implementation is **complete and ready**. To enable push notifications in TestFlight:

1. ✅ Configure App ID with Push Notifications in Apple Developer Portal
2. ✅ Create APNs authentication key or certificate
3. ✅ Verify Xcode project settings (already configured)
4. ✅ Archive and upload to TestFlight
5. ✅ Test on physical device

The main change needed was updating `aps-environment` from `development` to `production` in the entitlements file, which has been done.

