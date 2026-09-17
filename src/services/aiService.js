import { LEX_SYSTEM_PROMPT, QA_SYSTEM_PROMPT } from './prompts.js';

const DEFAULT_CONFIG = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'openai/gpt-oss-120b',
};

export async function analyzeLegalDocument(documentText, config = DEFAULT_CONFIG) {
  const { apiKey, endpoint, model } = config;

  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Dev Settings.");
  }

  const prompt = `${LEX_SYSTEM_PROMPT}

Document Text:
---
${documentText.substring(0, 18000)}
---
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
}

export async function askQuestion(documentText, conversationHistory, userQuestion, apiKey) {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Dev Settings.");
  }

  const systemMessage = `${QA_SYSTEM_PROMPT}

Document Text:
---
${documentText.substring(0, 18000)}
---`;

  const messages = [
    { role: "system", content: systemMessage },
    ...conversationHistory,
    { role: "user", content: userQuestion }
  ];

  try {
    const response = await fetch(DEFAULT_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_CONFIG.model,
        messages: messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error in Q&A:", error);
    throw error;
  }
}
