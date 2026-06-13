import { isJwtExpired, computeRefreshDelay } from '../jwt'

// Builds a minimal JWT (header.payload.signature) with the given payload claims.
// Only the payload segment is read by isJwtExpired, so header/sig are dummies.
const makeJwt = (claims: Record<string, unknown>): string => {
  const b64 = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}.sig`
}

describe('isJwtExpired', () => {
  const NOW = 1_700_000_000_000 // fixed reference time (ms)

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns false for a token whose exp is comfortably in the future', () => {
    const exp = Math.floor(NOW / 1000) + 3600 // +1h
    expect(isJwtExpired(makeJwt({ exp }))).toBe(false)
  })

  it('returns true for a token whose exp is in the past', () => {
    const exp = Math.floor(NOW / 1000) - 60 // -1m
    expect(isJwtExpired(makeJwt({ exp }))).toBe(true)
  })

  it('treats a token expiring within the default 10s skew as expired', () => {
    const exp = Math.floor(NOW / 1000) + 5 // +5s, inside 10s skew
    expect(isJwtExpired(makeJwt({ exp }))).toBe(true)
  })

  it('respects a custom skew window', () => {
    const exp = Math.floor(NOW / 1000) + 20 // +20s
    expect(isJwtExpired(makeJwt({ exp }), 30_000)).toBe(true) // skew 30s -> expired
    expect(isJwtExpired(makeJwt({ exp }), 5_000)).toBe(false) // skew 5s  -> valid
  })

  it('treats a token with no numeric exp claim as not expired', () => {
    expect(isJwtExpired(makeJwt({ sub: 'user-1' }))).toBe(false)
  })

  it('fails closed (expired) on an unparseable token', () => {
    expect(isJwtExpired('not-a-jwt')).toBe(true)
    expect(isJwtExpired('')).toBe(true)
    expect(isJwtExpired('a.b.c')).toBe(true) // payload not valid base64 JSON
  })
})

describe('computeRefreshDelay', () => {
  it('returns null when already expired', () => {
    expect(computeRefreshDelay(0)).toBeNull()
    expect(computeRefreshDelay(-5_000)).toBeNull()
  })

  it('schedules at 80% of remaining lifetime for a long-lived token', () => {
    expect(computeRefreshDelay(100_000)).toBe(80_000)
    expect(computeRefreshDelay(3_600_000)).toBe(2_880_000)
  })

  it('floors at 10s when 80% would be below the floor but still before expiry', () => {
    // remaining 11s: 80% = 8.8s -> floored to 10s, which is < 11s, so kept.
    expect(computeRefreshDelay(11_000)).toBe(10_000)
  })

  it('refreshes immediately (0) when the 10s floor would land at/after expiry', () => {
    expect(computeRefreshDelay(10_000)).toBe(0) // floor == remaining
    expect(computeRefreshDelay(9_000)).toBe(0)  // floor > remaining
    expect(computeRefreshDelay(1_000)).toBe(0)  // near-expired restored token
  })
})
