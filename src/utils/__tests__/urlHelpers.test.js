import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeUrl } from '../urlHelpers.js';

describe('sanitizeUrl Utility Tests', () => {
  it('allows safe http and https URLs', () => {
    assert.strictEqual(sanitizeUrl('https://example.com'), 'https://example.com');
    assert.strictEqual(sanitizeUrl('http://example.com/path?query=1'), 'http://example.com/path?query=1');
  });

  it('allows relative paths and anchors', () => {
    assert.strictEqual(sanitizeUrl('/docs/report.pdf'), '/docs/report.pdf');
    assert.strictEqual(sanitizeUrl('#section-1'), '#section-1');
    assert.strictEqual(sanitizeUrl('mailto:support@lexora.app'), 'mailto:support@lexora.app');
  });

  it('blocks dangerous protocol schemes', () => {
    assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '#');
    assert.strictEqual(sanitizeUrl('JAVAscript:alert(1)'), '#');
    assert.strictEqual(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '#');
    assert.strictEqual(sanitizeUrl('vbscript:msgbox(1)'), '#');
    assert.strictEqual(sanitizeUrl('file:///etc/passwd'), '#');
    assert.strictEqual(sanitizeUrl('blob:https://example.com/uuid'), '#');
    assert.strictEqual(sanitizeUrl('about:blank'), '#');
    assert.strictEqual(sanitizeUrl('chrome://settings'), '#');
  });

  it('blocks unknown or invalid protocol schemes', () => {
    assert.strictEqual(sanitizeUrl('custom-protocol://test'), '#');
    assert.strictEqual(sanitizeUrl('ftp://example.com'), '#');
  });

  it('handles null, undefined, and non-string inputs safely', () => {
    assert.strictEqual(sanitizeUrl(null), '#');
    assert.strictEqual(sanitizeUrl(undefined), '#');
    assert.strictEqual(sanitizeUrl(12345), '#');
    assert.strictEqual(sanitizeUrl({}), '#');
  });
});
