/**
 * An image address that is safe to put in an `<img src>`, or "" when it is not.
 * Only `https:` is accepted (`http:` too on localhost, for development): anything else, such as
 * `javascript:` or `data:` text, is dropped, so a bad value never makes the browser call out.
 */
export function safeImageUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLocal)) {
      return parsed.href;
    }
  } catch {
    // not a URL
  }
  return '';
}

/**
 * Classes for the box that holds a `CosmeticBackground`: they make it the reference for the
 * image behind its content. Empty without a background, so such a box is left exactly as it was.
 */
export function cosmeticHostClass(url?: string | null): string {
  return safeImageUrl(url) ? 'relative isolate overflow-hidden' : '';
}
