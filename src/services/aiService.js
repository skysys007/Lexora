import {
  LEX_SYSTEM_PROMPT,
  QA_SYSTEM_PROMPT,
  COMPARISON_SYSTEM_PROMPT
} from './prompts.js';
import { DEFAULT_API_CONFIG } from '../constants/appConstants.js';

// LRU Cache for AI API Responses (Max 30 entries)
const responseCache = new Map();
const MAX_RESPONSE_CACHE_SIZE = 30;

/**
 * Generate a cache key from messages and active configuration.
 * @param {Array<Object>} messages 
 * @param {Object} config 
 * @returns {string} Cache key
 */
function generateCacheKey(messages, config) {
  try {
    const msgString = messages.map(m => `${m.role}:${m.content}`).join('|');
    return `${config.endpoint}_${config.model}_${msgString}`;
  } catch {
    return '';
  }
}

/**
 * Validate that an API endpoint URL uses secure HTTPS or local loopback development addresses.
 * @param {string} endpoint - Target API endpoint URL
 * @returns {string} Sanitized valid endpoint URL
 * @throws {Error} If endpoint URL is invalid or uses an insecure protocol
 */
export function validateEndpointUrl(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error("Invalid API endpoint.");
  }
  const trimmed = endpoint.trim();
  const lower = trimmed.toLowerCase();

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    if (protocol === 'https:' || (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1'))) {
      return trimmed;
    }
  } catch {
    // If URL constructor fails, fallback to prefix matching
    if (lower.startsWith('https://') || lower.startsWith('http://localhost') || lower.startsWith('http://127.0.0.1')) {
      return trimmed;
    }
  }

  throw new Error("Security Error: API endpoint must use HTTPS or local development address.");
}

/**
 * Generic API Call Helper with Timeout Guard, AbortController, and LRU Caching.
 * @param {Array<Object>} promptMessages - Array of chat messages
 * @param {Object} [config] - API configuration override
 * @param {number} [temperature=0.1] - Sampling temperature
 * @returns {Promise<string>} Model output string
 * @throws {Error} If API key is missing, endpoint is invalid, or request fails
 */
async function callLLM(promptMessages, config = DEFAULT_API_CONFIG, temperature = 0.1) {
  const activeConfig = { ...DEFAULT_API_CONFIG, ...config };
  const customKey = (config && typeof config.apiKey === 'string') ? config.apiKey.trim() : '';
  const effectiveKey = customKey || (DEFAULT_API_CONFIG.apiKey || '').trim();

  let modelToUse = activeConfig.model;
  if (!modelToUse || typeof modelToUse !== 'string' || modelToUse.includes('llama-3.3-70b-versatile') || modelToUse.includes('llama3-70b-8192')) {
    modelToUse = DEFAULT_API_CONFIG.model;
  }

  const activeWithModel = { ...activeConfig, model: modelToUse };
  const { endpoint } = activeWithModel;

  if (!effectiveKey) {
    throw new Error("API Key is missing. Please configure it in Dev Settings.");
  }

  const validEndpoint = validateEndpointUrl(endpoint);

  // Check LRU Response Cache
  const cacheKey = generateCacheKey(promptMessages, activeWithModel);
  if (cacheKey && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  // Set 30-second AbortController Timeout Guard
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(validEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${effectiveKey.trim()}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelToUse,
        messages: promptMessages,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed (${response.status})`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;

    // Cache successful response
    if (cacheKey && resultText) {
      if (responseCache.size >= MAX_RESPONSE_CACHE_SIZE) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
      }
      responseCache.set(cacheKey, resultText);
    }

    return resultText;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("API request timed out (30s). Please check your internet connection or try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Clear the AI response memory cache (Utility for testing or clearing memory).
 */
export function clearResponseCache() {
  responseCache.clear();
}

/**
 * Analyze a legal document using AI LLM API.
 * @param {string} documentText - Document text content
 * @param {Object} [config] - API configuration override
 * @param {Object} [a11yOptions] - Accessibility options (language, simplification)
 * @returns {Promise<string>} Raw JSON response string
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
 * @param {string} documentText - Context document text
 * @param {Array<Object>} conversationHistory - Prior question/answer turn objects
 * @param {string} userQuestion - Target user question
 * @param {Object} [config] - API configuration override
 * @param {Object} [a11yOptions] - Accessibility options
 * @returns {Promise<string>} Answer string
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
 * @param {string} docTextA - Text of Document A
 * @param {string} docTextB - Text of Document B
 * @param {Object} [config] - API configuration override
 * @param {Object} [a11yOptions] - Accessibility options
 * @returns {Promise<string>} Raw JSON comparison string
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
