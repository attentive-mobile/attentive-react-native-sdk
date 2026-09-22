/**
 * Inbox Screen
 * Demonstrates the Attentive SDK's drop-in inbox UI ("default renderer").
 *
 * The native view owns everything: it fetches the first page on mount, refreshes on
 * foreground, and handles pull-to-refresh and pagination internally. There is no SDK
 * call to make from JS — rendering the component is the integration.
 *
 * The theming props below map Bonni's design system onto the inbox: peach for the swipe
 * action so it matches the nav bar, muted grey for secondary text. Android applies all five;
 * iOS applies the three text colours and ignores the indicator and swipe colours, which its
 * InboxStyle cannot express yet.
 *
 * onMessageTap observes a tap, it does not take it over: the SDK tracks the click and marks the
 * message read either way. It would also open the message's actionUrl, except Bonni opts out of
 * that — automaticallyOpensInboxDeepLinks is false in App.tsx (iOS) and on MainApplication.kt's
 * AttentiveConfig.Builder (Android) — so the alert below is the only thing a tap does here. Leave
 * the flag at its default and the SDK navigates as well, which is why an app routing taps itself
 * has to opt out on both platforms or the user gets it twice.
 */

import React, { useCallback } from 'react'
import { Alert, View, StyleSheet } from 'react-native'
import { AttentiveInboxView } from '@attentive-mobile/attentive-react-native-sdk'
import { InboxScreenProps } from '../types/navigation'
import { Colors } from '../constants/theme'
import { useDisplayAlerts } from '../hooks/useDisplayAlerts'

const InboxScreen: React.FC<InboxScreenProps> = () => {
  const displayAlerts = useDisplayAlerts()

  const handleMessageTap = useCallback(
    (messageId: string, actionUrl: string) => {
      if (displayAlerts) {
        Alert.alert(
          'Inbox Message Tapped',
          `messageId: ${messageId}\nactionUrl: ${actionUrl || '(none)'}`
        )
      }
    },
    [displayAlerts]
  )

  return (
    <View style={styles.container}>
      <AttentiveInboxView
        style={styles.inbox}
        unreadIndicatorColor={Colors.black}
        titleTextColor={Colors.primaryText}
        bodyTextColor={Colors.secondaryText}
        timestampTextColor={Colors.secondaryText}
        swipeBackgroundColor={Colors.peach}
        onMessageTap={({ nativeEvent }) =>
          handleMessageTap(nativeEvent.messageId, nativeEvent.actionUrl)
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  inbox: {
    flex: 1,
  },
})

export default InboxScreen
