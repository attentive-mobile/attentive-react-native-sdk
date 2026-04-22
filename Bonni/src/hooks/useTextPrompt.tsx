/**
 * Cross-platform text-input prompt hook.
 *
 * On iOS  → delegates directly to `Alert.prompt` (native OS dialog, no extra UI).
 * On Android → manages a `TextPromptModal` overlay since `Alert.prompt` is iOS-only.
 *
 * Usage:
 * ```tsx
 * const { showPrompt, PromptModal } = useTextPrompt()
 *
 * // Render PromptModal once in your component tree (it is null on iOS)
 * return (
 *   <>
 *     <YourScreen />
 *     {PromptModal}
 *   </>
 * )
 *
 * // Trigger the prompt
 * showPrompt({
 *   title: 'Enter value',
 *   defaultValue: current,
 *   onConfirm: (val) => handleValue(val),
 * })
 * ```
 */

import React, { useCallback, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { TextPromptModal } from '../components/TextPromptModal'

/** Configuration passed to each individual prompt invocation. */
export interface TextPromptConfig {
  /** Dialog title. */
  title: string
  /** Optional subtitle displayed below the title. */
  message?: string
  /** Value pre-filled in the text input. */
  defaultValue?: string
  /** Ghost text shown when the input is empty. */
  placeholder?: string
  /** Label for the confirm button. Defaults to "Save". */
  confirmText?: string
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelText?: string
  /**
   * Called with the trimmed, non-empty input value when the user confirms.
   * Empty strings after trimming are silently ignored.
   */
  onConfirm: (value: string) => void
  /** Called when the user cancels or dismisses the dialog. */
  onCancel?: () => void
}

/** Shape returned by the hook. */
export interface TextPromptHook {
  /**
   * Imperatively shows a text prompt dialog.
   * On iOS this calls `Alert.prompt`; on Android it opens a modal overlay.
   *
   * @param config - Title, message, default value, and callbacks.
   */
  showPrompt: (config: TextPromptConfig) => void
  /**
   * The React element that must be rendered somewhere in the component tree.
   * Always `null` on iOS (no extra UI needed).
   * On Android this is the `<TextPromptModal />` managed by the hook.
   */
  PromptModal: React.ReactElement | null
}

/** Internal state for the Android modal. */
interface PromptState {
  visible: boolean
  title: string
  message?: string
  defaultValue: string
  placeholder?: string
  confirmText: string
  cancelText: string
  onConfirm: (value: string) => void
  onCancel?: () => void
}

const INITIAL_STATE: PromptState = {
  visible: false,
  title: '',
  defaultValue: '',
  confirmText: 'Save',
  cancelText: 'Cancel',
  onConfirm: () => {},
}

/**
 * Returns a cross-platform `showPrompt` function and a companion `PromptModal`
 * element that must be mounted in the component tree (only relevant on Android).
 */
export function useTextPrompt(): TextPromptHook {
  const [state, setState] = useState<PromptState>(INITIAL_STATE)

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  const handleConfirm = useCallback((value: string) => {
    const trimmed = value.trim()
    dismiss()
    if (trimmed) state.onConfirm(trimmed)
  }, [dismiss, state])

  const handleCancel = useCallback(() => {
    dismiss()
    state.onCancel?.()
  }, [dismiss, state])

  const showPrompt = useCallback((config: TextPromptConfig) => {
    const {
      title,
      message,
      defaultValue = '',
      placeholder,
      confirmText = 'Save',
      cancelText = 'Cancel',
      onConfirm,
      onCancel,
    } = config

    // iOS: use the native system dialog, no extra component needed
    if (Platform.OS === 'ios') {
      Alert.prompt(
        title,
        message,
        [
          { text: cancelText, style: 'cancel', onPress: onCancel },
          {
            text: confirmText,
            onPress: (value) => {
              const trimmed = (value ?? '').trim()
              if (trimmed) onConfirm(trimmed)
            },
          },
        ],
        'plain-text',
        defaultValue,
      )
      return
    }

    // Android: show the custom modal
    setState({
      visible: true,
      title,
      message,
      defaultValue,
      placeholder,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    })
  }, [])

  // PromptModal is only meaningful on Android; return null on iOS to keep renders clean
  const PromptModal: React.ReactElement | null = Platform.OS === 'ios' ? null : (
    <TextPromptModal
      visible={state.visible}
      title={state.title}
      message={state.message}
      defaultValue={state.defaultValue}
      placeholder={state.placeholder}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      onConfirm={handleConfirm}
      onDismiss={handleCancel}
    />
  )

  return { showPrompt, PromptModal }
}
