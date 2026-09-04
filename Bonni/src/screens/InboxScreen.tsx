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
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AttentiveInboxView } from '@attentive-mobile/attentive-react-native-sdk'
import { InboxScreenProps } from '../types/navigation'
import { Colors } from '../constants/theme'

const InboxScreen: React.FC<InboxScreenProps> = () => {
  return (
    <View style={styles.container}>
      <AttentiveInboxView
        style={styles.inbox}
        unreadIndicatorColor={Colors.black}
        titleTextColor={Colors.primaryText}
        bodyTextColor={Colors.secondaryText}
        timestampTextColor={Colors.secondaryText}
        swipeBackgroundColor={Colors.peach}
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
