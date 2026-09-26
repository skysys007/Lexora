import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromDocument, clearExtractionCache } from '../ocrService.js';

describe('ocrService Extraction & Cache Unit Tests', () => {
  it('throws error when no file is provided', async () => {
    await assert.rejects(
      async () => extractTextFromDocument(null),
      /No file provided/
    );
  });

  it('throws error when unsupported file type is provided', async () => {
    const fakeFile = {
      name: 'unsupported.exe',
      type: 'application/x-msdownload',
      size: 1024
    };

    await assert.rejects(
      async () => extractTextFromDocument(fakeFile),
      /Unsupported file format/
    );
  });

  it('clears extraction cache cleanly without throwing errors', () => {
    assert.doesNotThrow(() => {
      clearExtractionCache();
    });
  });
});
