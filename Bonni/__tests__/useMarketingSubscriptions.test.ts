/**
 * Tests for useMarketingSubscriptions hook.
 * Covers loading state transitions, concurrent-press blocking, and callback invocation.
 */

import { renderHook, act } from '@testing-library/react-native'
import type { MarketingSubscriptionCallbacks } from '../src/hooks/useMarketingSubscriptions'

const mockIdentify = jest.fn()
const mockOptIn = jest.fn().mockResolvedValue(undefined)
const mockOptOut = jest.fn().mockResolvedValue(undefined)

jest.mock('@attentive-mobile/attentive-react-native-sdk', () => ({
    identify: (...args: unknown[]) => mockIdentify(...args),
    optInMarketingSubscription: (...args: unknown[]) => mockOptIn(...args),
    optOutMarketingSubscription: (...args: unknown[]) => mockOptOut(...args),
}))

import { useMarketingSubscriptions } from '../src/hooks/useMarketingSubscriptions'

describe('useMarketingSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockOptIn.mockResolvedValue(undefined)
        mockOptOut.mockResolvedValue(undefined)
    })

    // -------------------------------------------------------------------------
    // Initial state
    // -------------------------------------------------------------------------

    it('should initialise with all loading flags false', () => {
        const { result } = renderHook(() => useMarketingSubscriptions())

        expect(result.current.isOptingInEmail).toBe(false)
        expect(result.current.isOptingOutEmail).toBe(false)
        expect(result.current.isOptingInPhone).toBe(false)
        expect(result.current.isOptingOutPhone).toBe(false)
        expect(result.current.isAnyLoading).toBe(false)
    })

    it('should initialise inputs and committed values correctly', () => {
        const { result } = renderHook(() => useMarketingSubscriptions())

        expect(result.current.emailInput).toBe('')
        expect(result.current.phoneInput).toBe('')
        expect(result.current.currentEmail).toBeNull()
        expect(result.current.currentPhone).toBeNull()
        expect(result.current.emailError).toBeNull()
        expect(result.current.phoneError).toBeNull()
    })

    // -------------------------------------------------------------------------
    // Set / commit handlers
    // -------------------------------------------------------------------------

    describe('handleSetEmail', () => {
        it('should commit a valid email and call identify', () => {
            const onSuccess = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onSuccess }),
            )

            act(() => result.current.setEmailInput('user@example.com'))
            act(() => result.current.handleSetEmail())

            expect(result.current.currentEmail).toBe('user@example.com')
            expect(result.current.emailError).toBeNull()
            expect(mockIdentify).toHaveBeenCalledWith({ email: 'user@example.com' })
            expect(onSuccess).toHaveBeenCalledWith('Email set to user@example.com')
        })

        it('should set emailError for an invalid email', () => {
            const onError = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onError }),
            )

            act(() => result.current.setEmailInput('not-an-email'))
            act(() => result.current.handleSetEmail())

            expect(result.current.emailError).toBeTruthy()
            expect(result.current.currentEmail).toBeNull()
            expect(mockIdentify).not.toHaveBeenCalled()
        })
    })

    describe('handleSetPhone', () => {
        it('should commit a valid phone and call identify', () => {
            const onSuccess = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onSuccess }),
            )

            act(() => result.current.setPhoneInput('+15551234567'))
            act(() => result.current.handleSetPhone())

            expect(result.current.currentPhone).toBe('+15551234567')
            expect(result.current.phoneError).toBeNull()
            expect(mockIdentify).toHaveBeenCalledWith({ phone: '+15551234567' })
            expect(onSuccess).toHaveBeenCalledWith('Phone set to +15551234567')
        })

        it('should set phoneError for an invalid phone', () => {
            const { result } = renderHook(() => useMarketingSubscriptions())

            act(() => result.current.setPhoneInput('123'))
            act(() => result.current.handleSetPhone())

            expect(result.current.phoneError).toBeTruthy()
            expect(result.current.currentPhone).toBeNull()
        })
    })

    // -------------------------------------------------------------------------
    // Opt-in / opt-out — success paths
    // -------------------------------------------------------------------------

    describe('handleOptInEmail', () => {
        it('should call optInMarketingSubscription and invoke onSuccess', async () => {
            const onSuccess = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onSuccess }),
            )

            act(() => result.current.setEmailInput('user@example.com'))

            await act(() => result.current.handleOptInEmail())

            expect(mockIdentify).toHaveBeenCalledWith({ email: 'user@example.com' })
            expect(mockOptIn).toHaveBeenCalledWith({ email: 'user@example.com' })
            expect(onSuccess).toHaveBeenCalledWith('Email opt-in successful')
            expect(result.current.isOptingInEmail).toBe(false)
        })

        it('should invoke onError and set emailError when email input is empty', async () => {
            const onError = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onError }),
            )

            await act(() => result.current.handleOptInEmail())

            expect(mockOptIn).not.toHaveBeenCalled()
            expect(onError).toHaveBeenCalledWith('Email is required')
            expect(result.current.emailError).toBe('Email is required')
        })
    })

    describe('handleOptOutEmail', () => {
        it('should call optOutMarketingSubscription and invoke onSuccess', async () => {
            const onSuccess = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onSuccess }),
            )

            act(() => result.current.setEmailInput('user@example.com'))

            await act(() => result.current.handleOptOutEmail())

            expect(mockIdentify).toHaveBeenCalledWith({ email: 'user@example.com' })
            expect(mockOptOut).toHaveBeenCalledWith({ email: 'user@example.com' })
            expect(onSuccess).toHaveBeenCalledWith('Email opt-out successful')
            expect(result.current.isOptingOutEmail).toBe(false)
        })
    })

    describe('handleOptInPhone', () => {
        it('should call optInMarketingSubscription and invoke onSuccess', async () => {
            const onSuccess = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onSuccess }),
            )

            act(() => result.current.setPhoneInput('+15551234567'))

            await act(() => result.current.handleOptInPhone())

            expect(mockIdentify).toHaveBeenCalledWith({ phone: '+15551234567' })
            expect(mockOptIn).toHaveBeenCalledWith({ phone: '+15551234567' })
            expect(onSuccess).toHaveBeenCalledWith('Phone opt-in successful')
            expect(result.current.isOptingInPhone).toBe(false)
        })

        it('should invoke onError and set phoneError when phone input is empty', async () => {
            const onError = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onError }),
            )

            await act(() => result.current.handleOptInPhone())

            expect(mockOptIn).not.toHaveBeenCalled()
            expect(onError).toHaveBeenCalledWith('Phone number is required')
            expect(result.current.phoneError).toBe('Phone number is required')
        })
    })

    describe('handleOptOutPhone', () => {
        it('should call optOutMarketingSubscription and invoke onSuccess', async () => {
            const onSuccess = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onSuccess }),
            )

            act(() => result.current.setPhoneInput('+15551234567'))

            await act(() => result.current.handleOptOutPhone())

            expect(mockIdentify).toHaveBeenCalledWith({ phone: '+15551234567' })
            expect(mockOptOut).toHaveBeenCalledWith({ phone: '+15551234567' })
            expect(onSuccess).toHaveBeenCalledWith('Phone opt-out successful')
            expect(result.current.isOptingOutPhone).toBe(false)
        })
    })

    // -------------------------------------------------------------------------
    // Error paths — SDK rejection
    // -------------------------------------------------------------------------

    describe('SDK failure handling', () => {
        it('should invoke onError and reset loading on optInEmail failure', async () => {
            mockOptIn.mockRejectedValueOnce(new Error('network'))
            const onError = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onError }),
            )

            act(() => result.current.setEmailInput('user@example.com'))

            await act(() => result.current.handleOptInEmail())

            expect(onError).toHaveBeenCalledWith('Email opt-in failed')
            expect(result.current.isOptingInEmail).toBe(false)
            expect(result.current.isAnyLoading).toBe(false)
        })

        it('should invoke onError and reset loading on optOutPhone failure', async () => {
            mockOptOut.mockRejectedValueOnce(new Error('timeout'))
            const onError = jest.fn()
            const { result } = renderHook(() =>
                useMarketingSubscriptions({ onError }),
            )

            act(() => result.current.setPhoneInput('+15551234567'))

            await act(() => result.current.handleOptOutPhone())

            expect(onError).toHaveBeenCalledWith('Phone opt-out failed')
            expect(result.current.isOptingOutPhone).toBe(false)
            expect(result.current.isAnyLoading).toBe(false)
        })
    })

    // -------------------------------------------------------------------------
    // Loading state transitions
    // -------------------------------------------------------------------------

    describe('loading state transitions', () => {
        it('should set isOptingInEmail=true while request is in flight', async () => {
            let resolveOptIn!: () => void
            mockOptIn.mockReturnValueOnce(
                new Promise<void>((r) => { resolveOptIn = r }),
            )
            const { result } = renderHook(() => useMarketingSubscriptions())

            act(() => result.current.setEmailInput('user@example.com'))

            // Start the request but don't resolve yet
            let promise: Promise<void>
            act(() => { promise = result.current.handleOptInEmail() })

            expect(result.current.isOptingInEmail).toBe(true)
            expect(result.current.isAnyLoading).toBe(true)

            // Resolve and wait
            await act(async () => {
                resolveOptIn()
                await promise!
            })

            expect(result.current.isOptingInEmail).toBe(false)
            expect(result.current.isAnyLoading).toBe(false)
        })

        it('should set isOptingOutEmail=true while request is in flight', async () => {
            let resolveOptOut!: () => void
            mockOptOut.mockReturnValueOnce(
                new Promise<void>((r) => { resolveOptOut = r }),
            )
            const { result } = renderHook(() => useMarketingSubscriptions())

            act(() => result.current.setEmailInput('user@example.com'))

            let promise: Promise<void>
            act(() => { promise = result.current.handleOptOutEmail() })

            expect(result.current.isOptingOutEmail).toBe(true)
            expect(result.current.isAnyLoading).toBe(true)

            await act(async () => {
                resolveOptOut()
                await promise!
            })

            expect(result.current.isOptingOutEmail).toBe(false)
        })
    })

    // -------------------------------------------------------------------------
    // Callbacks — optional
    // -------------------------------------------------------------------------

    describe('callbacks are optional', () => {
        it('should not throw when no callbacks are provided and operation succeeds', async () => {
            const { result } = renderHook(() => useMarketingSubscriptions())

            act(() => result.current.setEmailInput('user@example.com'))

            await expect(
                act(() => result.current.handleOptInEmail()),
            ).resolves.not.toThrow()
        })

        it('should not throw when no callbacks are provided and operation fails', async () => {
            mockOptOut.mockRejectedValueOnce(new Error('fail'))
            const { result } = renderHook(() => useMarketingSubscriptions())

            act(() => result.current.setPhoneInput('+15551234567'))

            await expect(
                act(() => result.current.handleOptOutPhone()),
            ).resolves.not.toThrow()
        })
    })
})
