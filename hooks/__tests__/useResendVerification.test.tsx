import { renderHook, act } from '@testing-library/react'
import { useResendVerification } from '../useResendVerification'

const mockResend = jest.fn()
jest.mock('@/lib/api-client', () => ({
    defaultApiClient: {
        resendVerification: (...args: unknown[]) => mockResend(...args),
    },
}))

const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: (...args: unknown[]) => mockToastSuccess(...args),
        error: (...args: unknown[]) => mockToastError(...args),
    },
}))

describe('useResendVerification', () => {
    beforeEach(() => {
        mockResend.mockReset()
        mockToastSuccess.mockReset()
        mockToastError.mockReset()
    })

    it('gates resend on the identifier holding an email', () => {
        const { result: username } = renderHook(() => useResendVerification('someuser'))
        expect(username.current.canResend).toBe(false)

        const { result: email } = renderHook(() => useResendVerification('a@b.co'))
        expect(email.current.canResend).toBe(true)
    })

    it('does not call the API for a non-email identifier', async () => {
        const { result } = renderHook(() => useResendVerification('someuser'))
        await act(async () => {
            await result.current.resendVerification()
        })
        expect(mockResend).not.toHaveBeenCalled()
    })

    it('toasts success when the backend confirms', async () => {
        mockResend.mockResolvedValueOnce({ data: { success: true }, status: 200 })

        const { result } = renderHook(() => useResendVerification('a@b.co'))
        await act(async () => {
            await result.current.resendVerification()
        })

        expect(mockResend).toHaveBeenCalledWith('a@b.co')
        expect(mockToastSuccess).toHaveBeenCalled()
        expect(result.current.isResending).toBe(false)
    })

    it('toasts the backend message on failure', async () => {
        mockResend.mockResolvedValueOnce({
            data: { success: false, message: 'rate limited' },
            status: 200,
        })

        const { result } = renderHook(() => useResendVerification('a@b.co'))
        await act(async () => {
            await result.current.resendVerification()
        })

        expect(mockToastError).toHaveBeenCalledWith('rate limited')
    })

    it('toasts a generic error when the request throws', async () => {
        mockResend.mockRejectedValueOnce(new Error('network down'))

        const { result } = renderHook(() => useResendVerification('a@b.co'))
        await act(async () => {
            await result.current.resendVerification()
        })

        expect(mockToastError).toHaveBeenCalledWith(
            'Failed to send verification email. Please try again.'
        )
        expect(result.current.isResending).toBe(false)
    })
})
