/**
 * Copy text to the clipboard, working outside secure contexts.
 *
 * `navigator.clipboard` is only defined in a **secure context** — HTTPS, or a
 * `localhost` origin. This app is routinely opened over plain HTTP on a
 * non-localhost host (`http://trading.gridtokenx-coresystem.orb.local`), where
 * `navigator.clipboard` is `undefined`, so `navigator.clipboard.writeText(...)`
 * throws `TypeError: Cannot read properties of undefined`.
 *
 * Every call site used to invoke that directly with no `catch` and then show a
 * success toast on the next line, so the throw skipped the toast and the click
 * did nothing at all — no copy, no error, no feedback. That is the bug this
 * exists to remove.
 *
 * Falls back to the legacy `document.execCommand('copy')` path, which does work
 * over plain HTTP. Returns whether the copy actually succeeded so callers can
 * report the truth rather than assume it.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false

  // Preferred path — only available in a secure context.
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied, or a non-focused document. Fall through.
    }
  }

  // Legacy fallback: works over plain HTTP, which is exactly the case the
  // Clipboard API refuses to serve.
  if (typeof document === 'undefined') return false
  try {
    const el = document.createElement('textarea')
    el.value = text
    // Keep it out of view and non-disruptive: no scroll jump, no focus flicker.
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.top = '-9999px'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    el.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}
