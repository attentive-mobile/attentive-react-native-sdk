/**
 * Tests for the useTextPrompt cross-platform hook.
 *
 * Strategy:
 * - Mock `Platform.OS` to exercise both the iOS (Alert.prompt) and Android (modal) paths.
 * - Use `@testing-library/react-native`'s `renderHook` + `act` for hook state changes.
 * - Verify Alert.prompt is called on iOS and NOT on Android (and vice-versa for state).
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { Alert, Platform } from 'react-native'
import { useTextPrompt } from '../src/hooks/useTextPrompt'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Override Platform.OS for the duration of a test. */
function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockAlertPrompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => {})

beforeEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// iOS path
// ---------------------------------------------------------------------------

describe('useTextPrompt – iOS', () => {
  beforeEach(() => setPlatform('ios'))

  it('calls Alert.prompt with the correct title and message', () => {
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({
        title: 'Test Title',
        message: 'Test message',
        defaultValue: 'default',
        onConfirm: jest.fn(),
      })
    })

    expect(mockAlertPrompt).toHaveBeenCalledTimes(1)
    expect(mockAlertPrompt).toHaveBeenCalledWith(
      'Test Title',
      'Test message',
      expect.any(Array),
      'plain-text',
      'default',
    )
  })

  it('returns null for PromptModal on iOS', () => {
    const { result } = renderHook(() => useTextPrompt())
    expect(result.current.PromptModal).toBeNull()
  })

  it('invokes onConfirm with trimmed value via the confirm button handler', () => {
    const onConfirm = jest.fn()
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', defaultValue: '', onConfirm })
    })

    // Extract and invoke the "Save" button's onPress from the Alert.prompt call
    const buttons: any[] = mockAlertPrompt.mock.calls[0][2] as any[]
    const confirmButton = buttons.find((b: any) => b.text !== 'Cancel')
    act(() => {
      confirmButton.onPress('  hello world  ')
    })

    expect(onConfirm).toHaveBeenCalledWith('hello world')
  })

  it('does NOT invoke onConfirm when value is empty after trimming', () => {
    const onConfirm = jest.fn()
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', defaultValue: '', onConfirm })
    })

    const buttons: any[] = mockAlertPrompt.mock.calls[0][2] as any[]
    const confirmButton = buttons.find((b: any) => b.text !== 'Cancel')
    act(() => {
      confirmButton.onPress('   ')
    })

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('invokes onCancel via the cancel button handler', () => {
    const onCancel = jest.fn()
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', onConfirm: jest.fn(), onCancel })
    })

    const buttons: any[] = mockAlertPrompt.mock.calls[0][2] as any[]
    const cancelButton = buttons.find((b: any) => b.style === 'cancel')
    act(() => {
      cancelButton.onPress()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Android path
// ---------------------------------------------------------------------------

describe('useTextPrompt – Android', () => {
  beforeEach(() => setPlatform('android'))

  it('does NOT call Alert.prompt on Android', () => {
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', onConfirm: jest.fn() })
    })

    expect(mockAlertPrompt).not.toHaveBeenCalled()
  })

  it('returns a non-null PromptModal element on Android', () => {
    const { result } = renderHook(() => useTextPrompt())
    expect(result.current.PromptModal).not.toBeNull()
  })

  it('PromptModal starts with visible=false', () => {
    const { result } = renderHook(() => useTextPrompt())
    // Modal element exists but should not be visible initially
    const modal = result.current.PromptModal as React.ReactElement
    expect(modal.props.visible).toBe(false)
  })

  it('sets PromptModal to visible after showPrompt is called', () => {
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'Domain', defaultValue: 'games', onConfirm: jest.fn() })
    })

    const modal = result.current.PromptModal as React.ReactElement
    expect(modal.props.visible).toBe(true)
    expect(modal.props.title).toBe('Domain')
    expect(modal.props.defaultValue).toBe('games')
  })

  it('hides the modal and calls onConfirm with trimmed value on confirm', () => {
    const onConfirm = jest.fn()
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', onConfirm })
    })

    // Simulate the modal calling onConfirm
    act(() => {
      const modal = result.current.PromptModal as React.ReactElement
      modal.props.onConfirm('  staging  ')
    })

    const modal = result.current.PromptModal as React.ReactElement
    expect(modal.props.visible).toBe(false)
    expect(onConfirm).toHaveBeenCalledWith('staging')
  })

  it('hides the modal but does NOT call onConfirm for empty input', () => {
    const onConfirm = jest.fn()
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', onConfirm })
    })

    act(() => {
      const modal = result.current.PromptModal as React.ReactElement
      modal.props.onConfirm('   ')
    })

    const modal = result.current.PromptModal as React.ReactElement
    expect(modal.props.visible).toBe(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('hides the modal and calls onCancel on dismiss', () => {
    const onCancel = jest.fn()
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({ title: 'T', onConfirm: jest.fn(), onCancel })
    })

    act(() => {
      const modal = result.current.PromptModal as React.ReactElement
      modal.props.onDismiss()
    })

    const modal = result.current.PromptModal as React.ReactElement
    expect(modal.props.visible).toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('uses custom confirmText and cancelText when provided', () => {
    const { result } = renderHook(() => useTextPrompt())

    act(() => {
      result.current.showPrompt({
        title: 'T',
        confirmText: 'Apply',
        cancelText: 'Discard',
        onConfirm: jest.fn(),
      })
    })

    const modal = result.current.PromptModal as React.ReactElement
    expect(modal.props.confirmText).toBe('Apply')
    expect(modal.props.cancelText).toBe('Discard')
  })
})
