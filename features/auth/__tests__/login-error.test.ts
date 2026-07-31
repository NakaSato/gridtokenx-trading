import { ApiClientError } from '@/lib/api/core'
import {
  loginErrorMessage,
  isExpectedLoginError,
} from '@/features/auth/lib/login-error'

describe('loginErrorMessage', () => {
  it('maps AUTH_1001 to app-owned credential copy, not the backend prose', () => {
    const message = loginErrorMessage(
      new ApiClientError('Invalid username or password', 'AUTH_1001', 401)
    )
    expect(message).toBe('Incorrect username or password.')
  })

  it('passes AUTH_1006 through so the lockout window survives', () => {
    expect(
      loginErrorMessage(
        new ApiClientError(
          'Account locked for 900 seconds due to too many failed attempts',
          'AUTH_1006',
          401
        )
      )
    ).toBe('Account locked for 900 seconds due to too many failed attempts')
  })

  it('explains a disabled account', () => {
    expect(
      loginErrorMessage(new ApiClientError('Account disabled', 'AUTH_1007', 403))
    ).toMatch(/disabled/i)
  })

  it.each(['RATE_9001', 'RATE_9002'])('throttles on %s', (code) => {
    expect(loginErrorMessage(new ApiClientError('slow down', code, 429))).toMatch(
      /too many sign-in attempts/i
    )
  })

  it.each(['DB_7001', 'EXT_8005'])('reports %s as temporarily unavailable', (code) => {
    expect(loginErrorMessage(new ApiClientError('boom', code, 503))).toMatch(
      /temporarily unavailable/i
    )
  })

  it.each(['VAL_3001', 'VAL_3007'])('asks the user to recheck input on %s', (code) => {
    expect(loginErrorMessage(new ApiClientError('bad field', code, 400))).toMatch(
      /check the username and password/i
    )
  })

  it('never leaks an APISIX HTML body', () => {
    const message = loginErrorMessage(
      new ApiClientError(
        'Invalid JSON response: <html><head><title>502 Bad Gateway</title></head></html>',
        undefined,
        502
      )
    )
    expect(message).toMatch(/temporarily unavailable/i)
    expect(message).not.toMatch(/html|502/i)
  })

  it('reports a dead network as offline, even though apiRequest stamps it 500', () => {
    // apiRequest's catch returns { error: 'Failed to fetch', status: 500 } —
    // message wins over status here, so the user is told to check the network
    // rather than blaming the server.
    expect(
      loginErrorMessage(new ApiClientError('Failed to fetch', undefined, 500))
    ).toMatch(/cannot reach the server/i)
  })

  it('falls back to status when there is no code and no known message', () => {
    expect(loginErrorMessage(new ApiClientError('nope', undefined, 401))).toBe(
      'Incorrect username or password.'
    )
    expect(loginErrorMessage(new ApiClientError('nope', undefined, 429))).toMatch(
      /too many/i
    )
    expect(loginErrorMessage(new ApiClientError('nope', undefined, 500))).toMatch(
      /temporarily unavailable/i
    )
  })

  it('handles an unrecognised code by falling back to its status', () => {
    expect(
      loginErrorMessage(new ApiClientError('weird', 'SYS_9999', 503))
    ).toMatch(/temporarily unavailable/i)
  })

  it('degrades to a generic line for a plain Error and for non-Error throws', () => {
    expect(loginErrorMessage(new Error('kaboom'))).toBe(
      'Sign-in failed. Please try again.'
    )
    expect(loginErrorMessage('a string')).toBe('Sign-in failed. Please try again.')
    expect(loginErrorMessage(undefined)).toBe('Sign-in failed. Please try again.')
  })

  it('recognises a network failure thrown as a bare Error', () => {
    expect(loginErrorMessage(new TypeError('Load failed'))).toMatch(
      /cannot reach the server/i
    )
  })
})

describe('isExpectedLoginError', () => {
  it.each([
    ['AUTH_1001', 401],
    ['AUTH_1005', 403],
    ['AUTH_1006', 401],
    ['AUTH_1007', 403],
    ['RATE_9001', 429],
    ['VAL_3001', 400],
    ['DB_7001', 503],
  ])('treats %s as an explained outcome, not a bug', (code, status) => {
    expect(isExpectedLoginError(new ApiClientError('x', code, status))).toBe(
      true
    )
  })

  it('accepts a coded failure whose status alone explains it', () => {
    expect(isExpectedLoginError(new ApiClientError('nope', undefined, 401))).toBe(
      true
    )
  })

  it('accepts a gateway 502 and a dead network', () => {
    expect(
      isExpectedLoginError(
        new ApiClientError('Invalid JSON response: <html>', undefined, 502)
      )
    ).toBe(true)
    expect(isExpectedLoginError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('flags anything unexplained so it still reaches the console', () => {
    // No code, no recognisable message, no status the mapper understands —
    // this is the shape a genuine defect arrives in.
    expect(isExpectedLoginError(new ApiClientError('weird', undefined, undefined))).toBe(
      false
    )
    expect(isExpectedLoginError(new TypeError("x is not a function"))).toBe(false)
    expect(isExpectedLoginError('a string')).toBe(false)
    expect(isExpectedLoginError(undefined)).toBe(false)
  })
})
