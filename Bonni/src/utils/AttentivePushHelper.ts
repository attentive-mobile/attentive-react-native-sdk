/**
 * AttentivePushHelper
 *
 * Helper class for managing Attentive push notifications in React Native.
 * Implements the same logic as the native Swift callback-based approach.
 *
 * @example
 * ```typescript
 * import { attentivePush } from './utils/AttentivePushHelper';
 *
 * // Initialize in your App component
 * useEffect(() => {
 *   attentivePush.initialize();
 *   return () => attentivePush.cleanup();
 * }, []);
 * ```
 */

import { Platform } from 'react-native'
import PushNotificationIOS, { PushNotification } from '@react-native-community/push-notification-ios'
import {
    registerDeviceToken,
    registerForPushNotifications,
    handleForegroundNotification,
    handlePushOpened,
    type PushAuthorizationStatus,
} from 'attentive-react-native-sdk'

/**
 * Helper class for managing Attentive push notifications
 * Implements the same logic as the native Swift callback-based approach
 */
export class AttentivePushHelper {
    private static instance: AttentivePushHelper
    private deviceToken: string | null = null
    private isRegistered: boolean = false

    private constructor() {}

    /**
     * Get the singleton instance
     * @returns The singleton AttentivePushHelper instance
     */
    public static getInstance(): AttentivePushHelper {
        if (!AttentivePushHelper.instance) {
            AttentivePushHelper.instance = new AttentivePushHelper()
        }
        return AttentivePushHelper.instance
    }

    /**
     * Initialize push notifications with Attentive SDK
     * This mirrors the Swift AppDelegate implementation
     *
     * @example
     * ```typescript
     * await attentivePush.initialize();
     * ```
     */
    public async initialize(): Promise<void> {
        console.log('🚀 [AttentivePush] STEP 1: Initializing push notification system', { platform: Platform.OS })

        if (Platform.OS !== 'ios') {
            console.log('[AttentivePush] Android push notifications not yet implemented')
            return
        }

        try {
            // Set up event listeners
            console.log('📝 [AttentivePush] STEP 2: Setting up event listeners')
            this.setupEventListeners()

            // Request push notification permissions
            console.log('🔐 [AttentivePush] STEP 3: Requesting push notification permissions')
            await this.requestPermissions()

            console.log('✅ [AttentivePush] Initialization complete')
        } catch (error) {
            console.error('❌ [AttentivePush] Initialization failed:', error)
        }
    }

    /**
     * Request push notification permissions
     * Equivalent to calling registerForPushNotifications() in Swift
     */
    private async requestPermissions(): Promise<void> {
        console.log('🌉 [AttentivePush] Calling native: registerForPushNotifications()')
        registerForPushNotifications()
    }

    /**
     * Setup event listeners for push notifications
     * Mirrors the AppDelegate delegate methods
     */
    private setupEventListeners(): void {
        // Handle device token registration
        // Equivalent to: didRegisterForRemoteNotificationsWithDeviceToken
        PushNotificationIOS.addEventListener('register', (deviceToken: string) => {
            this.handleDeviceTokenRegistration(deviceToken)
        })

        // Handle registration errors
        // Equivalent to: didFailToRegisterForRemoteNotificationsWithError
        PushNotificationIOS.addEventListener('registrationError', (error) => {
            this.handleRegistrationError(error)
        })

        // Handle foreground notifications
        // Equivalent to: willPresent notification
        PushNotificationIOS.addEventListener('notification', (notification: PushNotification) => {
            this.handleForegroundNotification(notification)
        })

        // Handle notification tap
        // Equivalent to: didReceive response
        PushNotificationIOS.addEventListener('localNotification', (notification: PushNotification) => {
            this.handleNotificationTap(notification)
        })
    }

    /**
     * Handle device token registration with callback-like logic
     * Implements the same flow as the Swift callback-based method:
     * 1. Get authorization status
     * 2. Register device token
     * 3. Trigger regular open event (simulated)
     *
     * @param deviceToken - The device token from APNs
     */
    private async handleDeviceTokenRegistration(deviceToken: string): Promise<void> {
        console.log('🎫 [AttentivePush] STEP 4: Device token received from APNs')
        console.log('   Token (preview):', deviceToken.substring(0, 16) + '...')
        console.log('   Token (full):', deviceToken)
        console.log('   Token length:', deviceToken.length)

        this.deviceToken = deviceToken

        try {
            // Get current authorization status
            const authStatus = await this.getAuthorizationStatus()
            console.log('✅ [AttentivePush] STEP 5: Authorization status:', authStatus)

            // Register device token with Attentive SDK
            console.log('📤 [AttentivePush] STEP 6: Registering device token with Attentive SDK')
            console.log('   Token:', deviceToken.substring(0, 16) + '...')
            console.log('   Auth Status:', authStatus)
            console.log('🌉 [AttentivePush] Calling native: registerDeviceToken()')

            registerDeviceToken(deviceToken, authStatus)

            console.log('✅ [AttentivePush] STEP 7: Device token registered successfully')

            // Mark as registered
            this.isRegistered = true

            // Trigger regular open event
            console.log('📱 [AttentivePush] STEP 8: Triggering regular open event')
            this.handleRegularOpen(authStatus)

        } catch (error) {
            console.error('❌ [AttentivePush] Device token registration failed:', error)
            console.error('   Error details:', JSON.stringify(error, null, 2))

            // Even on failure, trigger regular open event
            const authStatus = await this.getAuthorizationStatus()
            this.handleRegularOpen(authStatus)
        }
    }

