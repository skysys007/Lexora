/**
  * Accessibility Utility Functions for Lexora
  */

let liveRegionElement = null;

/**
 * Announces a message to screen readers via a dynamic aria-live region.
 * @param {string} message - Message to be read by screen readers.
 * @param {'polite' | 'assertive'} priority - Priority level.
 */
export function announceToScreenReader(message, priority = 'polite') {
  if (!message || typeof window === 'undefined') return;

  if (!liveRegionElement) {
    liveRegionElement = document.createElement('div');
    liveRegionElement.id = 'lexora-a11y-live-region';
    liveRegionElement.className = 'sr-only';
    liveRegionElement.setAttribute('aria-live', priority);
    liveRegionElement.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegionElement);
  } else {
    liveRegionElement.setAttribute('aria-live', priority);
  }

  // Set timeout to ensure DOM change triggers screen reader speech
  liveRegionElement.textContent = '';
  setTimeout(() => {
    if (liveRegionElement) {
      liveRegionElement.textContent = message;
    }
  }, 100);
}

/**
 * Focus Trap implementation for Modals (e.g. AccessibilityModal, DevPanel).
 * Returns a cleanup event listener function.
 * @param {HTMLElement} containerElement - The modal wrapper element.
 * @returns {Function} Cleanup function.
 */
export function trapFocus(containerElement) {
  if (!containerElement) return () => {};

  const focusableElements = containerElement.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  firstElement.focus();

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  containerElement.addEventListener('keydown', handleKeyDown);
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Strip markdown symbols for clean text-to-speech reading.
 * @param {string} text - Raw markdown text.
 * @returns {string} Plain spoken text.
 */
export function stripMarkdownForSpeech(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/#{1,6}\s+/g, '') // remove headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // remove bold/italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace links with anchor text
    .replace(/^\s*[-+*]\s+/gm, '. ') // bullet points to pauses
    .replace(/\n+/g, '. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}
