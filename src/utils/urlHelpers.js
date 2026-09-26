/**
 * Safely sanitizes external and inline URLs for rendering in Markdown or links.
 * Blocks dangerous schemes (javascript:, data:, vbscript:, file:, blob:, about:, chrome:) to prevent XSS attacks.
 * 
 * @param {string} url - Input URL string
 * @returns {string} Safe URL or '#' fallback
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const clean = url.trim().toLowerCase();
  if (
    clean.startsWith('javascript:') ||
    clean.startsWith('data:') ||
    clean.startsWith('vbscript:') ||
    clean.startsWith('file:') ||
    clean.startsWith('blob:') ||
    clean.startsWith('about:') ||
    clean.startsWith('chrome:')
  ) {
    return '#';
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('mailto:') && !clean.startsWith('#') && !clean.startsWith('/')) {
    return '#';
  }
  return url;
}
