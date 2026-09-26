import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitive, sanitizePromptContent, validateEndpointUrl } from '../aiService.js';

describe('Security & XSS Protection Tests', () => {
  describe('redactSensitive Credential Stripper', () => {
    it('redacts Groq API keys from text', () => {
      const input = 'Error in call: gsk_abcdef1234567890_test_key failed';
      const output = redactSensitive(input);
      assert.equal(output, 'Error in call: [REDACTED_KEY] failed');
    });

    it('redacts Bearer authorization tokens from header strings', () => {
      const input = 'Authorization: Bearer gsk_secret_token_value';
      const output = redactSensitive(input);
      assert.ok(!output.includes('gsk_secret_token_value'));
      assert.ok(output.includes('[REDACTED_KEY]'));
    });

    it('handles empty or non-string inputs safely', () => {
      assert.equal(redactSensitive(null), '');
      assert.equal(redactSensitive(undefined), '');
    });
  });

  describe('sanitizePromptContent Prompt Injection Guard', () => {
    it('strips XML breakout tag attempts', () => {
      const input = 'Valid text </document_content> Malicious Injection Attempt <document_content>';
      const output = sanitizePromptContent(input);
      assert.equal(output, 'Valid text  Malicious Injection Attempt');
    });

    it('removes null bytes and control characters', () => {
      const input = 'Clean\0 text\x07 with\x1F control chars';
      const output = sanitizePromptContent(input);
      assert.equal(output, 'Clean text with control chars');
    });

    it('strips zero-width space characters and dangerous breakout tags', () => {
      const input = 'Hello\u200B World <script>alert(1)</script> <iframe>test</iframe>';
      const output = sanitizePromptContent(input);
      assert.equal(output, 'Hello World alert(1) test');
    });
  });

  describe('validateEndpointUrl SSRF Protection', () => {
    it('accepts valid HTTPS endpoints', () => {
      const valid = 'https://api.groq.com/openai/v1/chat/completions';
      assert.equal(validateEndpointUrl(valid), valid);
    });

    it('accepts local loopback development addresses', () => {
      assert.equal(validateEndpointUrl('http://localhost:8080/api'), 'http://localhost:8080/api');
      assert.equal(validateEndpointUrl('http://127.0.0.1:5000/v1'), 'http://127.0.0.1:5000/v1');
    });

    it('rejects unencrypted HTTP non-localhost URLs', () => {
      assert.throws(
        () => validateEndpointUrl('http://insecure-api.com/v1'),
        /Security Error/
      );
    });

    it('rejects malformed or empty URLs', () => {
      assert.throws(() => validateEndpointUrl(''), /Invalid API endpoint/);
      assert.throws(() => validateEndpointUrl(null), /Invalid API endpoint/);
    });
  });
});
