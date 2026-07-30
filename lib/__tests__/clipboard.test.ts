import { copyText } from '@/lib/clipboard'

/**
 * The bug this guards: over plain HTTP on a non-localhost host (the app is served
 * at http://trading.gridtokenx-coresystem.orb.local), `navigator.clipboard` is
 * `undefined`. Call sites used it directly and then showed a success toast on the
 * next line, so the TypeError skipped the toast and the click did nothing at all.
 */
describe('copyText', () => {
  const origClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

  const setClipboard = (value: unknown) =>
    Object.defineProperty(navigator, 'clipboard', {
      value,
      configurable: true,
      writable: true,
    })

  afterEach(() => {
    if (origClipboard) Object.defineProperty(navigator, 'clipboard', origClipboard)
    else setClipboard(undefined)
    jest.restoreAllMocks()
  })

  it('uses the Clipboard API when it is available', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await expect(copyText('ADDR')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('ADDR')
  })

  it('still copies when navigator.clipboard is undefined (insecure context)', async () => {
    // Exactly the production case: plain HTTP, non-localhost host.
    setClipboard(undefined)
    const exec = jest.fn().mockReturnValue(true)
    ;(document as unknown as { execCommand: unknown }).execCommand = exec

    await expect(copyText('ADDR')).resolves.toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('falls back when the Clipboard API rejects (permission denied)', async () => {
    setClipboard({ writeText: jest.fn().mockRejectedValue(new Error('denied')) })
    const exec = jest.fn().mockReturnValue(true)
    ;(document as unknown as { execCommand: unknown }).execCommand = exec

    await expect(copyText('ADDR')).resolves.toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('reports failure rather than claiming success when both paths fail', async () => {
    setClipboard(undefined)
    ;(document as unknown as { execCommand: unknown }).execCommand = jest
      .fn()
      .mockReturnValue(false)
    // Callers show a toast off this boolean, so a false success is a lie to the user.
    await expect(copyText('ADDR')).resolves.toBe(false)
  })

  it('does not attempt to copy empty text', async () => {
    const writeText = jest.fn()
    setClipboard({ writeText })
    await expect(copyText('')).resolves.toBe(false)
    expect(writeText).not.toHaveBeenCalled()
  })
})
