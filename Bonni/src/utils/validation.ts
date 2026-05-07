/**
 * Validation utilities for marketing subscription inputs.
 * Pure functions with no side effects — safe to use in hooks and tests.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates an email address string against a basic RFC-compatible pattern.
 *
 * @param email - The raw email string to validate.
 * @returns `null` when the email is valid, or a human-readable error message
 *          describing the problem when it is not.
 */
export function validateEmail(email: string): string | null {
    const trimmed = email.trim()
    if (!trimmed) return 'Email is required'
    if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address (e.g. name@example.com)'
    return null
}

/**
 * E.164 pattern: optional leading `+`, then 7–15 digits.
 * Examples of valid values: `+15551234567`, `15551234567`.
 * The leading `+` is strongly recommended; we accept its omission but show a
 * hint in the placeholder so users know the preferred format.
 */
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/

/**
 * Validates a phone number string against the E.164 format.
 *
 * @param phone - The raw phone string to validate (e.g. `+15551234567`).
 * @returns `null` when the phone is valid, or a human-readable error message
 *          describing the problem when it is not.
 */
export function validatePhone(phone: string): string | null {
    const trimmed = phone.trim()
    if (!trimmed) return 'Phone number is required'
    if (!PHONE_REGEX.test(trimmed)) {
        return 'Enter a valid phone number in E.164 format (e.g. +15551234567)'
    }
    return null
}
