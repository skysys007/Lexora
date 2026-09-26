import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPARISON_SYSTEM_PROMPT,
  CHECKLIST_SYSTEM_PROMPT,
  LAWYER_PREP_SYSTEM_PROMPT
} from '../prompts.js';
import { compareLegalDocuments, generateDocumentChecklist, generateLawyerPrepBrief } from '../aiService.js';

describe('Problem Statement Services & Prompts Integrity Tests', () => {
  describe('Prompts Schema Verification', () => {
    it('COMPARISON_SYSTEM_PROMPT contains security directives and comparison fields', () => {
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('<document_a>'));
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('<document_b>'));
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('more_favorable_document'));
      assert.ok(COMPARISON_SYSTEM_PROMPT.includes('key_differences'));
    });

    it('CHECKLIST_SYSTEM_PROMPT contains security directives and checklist categories', () => {
      assert.ok(CHECKLIST_SYSTEM_PROMPT.includes('deadlines'));
      assert.ok(CHECKLIST_SYSTEM_PROMPT.includes('user_obligations'));
      assert.ok(CHECKLIST_SYSTEM_PROMPT.includes('prohibitions'));
      assert.ok(CHECKLIST_SYSTEM_PROMPT.includes('financial_commitments'));
    });

    it('LAWYER_PREP_SYSTEM_PROMPT contains consultation readiness fields', () => {
      assert.ok(LAWYER_PREP_SYSTEM_PROMPT.includes('document_summary_brief'));
      assert.ok(LAWYER_PREP_SYSTEM_PROMPT.includes('high_priority_concerns'));
      assert.ok(LAWYER_PREP_SYSTEM_PROMPT.includes('questions_for_lawyer'));
      assert.ok(LAWYER_PREP_SYSTEM_PROMPT.includes('recommended_negotiations'));
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

    it('generateDocumentChecklist throws error when API key is missing', async () => {
      await assert.rejects(
        async () => {
          await generateDocumentChecklist('Sample Document Text', { apiKey: '' });
        },
        { message: 'API Key is missing. Please configure it in Dev Settings.' }
      );
    });

    it('generateLawyerPrepBrief throws error when API key is missing', async () => {
      await assert.rejects(
        async () => {
          await generateLawyerPrepBrief('Sample Document Text', { apiKey: '' });
        },
        { message: 'API Key is missing. Please configure it in Dev Settings.' }
      );
    });
  });
});
