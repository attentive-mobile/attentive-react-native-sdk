import { validateEmail, validatePhone } from '../validation'

describe('validateEmail', () => {
    describe('valid inputs', () => {
        it('returns null for a standard email address', () => {
            expect(validateEmail('user@example.com')).toBeNull()
        })

        it('returns null for an email with sub-domain', () => {
            expect(validateEmail('user@mail.example.com')).toBeNull()
        })

        it('returns null for an email with plus addressing', () => {
            expect(validateEmail('user+tag@example.com')).toBeNull()
        })

        it('returns null when surrounded by whitespace (trims first)', () => {
            expect(validateEmail('  user@example.com  ')).toBeNull()
        })

        it('returns null for an email with numeric local part', () => {
            expect(validateEmail('123@example.org')).toBeNull()
        })
    })

    describe('invalid inputs', () => {
        it('returns an error for an empty string', () => {
            expect(validateEmail('')).not.toBeNull()
        })

        it('returns an error for a whitespace-only string', () => {
            expect(validateEmail('   ')).not.toBeNull()
        })

        it('returns an error when the @ sign is missing', () => {
            expect(validateEmail('userexample.com')).not.toBeNull()
        })

        it('returns an error when there is no domain after @', () => {
            expect(validateEmail('user@')).not.toBeNull()
        })

        it('returns an error when there is no TLD', () => {
            expect(validateEmail('user@example')).not.toBeNull()
        })

        it('returns an error for a double @', () => {
            expect(validateEmail('user@@example.com')).not.toBeNull()
        })

        it('returns an error for spaces inside the email', () => {
            expect(validateEmail('us er@example.com')).not.toBeNull()
        })

        it('returns "Email is required" for empty string', () => {
            const result = validateEmail('')
            expect(result).toBe('Email is required')
        })

        it('returns a descriptive message for a malformed email', () => {
            const result = validateEmail('notanemail')
            expect(result).toMatch(/valid email/i)
        })
    })
})

describe('validatePhone', () => {
    describe('valid inputs', () => {
        it('returns null for a full E.164 number with + prefix', () => {
            expect(validatePhone('+15551234567')).toBeNull()
        })

        it('returns null for a number without the + prefix', () => {
            expect(validatePhone('15551234567')).toBeNull()
        })

        it('returns null for a 7-digit minimum number (+ prefix)', () => {
            // 7 digits after country code digit = 8 total digits after +
            expect(validatePhone('+12345678')).toBeNull()
        })

        it('returns null for a 15-digit maximum E.164 number', () => {
            expect(validatePhone('+123456789012345')).toBeNull()
        })

        it('returns null when surrounded by whitespace (trims first)', () => {
            expect(validatePhone('  +15551234567  ')).toBeNull()
        })
    })

    describe('invalid inputs', () => {
        it('returns an error for an empty string', () => {
            expect(validatePhone('')).not.toBeNull()
        })

        it('returns an error for a whitespace-only string', () => {
            expect(validatePhone('   ')).not.toBeNull()
        })

        it('returns an error when the number starts with 0', () => {
            // E.164 country codes never start with 0
            expect(validatePhone('+0551234567')).not.toBeNull()
        })

        it('returns an error for a number that is too short (fewer than 7 digits)', () => {
            expect(validatePhone('+12345')).not.toBeNull()
        })

        it('returns an error for a number that is too long (more than 15 digits)', () => {
            expect(validatePhone('+1234567890123456')).not.toBeNull()
        })

        it('returns an error when the number contains letters', () => {
            expect(validatePhone('+1555ABC4567')).not.toBeNull()
        })

        it('returns an error for dashes inside the number', () => {
            expect(validatePhone('+1-555-123-4567')).not.toBeNull()
        })

        it('returns an error for parentheses in the number', () => {
            expect(validatePhone('+1(555)1234567')).not.toBeNull()
        })

        it('returns "Phone number is required" for empty string', () => {
            const result = validatePhone('')
            expect(result).toBe('Phone number is required')
        })

        it('returns a descriptive message for a malformed phone', () => {
            const result = validatePhone('not-a-phone')
            expect(result).toMatch(/E\.164/i)
        })
    })
})
