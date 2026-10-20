import type { ColorValue, ViewProps } from 'react-native'
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

/**
 * Props for the inbox default renderer.
 *
 * The native views own their own layout, refresh, and pagination, so the host just gives them a
 * box to fill — these props only theme what the SDKs actually expose.
 *
 * **Per-platform coverage.** `onMessageTap` fires and all six colours apply on both platforms.
 *
 * Omitting a prop (or setting it to `undefined`) restores the SDK's own default colour, so a
 * recycled view never inherits the previous screen's theme.
 *
 * **Fonts** are deliberately absent: `setTitleFontFamily(fontResId: Int)` and friends only accept
 * an Android font *resource id*, and React Native ships fonts in `assets/fonts/`, not `res/font/`.
 * Needs an SDK overload taking a `FontFamily`/`Typeface` before it can be driven from JS.
 */
export interface NativeProps extends ViewProps {
  /**
   * Background behind the message list and its loading and empty states. On Android, unread rows
   * use a slightly shifted shade of it.
   */
  // Not `backgroundColor`: that's a built-in view prop and would shadow this one.
  inboxBackgroundColor?: ColorValue
  /** Dot marking an unread message. */
  unreadIndicatorColor?: ColorValue
  /** Message title text. */
  titleTextColor?: ColorValue
  /** Message body/preview text. */
  bodyTextColor?: ColorValue
  /** Message timestamp text. */
  timestampTextColor?: ColorValue
  /**
   * Background of the read-state swipe action: swipe left to mark unread on Android, swipe right
   * to toggle read/unread on iOS. The delete action is a fixed red on both and is not themeable.
   */
  swipeBackgroundColor?: ColorValue
  /** Fired when the user taps a message row. `actionUrl` is `''` when the message has no deep link. */
  onMessageTap?: DirectEventHandler<
    Readonly<{
      messageId: string
      actionUrl: string
    }>
  >
}

export default codegenNativeComponent<NativeProps>('AttentiveInboxView')
