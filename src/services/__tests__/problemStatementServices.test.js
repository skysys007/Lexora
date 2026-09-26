import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COMPARISON_SYSTEM_PROMPT } from '../prompts.js';
import { compareLegalDocuments } from '../aiService.js';

describe('Problem Statement Services & Prompts Integrity Tests', () => {
  describe('Prompts Schema Verification', () => {
    it('COMPARISON_SYSTEM_PROMPT contains security directives and comparison fields', () => {
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('<document_a>'));
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('<document_b>'));
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('more_favorable_document'));
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('key_differences'));
    });
  });

  describe('Service Function Input Validation', () => {
    it('compareLegalDocuments throws error when API key is missing', async () => {
      await assert.rejects(
        async () => {
          await compareLegalDocuments('Doc A Text', 'Doc B Text', { apiKey: '' });
        },
        { message: 'API Key is missing. Please configure it in Dev Settings.' }
      );
    });
  });
});
