import {
  LEX_SYSTEM_PROMPT,
  QA_SYSTEM_PROMPT,
  COMPARISON_SYSTEM_PROMPT
} from './prompts.js';
import { DEFAULT_API_CONFIG } from '../constants/appConstants.js';

/**
 * Validate that an API endpoint URL uses secure HTTPS or local loopback.
 * @param {string} endpoint 
 * @returns {string} Sanitized endpoint URL
 */
function validateEndpointUrl(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error("Invalid API endpoint.");
  }
  const trimmed = endpoint.trim();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith('https://') && !lower.startsWith('http://localhost') && !lower.startsWith('http://127.0.0.1')) {
    throw new Error("Security Error: API endpoint must use HTTPS or local development address.");
  }
  return trimmed;
}

/**
 * Generic API Call Helper
 */
async function callLLM(promptMessages, config = DEFAULT_API_CONFIG, temperature = 0.1) {
  const activeConfig = { ...DEFAULT_API_CONFIG, ...config };
  const effectiveKey = (config && typeof config.apiKey === 'string')
    ? config.apiKey.trim()
    : (activeConfig.apiKey || '').trim();
  const { endpoint, model } = activeConfig;

  if (!effectiveKey) {
    throw new Error("API Key is missing. Please configure it in Dev Settings.");
  }

  const validEndpoint = validateEndpointUrl(endpoint);

  const response = await fetch(validEndpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${effectiveKey.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: promptMessages,
      temperature: temperature
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Analyze a legal document using AI LLM API.
 */
export async function analyzeLegalDocument(documentText, config = DEFAULT_API_CONFIG, a11yOptions = {}) {
  const safeText = (documentText || '').substring(0, 25000);

  let extraInstructions = '';
  if (a11yOptions.simplifiedLanguage) {
    extraInstructions += '\n- INSTRUCTION: Use simple, plain English (5th-grade reading level) free of complex legal jargon.';
  }
  if (a11yOptions.language && a11yOptions.language !== 'en') {
    extraInstructions += `\n- INSTRUCTION: Respond in language: ${a11yOptions.language}.`;
  }

  const prompt = `${LEX_SYSTEM_PROMPT}${extraInstructions}\n\n<document_content>\n${safeText}\n</document_content>`;
  return callLLM([{ role: "user", content: prompt }], config, 0.1);
}

/**
 * Ask a question about the legal document.
 */
export async function askQuestion(documentText, conversationHistory, userQuestion, config = DEFAULT_API_CONFIG, a11yOptions = {}) {
  const safeText = (documentText || '').substring(0, 25000);

  let extraInstructions = '';
  if (a11yOptions.simplifiedLanguage) {
    extraInstructions += '\n- INSTRUCTION: Explain in clear, simple plain language free of legalese.';
  }
  if (a11yOptions.language && a11yOptions.language !== 'en') {
    extraInstructions += `\n- INSTRUCTION: Respond in language: ${a11yOptions.language}.`;
  }

  const systemMessage = `${QA_SYSTEM_PROMPT}${extraInstructions}\n\n<document_content>\n${safeText}\n</document_content>`;

  const sanitizedHistory = (conversationHistory || []).map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: String(msg.content || '').substring(0, 2000)
  }));

  const messages = [
    { role: "system", content: systemMessage },
    ...sanitizedHistory,
    { role: "user", content: String(userQuestion || '').substring(0, 1000) }
  ];

  return callLLM(messages, config, 0.3);
}

/**
 * Compare two legal documents (Document A vs Document B).
 */
export async function compareLegalDocuments(docTextA, docTextB, config = DEFAULT_API_CONFIG, a11yOptions = {}) {
  const safeA = (docTextA || '').substring(0, 15000);
  const safeB = (docTextB || '').substring(0, 15000);

  let extraInstructions = '';
  if (a11yOptions.simplifiedLanguage) {
    extraInstructions += '\n- INSTRUCTION: Use simple plain English.';
  }
  if (a11yOptions.language && a11yOptions.language !== 'en') {
    extraInstructions += `\n- INSTRUCTION: Respond in language: ${a11yOptions.language}.`;
  }

  const prompt = `${COMPARISON_SYSTEM_PROMPT}${extraInstructions}

<document_a>
${safeA}
</document_a>

<document_b>
${safeB}
</document_b>`;

  return callLLM([{ role: "user", content: prompt }], config, 0.1);
}
