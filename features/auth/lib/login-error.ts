import { ApiClientError } from '@/lib/api/core'

/**
 * User-facing copy for a failed POST /api/v1/auth/login.
 *
 * The app owns these strings. IAM answers failures with
 * `{ error: { code, message } }` and `lib/api/core.ts:157` lifts both onto
 * `ApiClientError`, so branch on `code` — it is a stable enum
 * (`iam-core/src/error/codes.rs`), whereas `message` is prose the backend is
 * free to reword.
 *
 * Never surface the raw message blind: the failures that reach this function
 * also include an APISIX HTML 502 (which `apiRequest` reports as
 * `Invalid JSON response: <html>…`) and fetch's own `Failed to fetch` — both
 * meaningless to a signed-out user staring at a login form.
 *
 * AUTH_1005 (email not verified) is deliberately absent: call sites intercept it
 * first and render the resend-verification alert instead of a flat error.
 */

const CREDENTIALS = 'Incorrect username or password.'
const THROTTLED = 'Too many sign-in attempts. Please wait a moment and try again.'
const UNAVAILABLE = 'Sign-in is temporarily unavailable. Please try again in a moment.'
const OFFLINE = 'Cannot reach the server. Check your connection and try again.'
const MALFORMED = 'Check the username and password you entered, then try again.'
const GENERIC = 'Sign-in failed. Please try again.'

/**
 * Transport- and gateway-level failures, which arrive as an opaque message with
 * no backend code — a 500 stamped on by `apiRequest`'s catch, or a non-JSON
 * body from the gateway. Checked before `status` for exactly that reason.
 */
function fromMessage(message: string): string | null {
    if (/^invalid json response:/i.test(message)) return UNAVAILABLE
    if (
        /failed to fetch|load failed|network ?error|network request failed|err_failed|err_connection|err_network/i.test(
            message
        )
    ) {
        return OFFLINE
    }
    return null
}

function fromStatus(status?: number): string | null {
    if (!status) return null
    if (status === 401 || status === 403) return CREDENTIALS
    if (status === 429) return THROTTLED
    if (status === 400 || status === 422) return MALFORMED
    if (status >= 500) return UNAVAILABLE
    return null
}

/** Backend code → app-owned copy. AUTH_1006 is special-cased below. */
const CODE_MESSAGES: Record<string, string> = {
    AUTH_1001: CREDENTIALS,
    AUTH_1007: 'This account has been disabled. Contact support to restore access.',
    RATE_9001: THROTTLED,
    RATE_9002: THROTTLED,
    VAL_3001: MALFORMED,
    VAL_3002: MALFORMED,
    VAL_3003: MALFORMED,
    VAL_3006: MALFORMED,
    VAL_3007: MALFORMED,
    DB_7001: UNAVAILABLE,
    DB_7002: UNAVAILABLE,
    DB_7003: UNAVAILABLE,
    DB_7004: UNAVAILABLE,
    EXT_8001: UNAVAILABLE,
    EXT_8002: UNAVAILABLE,
    EXT_8003: UNAVAILABLE,
    EXT_8004: UNAVAILABLE,
    EXT_8005: UNAVAILABLE,
}

export function loginErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
        if (error.code === 'AUTH_1006') {
            // Passed through on purpose: this one carries the remaining
            // lockout window ("Account locked for N seconds…"), which is
            // more useful than anything static written here.
            return error.message || 'Account temporarily locked after too many failed attempts.'
        }

        const known = error.code ? CODE_MESSAGES[error.code] : undefined
        if (known) return known

        return fromMessage(error.message) ?? fromStatus(error.status) ?? GENERIC
    }

    if (error instanceof Error) {
        return fromMessage(error.message) ?? GENERIC
    }

    return GENERIC
}

/**
 * True when the failure is a normal sign-in outcome the UI already explains
 * (wrong password, unverified email, lockout, throttle, gateway down) rather
 * than a defect.
 *
 * Call sites use this to decide whether to log. A rejected password is not an
 * exception the developer needs a stack trace for — logging every one of them
 * as `console.error` is how a real bug ends up invisible in a wall of expected
 * noise. Anything this returns false for is genuinely unexplained and should
 * still be logged.
 */
export function isExpectedLoginError(error: unknown): boolean {
    if (error instanceof ApiClientError) {
        // AUTH_1005 never reaches loginErrorMessage — call sites intercept it
        // for the resend-verification alert — but it is the most expected
        // outcome of them all.
        if (error.code === 'AUTH_1005' || error.code === 'AUTH_1006') return true
        if (error.code && CODE_MESSAGES[error.code]) return true
        return fromMessage(error.message) !== null || fromStatus(error.status) !== null
    }

    if (error instanceof Error) return fromMessage(error.message) !== null

    return false
}
