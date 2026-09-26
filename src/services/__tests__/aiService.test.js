import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { analyzeLegalDocument, askQuestion } from '../aiService.js';

describe('aiService Security & Protocol Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  describe('analyzeLegalDocument', () => {
    it('throws an error if API key is missing', async () => {
      await assert.rejects(
        async () => analyzeLegalDocument('sample text', { apiKey: '' }),
        /API Key is missing/
      );
    });

    it('rejects insecure non-HTTPS or non-localhost endpoint URLs', async () => {
      const invalidConfig = {
        apiKey: 'gsk_test123',
        endpoint: 'http://malicious-site.com/api',
      };

      await assert.rejects(
        async () => analyzeLegalDocument('sample text', invalidConfig),
        /Security Error: API endpoint must use HTTPS/
      );
    });

    it('accepts valid HTTPS endpoints', async () => {
      const validConfig = {
        apiKey: 'gsk_test123',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'openai/gpt-oss-120b',
      };

      let fetchCalledWith = null;
      global.fetch = async (url, options) => {
        fetchCalledWith = { url, options };
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '{"document_type": "NDA", "critical_points": []}' } }],
          }),
        };
      };

      const result = await analyzeLegalDocument('Test legal agreement', validConfig);
      assert.ok(result.includes('document_type'));
      assert.strictEqual(fetchCalledWith.url, 'https://api.groq.com/openai/v1/chat/completions');
      assert.strictEqual(fetchCalledWith.options.headers.Authorization, 'Bearer gsk_test123');
    });

    it('encloses document text within <document_content> security tags', async () => {
      const validConfig = {
        apiKey: 'gsk_test123',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      };

      let capturedBody = null;
      global.fetch = async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: '{}' } }] }),
        };
      };

      await analyzeLegalDocument('Secret contract text', validConfig);

      const promptContent = capturedBody.messages[0].content;
      assert.ok(promptContent.includes('<document_content>'));
      assert.ok(promptContent.includes('Secret contract text'));
      assert.ok(promptContent.includes('</document_content>'));
    });
  });

  describe('askQuestion', () => {
    it('throws an error if API key is missing', async () => {
      await assert.rejects(
        async () => askQuestion('sample text', [], 'What is this?', { apiKey: '' }),
        /API Key is missing/
      );
    });

    it('passes conversation history and user question correctly', async () => {
      const validConfig = {
        apiKey: 'gsk_test123',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'custom-model-99',
      };

      let capturedBody = null;
      global.fetch = async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: 'Answer text' } }] }),
        };
      };

      const history = [{ role: 'user', content: 'First question' }];
      const answer = await askQuestion('Document content', history, 'Second question', validConfig);

      assert.strictEqual(answer, 'Answer text');
      assert.strictEqual(capturedBody.model, 'custom-model-99');
      assert.strictEqual(capturedBody.messages.length, 3); // System prompt + history + current question
    });
  });
});
