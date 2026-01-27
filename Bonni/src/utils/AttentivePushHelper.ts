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

import { Platform, AppState } from 'react-native'
import PushNotificationIOS, { PushNotification } from '@react-native-community/push-notification-ios'
import {
    registerDeviceTokenWithCallback,
    registerForPushNotifications,
    handleRegularOpen,
    handleForegroundPush,
    handlePushOpen,
    type PushAuthorizationStatus,
} from '../../../src'

/**
 * Helper class for managing Attentive push notifications
 * Implements the same logic as the native Swift callback-based approach
 */
export class AttentivePushHelper {
    private static instance: AttentivePushHelper
    private deviceToken: string | null = null
    private isRegistered: boolean = false
    private appStateSubscription: any = null

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

            // Set up app state listener for app open tracking
            console.log('📝 [AttentivePush] STEP 3: Setting up app state listener for app open tracking')
            this.setupAppStateListener()

            // Request push notification permissions
            console.log('🔐 [AttentivePush] STEP 4: Requesting push notification permissions')
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
     * Setup app state listener to track app opens
     *
     * When the app comes to the foreground (becomes active), we call handleRegularOpen
     * to track the app open event. This is important for analytics and engagement tracking.
     *
     * Note: Since handleAppDidBecomeActive() is private in the Attentive SDK,
     * we use handleRegularOpen() instead, which serves the same purpose of tracking
     * when the app becomes active.
     */
    private setupAppStateListener(): void {
        console.log('📱 [AttentivePush] Setting up AppState listener for app open tracking')

        this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
            console.log('[AttentivePush] AppState changed to:', nextAppState)

            // When app becomes active (comes to foreground), track as app open
            if (nextAppState === 'active') {
                console.log('[AttentivePush] App became active - tracking app open event')

                // Get current authorization status
                const authStatus = await this.getAuthorizationStatus()
                console.log('[AttentivePush] Authorization status:', authStatus)

                // Track app open by calling handleRegularOpen
                console.log('🌉 [AttentivePush] Calling native: handleRegularOpen() for app open tracking')
                handleRegularOpen(authStatus)
                console.log('✅ [AttentivePush] App open event tracked')
            }
        })
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
     * Handle device token registration with callback-based logic
     * Implements the same flow as the Swift callback-based method:
     * 1. Get authorization status
     * 2. Register device token with callback
     * 3. In callback: Trigger regular open event
     *
     * This is the TypeScript equivalent of:
     * ```swift
     * func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
     *     UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
     *         guard let self = self else { return }
     *         let authStatus = settings.authorizationStatus
     *         attentiveSdk?.registerDeviceToken(deviceToken, authorizationStatus: authStatus, callback: { data, url, response, error in
     *             DispatchQueue.main.async {
     *                 self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
     *             }
     *         })
     *     }
     * }
     * ```
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
            // Get current authorization status (equivalent to getNotificationSettings)
            const authStatus = await this.getAuthorizationStatus()
            console.log('✅ [AttentivePush] STEP 5: Authorization status:', authStatus)

            // Register device token with Attentive SDK using callback-based method
            console.log('📤 [AttentivePush] STEP 6: Registering device token with Attentive SDK (with callback)')
            console.log('   Token:', deviceToken.substring(0, 16) + '...')
            console.log('   Auth Status:', authStatus)
            console.log('🌉 [AttentivePush] Calling native: registerDeviceTokenWithCallback()')

            // This is the equivalent of the Swift callback-based registration
            registerDeviceTokenWithCallback(
                deviceToken,
                authStatus,
                (data?: Object, url?: string, response?: Object, error?: Object) => {
                    console.log('📥 [AttentivePush] Registration callback invoked')

                    if (error) {
                        console.error('❌ [AttentivePush] Registration callback returned error:', error)
                    } else {
                        console.log('✅ [AttentivePush] STEP 7: Device token registered successfully')
                        console.log('   Response URL:', url)
                        console.log('   Response:', response)
                        console.log('   Data:', data)
                    }

                    // Mark as registered (even if there was an error, we attempted registration)
                    this.isRegistered = true

                    // Trigger regular open event (equivalent to DispatchQueue.main.async { handleRegularOpen })
                    console.log('📱 [AttentivePush] STEP 8: Triggering regular open event from callback')
                    console.log('🌉 [AttentivePush] Calling native: handleRegularOpen()')
                    handleRegularOpen(authStatus)
                    console.log('✅ [AttentivePush] Regular open event triggered successfully')
                }
            )

        } catch (error) {
            console.error('❌ [AttentivePush] Device token registration failed:', error)
            console.error('   Error details:', JSON.stringify(error, null, 2))

            // Even on failure, trigger regular open event
            const authStatus = await this.getAuthorizationStatus()
            console.log('📱 [AttentivePush] Triggering regular open event after error')
            handleRegularOpen(authStatus)
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
        console.log('📱 [AttentivePush] Triggering regular open event after registration error')
        console.log('🌉 [AttentivePush] Calling native: handleRegularOpen()')
        handleRegularOpen(authStatus)
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
     * This now uses the new handleForegroundPush method for better tracking.
     *
     * @param notification - The notification object
     */
    private async handleForegroundNotification(notification: PushNotification): Promise<void> {
        const userInfo = notification.getData()
        console.log('📬 [AttentivePush] Notification received in foreground')
        console.log('   User info:', JSON.stringify(userInfo, null, 2))

        // Get authorization status
        const authStatus = await this.getAuthorizationStatus()

        // Use handleForegroundPush for better tracking (matches native iOS pattern)
        console.log('🌉 [AttentivePush] Calling native: handleForegroundPush()')
        handleForegroundPush(userInfo, authStatus)

        // Complete the notification
        notification.finish(PushNotificationIOS.FetchResult.NoData)
    }

    /**
     * Handle notification tap
     * Equivalent to: didReceive response
     *
     * This is the TypeScript equivalent of the native iOS AppDelegate method:
     * ```swift
     * func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
     *     UNUserNotificationCenter.current().getNotificationSettings { settings in
     *       let authStatus = settings.authorizationStatus
     *       DispatchQueue.main.async {
     *         switch UIApplication.shared.applicationState {
     *         case .active:
     *           self.attentiveSdk?.handleForegroundPush(response: response, authorizationStatus: authStatus)
     *         case .background, .inactive:
     *           self.attentiveSdk?.handlePushOpen(response: response, authorizationStatus: authStatus)
     *         @unknown default:
     *           self.attentiveSdk?.handlePushOpen(response: response, authorizationStatus: authStatus)
     *         }
     *       }
     *     }
     *     completionHandler()
     *   }
     * ```
     *
     * @param notification - The notification object
     */
    private async handleNotificationTap(notification: PushNotification): Promise<void> {
        const userInfo = notification.getData()
        console.log('👆 [AttentivePush] Notification tapped by user')
        console.log('   User info:', JSON.stringify(userInfo, null, 2))

        // Get current app state (equivalent to UIApplication.shared.applicationState)
        const appState = AppState.currentState
        console.log('   App state:', appState)

        // Get authorization status (equivalent to getNotificationSettings)
        const authStatus = await this.getAuthorizationStatus()
        console.log('   Authorization status:', authStatus)

        // Determine which SDK method to call based on app state
        // This matches the native iOS switch statement exactly
        switch (appState) {
            case 'active':
                // App is in foreground - handle as foreground push
                console.log('🌉 [AttentivePush] App state: active - calling handleForegroundPush()')
                handleForegroundPush(userInfo, authStatus)
                break

            case 'background':
            case 'inactive':
                // App is in background or inactive - handle as push open
                console.log('🌉 [AttentivePush] App state: background/inactive - calling handlePushOpen()')
                handlePushOpen(userInfo, authStatus)
                break

            default:
                // Unknown state - default to push open behavior (matches @unknown default in Swift)
                console.log('🌉 [AttentivePush] App state: unknown - calling handlePushOpen()')
                handlePushOpen(userInfo, authStatus)
                break
        }

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

        // Cleanup app state listener
        if (this.appStateSubscription) {
            this.appStateSubscription.remove()
            this.appStateSubscription = null
        }
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