    /**
     * Handle registration errors
     * Equivalent to: didFailToRegisterForRemoteNotificationsWithError
     *
     * @param error - The registration error
     */
    private async handleRegistrationError(error: any): Promise<void> {
        console.error('❌ [AttentivePush] Failed to register for remote notifications')
        console.error('   Error:', error)
        console.error('   Error details:', JSON.stringify(error, null, 2))

        // Even on failure, trigger regular open event
        const authStatus = await this.getAuthorizationStatus()
        this.handleRegularOpen(authStatus)
    }

    /**
     * Handle regular/direct open event
     * This is called after device token registration (success or failure)
     * Equivalent to: handleRegularOpen(authorizationStatus:)
     *
     * Note: The native SDK's handleRegularOpen is not exposed to React Native.
     * This is a placeholder that logs the event. For full functionality,
     * implement push handling in AppDelegate.
     *
     * @param authStatus - Current authorization status
     */
    private handleRegularOpen(authStatus: PushAuthorizationStatus): void {
        console.log('📱 [AttentivePush] Regular open event triggered')
        console.log('   Authorization status:', authStatus)
        console.log('   Note: handleRegularOpen is not exposed to React Native')
        console.log('   For full functionality, implement in native AppDelegate')
    }

    /**
     * Get current authorization status
     * @returns Promise that resolves to the authorization status
     */
    private async getAuthorizationStatus(): Promise<PushAuthorizationStatus> {
        return new Promise((resolve) => {
            PushNotificationIOS.checkPermissions((permissions) => {
                if (permissions.alert || permissions.badge || permissions.sound) {
                    resolve('authorized')
                } else if (permissions.authorizationStatus === 0) {
                    resolve('notDetermined')
                } else {
                    resolve('denied')
                }
            })
        })
    }

    /**
     * Handle foreground notification
     * Equivalent to: willPresent notification
     *
     * @param notification - The notification object
     */
    private handleForegroundNotification(notification: PushNotification): void {
        const userInfo = notification.getData()
        console.log('📬 [AttentivePush] Notification received in foreground')
        console.log('   User info:', JSON.stringify(userInfo, null, 2))

        // Notify Attentive SDK
        console.log('🌉 [AttentivePush] Calling native: handleForegroundNotification()')
        handleForegroundNotification(userInfo)

        // Complete the notification
        notification.finish(PushNotificationIOS.FetchResult.NoData)
    }

    /**
     * Handle notification tap
     * Equivalent to: didReceive response
     *
     * @param notification - The notification object
     */
    private async handleNotificationTap(notification: PushNotification): Promise<void> {
        const userInfo = notification.getData()
        console.log('👆 [AttentivePush] Notification tapped by user')
        console.log('   User info:', JSON.stringify(userInfo, null, 2))

        const authStatus = await this.getAuthorizationStatus()
        console.log('   Authorization status:', authStatus)

        // Track push open event
        console.log('🌉 [AttentivePush] Calling native: handlePushOpened()')
        handlePushOpened(userInfo, 'inactive', authStatus)

        // Complete the notification
        notification.finish(PushNotificationIOS.FetchResult.NoData)
    }

    /**
     * Check if push notifications are registered
     * @returns true if device token has been registered
     */
    public isDeviceRegistered(): boolean {
        return this.isRegistered
    }

    /**
     * Get the current device token
     * @returns The device token or null if not registered
     */
    public getDeviceToken(): string | null {
        return this.deviceToken
    }

    /**
     * Cleanup event listeners
     * Call this when your component unmounts
     */
    public cleanup(): void {
        PushNotificationIOS.removeEventListener('register')
        PushNotificationIOS.removeEventListener('registrationError')
        PushNotificationIOS.removeEventListener('notification')
        PushNotificationIOS.removeEventListener('localNotification')
    }
}

/**
 * Singleton instance of AttentivePushHelper
 * Use this throughout your app to manage push notifications
 *
 * @example
 * ```typescript
 * import { attentivePush } from './utils/AttentivePushHelper';
 *
 * // Initialize
 * await attentivePush.initialize();
 *
 * // Check status
 * const isRegistered = attentivePush.isDeviceRegistered();
 * const token = attentivePush.getDeviceToken();
 *
 * // Cleanup
 * attentivePush.cleanup();
 * ```
 */
export const attentivePush = AttentivePushHelper.getInstance()
