/**
 * Lexora Application Constants
 */

export const DEFAULT_API_CONFIG = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY)) || '',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'openai/gpt-oss-120b',
};

export const TYPEWRITER_PHRASES = [
  "In plain English.",
  "Before you sign.",
  "Without legal jargon."
];

export const LOADING_STATUSES = [
  'Reading document content...',
  'Extracting key terms...',
  'Analyzing clauses...',
  'Preparing summary...'
];

export const RISK_COLOR_PALETTE = {
  low: {
    bg: 'var(--risk-low-bg)',
    border: 'var(--risk-low-border)',
    text: 'var(--risk-low-text)',
    label: 'Low Risk',
  },
  medium: {
    bg: 'var(--risk-medium-bg)',
    border: 'var(--risk-medium-border)',
    text: 'var(--risk-medium-text)',
    label: 'Medium Risk',
  },
  high: {
    bg: 'var(--risk-high-bg)',
    border: 'var(--risk-high-border)',
    text: 'var(--risk-high-text)',
    label: 'High Risk',
  },
};
