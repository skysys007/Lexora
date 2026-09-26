import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripMarkdownForSpeech } from '../a11yHelpers.js';
import { DEFAULT_A11Y_CONFIG, UI_TRANSLATIONS, SUPPORTED_LANGUAGES } from '../../constants/a11yConstants.js';

describe('a11yHelpers & Constants Unit Tests', () => {
  describe('stripMarkdownForSpeech', () => {
    it('strips headers (# ## ###)', () => {
      const input = '# Heading 1\n## Subheading';
      const output = stripMarkdownForSpeech(input);
      assert.equal(output, 'Heading 1. Subheading');
    });

    it('strips bold and italic markdown markers', () => {
      const input = 'This is **important** and *critical* text.';
      const output = stripMarkdownForSpeech(input);
      assert.equal(output, 'This is important and critical text.');
    });

    it('replaces links with anchor text', () => {
      const input = 'Read the [Terms of Service](https://example.com/terms) carefully.';
      const output = stripMarkdownForSpeech(input);
      assert.equal(output, 'Read the Terms of Service carefully.');
    });

    it('converts bullet points into spoken pauses', () => {
      const input = '- Item 1\n- Item 2\n- Item 3';
      const output = stripMarkdownForSpeech(input);
      assert.equal(output, '. Item 1. Item 2. Item 3');
    });

    it('strips all emojis from text', () => {
      const input = '🛑 High Risk ⚠️ Caution ✅ Approved ⚖️ Legal';
      const output = stripMarkdownForSpeech(input);
      assert.equal(output, 'High Risk Caution Approved Legal');
    });

    it('handles empty or non-string input gracefully', () => {
      assert.equal(stripMarkdownForSpeech(null), '');
      assert.equal(stripMarkdownForSpeech(undefined), '');
      assert.equal(stripMarkdownForSpeech(123), '');
    });
  });

  describe('Accessibility Constants Integrity', () => {
    it('has valid default accessibility configuration defaults', () => {
      assert.equal(DEFAULT_A11Y_CONFIG.fontSize, 'normal');
      assert.equal(DEFAULT_A11Y_CONFIG.dyslexicFont, false);
      assert.equal(DEFAULT_A11Y_CONFIG.highContrast, false);
      assert.equal(DEFAULT_A11Y_CONFIG.reducedMotion, false);
      assert.equal(DEFAULT_A11Y_CONFIG.simplifiedLanguage, false);
      assert.equal(DEFAULT_A11Y_CONFIG.language, 'en');
      assert.equal(DEFAULT_A11Y_CONFIG.ttsSpeed, 1.0);
    });

    it('supports required UI translations across supported languages', () => {
      const requiredKeys = ['skipToMain', 'a11ySettings', 'highContrast', 'dyslexicFont', 'readAloud'];
      SUPPORTED_LANGUAGES.forEach(lang => {
        const dict = UI_TRANSLATIONS[lang.code];
        assert.ok(dict, `Translation dictionary for ${lang.code} should exist`);
        requiredKeys.forEach(key => {
          assert.ok(dict[key], `Translation for key "${key}" in language "${lang.code}" should not be empty`);
        });
      });
    });
  });
});
