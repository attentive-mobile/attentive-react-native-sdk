/**
 * Cross-platform text-input dialog used on Android (iOS uses Alert.prompt natively).
 * Renders a Modal overlay containing a title, optional message, a TextInput
 * pre-filled with `defaultValue`, and Cancel / Confirm buttons.
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'

export interface TextPromptModalProps {
  /** Controls visibility of the modal. */
  visible: boolean
  /** Dialog title displayed in bold at the top. */
  title: string
  /** Optional subtitle/body text shown below the title. */
  message?: string
  /** Pre-filled value for the text input. */
  defaultValue?: string
  /** Placeholder text shown when the input is empty. */
  placeholder?: string
  /** Label for the confirm button. Defaults to "Save". */
  confirmText?: string
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelText?: string
  /** Called with the current input value when the user confirms. */
  onConfirm: (value: string) => void
  /** Called when the user dismisses the dialog without confirming. */
  onDismiss: () => void
}

/**
 * Android-only inline text prompt that mimics the iOS `Alert.prompt` behaviour.
 * On iOS this component should never be rendered (the hook guards that).
 */
export const TextPromptModal: React.FC<TextPromptModalProps> = ({
  visible,
  title,
  message,
  defaultValue = '',
  placeholder,
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onDismiss,
}) => {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<TextInput>(null)

  // Sync internal value whenever the dialog re-opens with a new defaultValue
  useEffect(() => {
    if (visible) {
      setValue(defaultValue)
      // Small delay lets the Modal finish its entrance animation before focusing
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [visible, defaultValue])

  const handleConfirm = () => {
    onConfirm(value)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Stop touch events from bubbling through the dialog card */}
        <KeyboardAvoidingView behavior="padding">
          <Pressable style={styles.card} onPress={() => {}}>
            {/* Header */}
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {/* Input */}
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={Colors.secondaryText}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
                onPress={onDismiss}
                accessibilityRole="button"
                accessibilityLabel={cancelText}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>

              <View style={styles.buttonDivider} />

              <Pressable
                style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.buttonPressed]}
                onPress={handleConfirm}
                accessibilityRole="button"
                accessibilityLabel={confirmText}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 0,
    // Prevent the Pressable from collapsing to 0-size
    minWidth: 280,
  },
  title: {
    fontSize: Typography.sizes.large,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.sizes.small,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.base,
    lineHeight: 20,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.medium,
    color: Colors.primaryText,
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.lightBackground,
    marginHorizontal: -Spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.lightBackground,
  },
  cancelButton: {
    borderBottomLeftRadius: BorderRadius.medium,
  },
  confirmButton: {
    borderBottomRightRadius: BorderRadius.medium,
  },
  buttonDivider: {
    width: 1,
    backgroundColor: Colors.lightBackground,
  },
  cancelButtonText: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
    fontWeight: Typography.weights.medium,
  },
  confirmButtonText: {
    fontSize: Typography.sizes.medium,
    color: Colors.primaryText,
    fontWeight: Typography.weights.semibold,
  },
})
