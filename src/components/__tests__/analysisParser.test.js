import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RISK_COLOR_PALETTE } from '../../constants/appConstants.js';

describe('Analysis Results JSON Parser & Data Integrity Tests', () => {
  const parseLlmOutput = (results) => {
    if (typeof results === 'string') {
      try {
        const jsonMatch = results.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        return null;
      }
    }
    return null;
  };

  it('parses valid raw JSON strings correctly', () => {
    const rawJson = JSON.stringify({
      document_type: 'Apartment Lease',
      one_line_summary: 'Standard 1-year lease agreement.',
      critical_points: [
        {
          title: 'Unannounced Entry',
          severity: 'high',
          what_it_means: 'Landlord can enter at any time.',
          why_you_care: 'No privacy warning.',
        },
      ],
      risk_level: 'high',
    });

    const parsed = parseLlmOutput(rawJson);
    assert.notStrictEqual(parsed, null);
    assert.strictEqual(parsed.document_type, 'Apartment Lease');
    assert.strictEqual(parsed.critical_points.length, 1);
  });

  it('extracts JSON when wrapped in Markdown code blocks (```json ... ```)', () => {
    const markdownOutput = `
Here is the document analysis:

\`\`\`json
{
  "document_type": "NDA Agreement",
  "critical_points": [
    {
      "title": "5-year secrecy",
      "severity": "medium"
    }
  ],
  "risk_level": "medium"
}
\`\`\`

Hope this helps!
    `;

    const parsed = parseLlmOutput(markdownOutput);
    assert.notStrictEqual(parsed, null);
    assert.strictEqual(parsed.document_type, 'NDA Agreement');
    assert.strictEqual(parsed.risk_level, 'medium');
  });

  it('returns null gracefully for invalid non-JSON output', () => {
    const invalidMarkdown = '# Document Analysis\nThis is just plain text markdown without JSON.';
    const parsed = parseLlmOutput(invalidMarkdown);
    assert.strictEqual(parsed, null);
  });

  it('correctly maps risk levels to RISK_COLOR_PALETTE definitions', () => {
    assert.strictEqual(RISK_COLOR_PALETTE.low.label, 'Low Risk');
    assert.strictEqual(RISK_COLOR_PALETTE.medium.label, 'Medium Risk');
    assert.strictEqual(RISK_COLOR_PALETTE.high.label, 'High Risk');
  });
});
