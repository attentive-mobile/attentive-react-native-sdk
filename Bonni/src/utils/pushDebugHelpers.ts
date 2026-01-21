/**
 * Simple debugging helpers for push notification troubleshooting
 * 
 * These utilities help you quickly check push notification state
 * during debugging sessions.
 */

import PushNotificationIOS from '@react-native-community/push-notification-ios'
import { Platform } from 'react-native'

/**
 * Get detailed push notification permission status
 */
export async function checkPushPermissions(): Promise<void> {
    if (Platform.OS !== 'ios') {
        console.log('❌ Push permissions check only available on iOS')
        return
    }

    return new Promise((resolve) => {
        PushNotificationIOS.checkPermissions((permissions) => {
            console.log('📋 Push Notification Permissions:')
            console.log('   Alert:', permissions.alert ? '✅' : '❌')
            console.log('   Badge:', permissions.badge ? '✅' : '❌')
            console.log('   Sound:', permissions.sound ? '✅' : '❌')
            console.log('   Lock Screen:', permissions.lockScreen ? '✅' : '❌')
            console.log('   Notification Center:', permissions.notificationCenter ? '✅' : '❌')
            console.log('   Critical Alert:', permissions.criticalAlert ? '✅' : '❌')
            console.log('   Authorization Status:', permissions.authorizationStatus)
            
            resolve()
        })
    })
}

/**
 * Request push permissions and log the result
 */
export async function requestPushPermissions(): Promise<void> {
    if (Platform.OS !== 'ios') {
        console.log('❌ Push permissions request only available on iOS')
        return
    }

    console.log('🔐 Requesting push notification permissions...')
    
    return new Promise((resolve) => {
        PushNotificationIOS.requestPermissions({
            alert: true,
            badge: true,
            sound: true,
        }).then((permissions) => {
            console.log('✅ Permissions requested')
            console.log('   Result:', JSON.stringify(permissions, null, 2))
            resolve()
        }).catch((error) => {
            console.error('❌ Failed to request permissions:', error)
            resolve()
        })
    })
}

/**
 * Log current device token if available
 */
export function logDeviceToken(): void {
    console.log('🎫 Checking for device token...')
    console.log('   Note: Token is received asynchronously via "register" event')
    console.log('   Make sure you have a listener set up for PushNotificationIOS.addEventListener("register", ...)')
}

/**
 * Print a summary of push notification setup
 */
export async function printPushSetupSummary(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('📱 PUSH NOTIFICATION SETUP SUMMARY')
    console.log('='.repeat(60))
    
    console.log('\n1️⃣ Platform:', Platform.OS)
    
    if (Platform.OS === 'ios') {
        console.log('\n2️⃣ Permissions:')
        await checkPushPermissions()
        
        console.log('\n3️⃣ Device Token:')
        logDeviceToken()
    } else {
        console.log('\n❌ Push notifications only supported on iOS in this implementation')
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
}

/**
 * Simulate a test notification (for debugging UI)
 */
export function simulateTestNotification(): void {
    if (Platform.OS !== 'ios') {
        console.log('❌ Test notification only available on iOS')
        return
    }

    console.log('🧪 Simulating local test notification...')
    
    PushNotificationIOS.addNotificationRequest({
        id: 'test-notification-' + Date.now(),
        title: 'Test Notification',
        body: 'This is a test notification from the debug helper',
        badge: 1,
        sound: 'default',
        userInfo: {
            test: true,
            timestamp: new Date().toISOString(),
        },
    })
    
    console.log('✅ Local notification scheduled')
}

/**
 * Clear all delivered notifications
 */
export function clearAllNotifications(): void {
    if (Platform.OS !== 'ios') {
        console.log('❌ Clear notifications only available on iOS')
        return
    }

    console.log('🧹 Clearing all delivered notifications...')
    PushNotificationIOS.removeAllDeliveredNotifications()
    console.log('✅ Notifications cleared')
}

/**
 * Get count of delivered notifications
 */
export function getDeliveredNotificationCount(): Promise<number> {
    if (Platform.OS !== 'ios') {
        console.log('❌ Notification count only available on iOS')
        return Promise.resolve(0)
    }

    return new Promise((resolve) => {
        PushNotificationIOS.getDeliveredNotifications((notifications) => {
            const count = notifications.length
            console.log('📬 Delivered notifications:', count)
            if (count > 0) {
                console.log('   Notifications:', JSON.stringify(notifications, null, 2))
            }
            resolve(count)
        })
    })
}

/**
 * Complete debugging session - print all relevant info
 */
export async function debugPushNotifications(): Promise<void> {
    console.log('\n' + '🐛'.repeat(30))
    console.log('STARTING PUSH NOTIFICATION DEBUG SESSION')
    console.log('🐛'.repeat(30) + '\n')
    
    await printPushSetupSummary()
    
    console.log('📊 Additional Info:')
    await getDeliveredNotificationCount()
    
    console.log('\n💡 Tips:')
    console.log('   - Use checkPushPermissions() to verify permissions')
    console.log('   - Use simulateTestNotification() to test notification UI')
    console.log('   - Use clearAllNotifications() to clear notification center')
    console.log('   - Check Xcode console for native APNs logs')
    
    console.log('\n' + '🐛'.repeat(30) + '\n')
}

// Export all functions as a namespace for easy access
export const PushDebug = {
    checkPermissions: checkPushPermissions,
    requestPermissions: requestPushPermissions,
    logToken: logDeviceToken,
    summary: printPushSetupSummary,
    simulate: simulateTestNotification,
    clear: clearAllNotifications,
    count: getDeliveredNotificationCount,
    debug: debugPushNotifications,
}
