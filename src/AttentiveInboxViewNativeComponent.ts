import type { ViewProps } from 'react-native'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

/**
 * Props for the inbox default renderer.
 *
 * Deliberately `ViewProps` only for now — the native views own their own layout,
 * refresh, and pagination, so the host just gives them a box to fill. Theming props
 * arrive once iOS `InboxStyle` gains Android's colour knobs (MSDK-480), and
 * `onMessageTap` once Android forwards taps through `AttentiveInboxView` (MSDK-478).
 */
export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('AttentiveInboxView')
