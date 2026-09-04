import type { ColorValue, ViewProps } from 'react-native'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

/**
 * Props for the inbox default renderer.
 *
 * The native views own their own layout, refresh, and pagination, so the host just gives them a
 * box to fill — these props only theme what the SDKs actually expose.
 *
 * **Per-platform coverage.** Android applies all five. iOS applies `titleTextColor`,
 * `bodyTextColor`, and `timestampTextColor`; `unreadIndicatorColor` and `swipeBackgroundColor` are
 * Android-only and have no effect on iOS yet — the iOS component logs once when they are set
 * rather than dropping them silently. Passing them is always safe.
 *
 * Omitting a prop (or setting it to `undefined`) restores the SDK's own default colour, so a
 * recycled view never inherits the previous screen's theme.
 *
 * Two knobs are deliberately absent:
 *  - **backgroundColor** — the Android SDK accepts it but never applies it (`MessageList` declares
 *    the parameter and then hardcodes `Color.White`), so wiring it would be a lie. Blocked on an
 *    SDK fix.
 *  - **fonts** — `setTitleFontFamily(fontResId: Int)` and friends only accept an Android font
 *    *resource id*, and React Native ships fonts in `assets/fonts/`, not `res/font/`. Needs an SDK
 *    overload taking a `FontFamily`/`Typeface` before it can be driven from JS.
 *
 * `onMessageTap` is still not observable from the Android `View` wrapper at all.
 */
export interface NativeProps extends ViewProps {
  /** Dot marking an unread message. */
  unreadIndicatorColor?: ColorValue
  /** Message title text. */
  titleTextColor?: ColorValue
  /** Message body/preview text. */
  bodyTextColor?: ColorValue
  /** Message timestamp text. */
  timestampTextColor?: ColorValue
  /**
   * Background revealed by the swipe-left "mark as unread" action. The swipe-right delete action
   * is hardcoded red in the SDK and is not themeable.
   */
  swipeBackgroundColor?: ColorValue
}

export default codegenNativeComponent<NativeProps>('AttentiveInboxView')
