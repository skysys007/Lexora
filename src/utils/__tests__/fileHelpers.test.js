import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isPdfFile,
  isImageFile,
  isSupportedFile,
  validateUploadedFile,
  sanitizeTextInput,
  MAX_FILE_SIZE_BYTES,
  MAX_TEXT_INPUT_LENGTH,
} from '../fileHelpers.js';

describe('fileHelpers Utility Tests', () => {
  describe('isPdfFile', () => {
    it('returns true for application/pdf type', () => {
      const file = { type: 'application/pdf', name: 'document.pdf' };
      assert.strictEqual(isPdfFile(file), true);
    });

    it('returns true for .pdf file extensions regardless of MIME type', () => {
      const file = { type: '', name: 'contract.PDF' };
      assert.strictEqual(isPdfFile(file), true);
    });

    it('returns false for non-PDF files', () => {
      const file = { type: 'image/png', name: 'image.png' };
      assert.strictEqual(isPdfFile(file), false);
    });

    it('handles null/undefined gracefully', () => {
      assert.strictEqual(isPdfFile(null), false);
      assert.strictEqual(isPdfFile(undefined), false);
    });
  });

  describe('isImageFile', () => {
    it('returns true for supported image MIME types', () => {
      assert.strictEqual(isImageFile({ type: 'image/png', name: 'photo.png' }), true);
      assert.strictEqual(isImageFile({ type: 'image/jpeg', name: 'photo.jpg' }), true);
      assert.strictEqual(isImageFile({ type: 'image/webp', name: 'photo.webp' }), true);
    });

    it('returns true for supported image extensions', () => {
      assert.strictEqual(isImageFile({ type: '', name: 'scan.JPG' }), true);
      assert.strictEqual(isImageFile({ type: '', name: 'document.bmp' }), true);
    });

    it('returns false for PDF files', () => {
      assert.strictEqual(isImageFile({ type: 'application/pdf', name: 'doc.pdf' }), false);
    });
  });

  describe('isSupportedFile', () => {
    it('returns true for both PDF and Image files', () => {
      assert.strictEqual(isSupportedFile({ type: 'application/pdf', name: 'doc.pdf' }), true);
      assert.strictEqual(isSupportedFile({ type: 'image/png', name: 'img.png' }), true);
    });

    it('returns false for unsupported formats (e.g. exe, docx, txt)', () => {
      assert.strictEqual(isSupportedFile({ type: 'application/msword', name: 'doc.docx' }), false);
      assert.strictEqual(isSupportedFile({ type: 'application/x-executable', name: 'app.exe' }), false);
    });
  });

  describe('validateUploadedFile', () => {
    it('validates standard size PDF and image files', () => {
      const pdf = { type: 'application/pdf', name: 'agreement.pdf', size: 2 * 1024 * 1024 };
      assert.deepStrictEqual(validateUploadedFile(pdf), { valid: true });
    });

    it('rejects null or undefined file input', () => {
      assert.deepStrictEqual(validateUploadedFile(null), { valid: false, error: 'No file provided.' });
    });

    it('rejects unsupported file formats', () => {
      const badFile = { type: 'video/mp4', name: 'video.mp4', size: 1000 };
      const res = validateUploadedFile(badFile);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes('Unsupported file format'));
    });

    it('rejects files larger than 25MB (DoS Protection)', () => {
      const oversizedFile = {
        type: 'application/pdf',
        name: 'huge.pdf',
        size: MAX_FILE_SIZE_BYTES + 100,
      };
      const res = validateUploadedFile(oversizedFile);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes('exceeds maximum allowed limit'));
    });
  });

  describe('sanitizeTextInput', () => {
    it('returns empty string for non-string input', () => {
      assert.strictEqual(sanitizeTextInput(null), '');
      assert.strictEqual(sanitizeTextInput(undefined), '');
      assert.strictEqual(sanitizeTextInput(123), '');
    });

    it('removes null bytes from text', () => {
      const dirty = 'Hello\0 World\0!';
      assert.strictEqual(sanitizeTextInput(dirty), 'Hello World!');
    });

    it('truncates text to MAX_TEXT_INPUT_LENGTH', () => {
      const longText = 'a'.repeat(MAX_TEXT_INPUT_LENGTH + 500);
      const clean = sanitizeTextInput(longText);
      assert.strictEqual(clean.length, MAX_TEXT_INPUT_LENGTH);
    });
  });
});
