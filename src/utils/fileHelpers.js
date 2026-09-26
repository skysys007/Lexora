export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max
export const MAX_TEXT_INPUT_LENGTH = 200000; // 200k characters max

/**
 * Check if a file object or filename represents a PDF document.
 * @param {File} file 
 * @returns {boolean}
 */
export function isPdfFile(file) {
  if (!file) return false;
  return file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
}

/**
 * Check if a file object or filename represents a supported image format.
 * @param {File} file 
 * @returns {boolean}
 */
export function isImageFile(file) {
  if (!file) return false;
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name || '');
}

/**
 * Validate whether the uploaded file is supported by Lexora.
 * @param {File} file 
 * @returns {boolean}
 */
export function isSupportedFile(file) {
  return isPdfFile(file) || isImageFile(file);
}

/**
 * Perform security and size validation on an uploaded file.
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadedFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (!isSupportedFile(file)) {
    return { valid: false, error: 'Unsupported file format. Please upload a PDF or Image file (PNG, JPG, WEBP).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 25 MB.` };
  }

  return { valid: true };
}

/**
 * Sanitize and enforce maximum length on raw text input.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeTextInput(text) {
  if (!text || typeof text !== 'string') return '';
  // Remove null bytes and restrict length
  const cleaned = text.replace(/\0/g, '').trim();
  return cleaned.substring(0, MAX_TEXT_INPUT_LENGTH);
}

