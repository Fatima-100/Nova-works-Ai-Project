import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, formatUserMessage } from './prompt.js';
import { db } from './db.js';
import { validateTranscriptOutput, ValidationErrorItem, ExtractedData } from './validate.js';

function stripFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Calls Gemini API using @google/genai SDK
 */
async function callGemini(userContent: string, systemPrompt: string, model: string = 'gemini-flash-latest'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const response = await ai.models.generateContent({
    model,
    contents: userContent,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text;
}

/**
 * Calls OpenRouter OpenAI-compatible API
 */
async function callOpenRouter(userContent: string, systemPrompt: string, model: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://novaworks.example',
      'X-Title': 'NovaWorks AI Project Manager',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`OpenRouter API error ${res.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned empty message content.');
  }

  return content;
}

export interface LLMProcessingResult {
  success: boolean;
  modelUsed: string;
  data?: ExtractedData;
  validationErrors?: ValidationErrorItem[];
  rawOutput?: string;
  error?: string;
}

/**
 * Orchestrates transcript extraction with:
 * 1. Safe Directory injection (no passwords/emails)
 * 2. Primary Gemini call & OpenRouter fallback
 * 3. One-shot retry with error feedback if JSON/validation fails
 * 4. Business rule verification
 */
export async function processTranscriptWithAI(transcript: string): Promise<LLMProcessingResult> {
  if (!transcript || !transcript.trim()) {
    return {
      success: false,
      modelUsed: 'none',
      error: 'Transcript is empty. Please provide a meeting transcript to extract.',
    };
  }

  // Load directory with only public fields (never passwordHash or email)
  const directory = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    specialization: u.specialization,
    skills: u.skills,
  }));

  const baseUserMessage = formatUserMessage(directory, transcript);

  // Determine provider candidates with ordered fallback
  const providers: Array<{ type: 'gemini' | 'openrouter'; model: string }> = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push({ type: 'gemini', model: 'gemini-flash-latest' });
    providers.push({ type: 'gemini', model: 'gemini-3.1-flash-lite' });
    providers.push({ type: 'gemini', model: 'gemini-3.8-flash' });
  }

  if (process.env.OPENROUTER_API_KEY) {
    const openRouterModels = (process.env.OPENROUTER_MODELS || 'google/gemini-2.0-flash-exp:free,meta-llama/llama-3.3-70b-instruct:free')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    for (const m of openRouterModels) {
      providers.push({ type: 'openrouter', model: m });
    }
  }

  if (providers.length === 0) {
    return {
      success: false,
      modelUsed: 'none',
      error: 'Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured in the environment.',
    };
  }

  let lastValidationErrors: ValidationErrorItem[] = [];
  let lastRawOutput = '';

  for (const provider of providers) {
    try {
      console.log(`[AI Engine] Attempting extraction with ${provider.type} (${provider.model})...`);

      // First attempt
      let rawResponse = '';
      if (provider.type === 'gemini') {
        rawResponse = await callGemini(baseUserMessage, SYSTEM_PROMPT, provider.model);
      } else {
        rawResponse = await callOpenRouter(baseUserMessage, SYSTEM_PROMPT, provider.model);
      }
      lastRawOutput = rawResponse;

      // Parse JSON
      let parsedJson: unknown;
      try {
        const cleaned = stripFences(rawResponse);
        parsedJson = JSON.parse(cleaned);
      } catch (jsonErr) {
        // Retry once with error feedback
        console.warn(`[AI Engine] JSON parse failed on first try. Retrying with error feedback...`);
        const retryPrompt = `${baseUserMessage}\n\n[SYSTEM RECOVERY NOTE]: Your previous output failed JSON parsing: ${(jsonErr as Error).message}. Please output ONLY strict valid JSON conforming to the requested schema.`;
        if (provider.type === 'gemini') {
          rawResponse = await callGemini(retryPrompt, SYSTEM_PROMPT, provider.model);
        } else {
          rawResponse = await callOpenRouter(retryPrompt, SYSTEM_PROMPT, provider.model);
        }
        lastRawOutput = rawResponse;
        parsedJson = JSON.parse(stripFences(rawResponse));
      }

      // Validate with Zod + business rules
      const validation = validateTranscriptOutput(parsedJson);

      if (validation.success && validation.data) {
        return {
          success: true,
          modelUsed: `${provider.type}:${provider.model}`,
          data: validation.data,
          rawOutput: lastRawOutput,
        };
      } else {
        // Validation failed: retry once with validation error feedback
        lastValidationErrors = validation.errors;
        console.warn(`[AI Engine] Business validation failed with ${validation.errors.length} errors. Retrying with specific error feedback...`);

        const errorFeedback = validation.errors.map((e) => `- ${e.path}: ${e.message}`).join('\n');
        const fixPrompt = `${baseUserMessage}\n\n[SYSTEM CORRECTION REQUIRED]: The previous extraction contained the following schema and business rule errors:\n${errorFeedback}\n\nPlease correct these violations and output valid JSON conforming strictly to the rules and team directory.`;

        let fixResponse = '';
        if (provider.type === 'gemini') {
          fixResponse = await callGemini(fixPrompt, SYSTEM_PROMPT, provider.model);
        } else {
          fixResponse = await callOpenRouter(fixPrompt, SYSTEM_PROMPT, provider.model);
        }
        lastRawOutput = fixResponse;

        const fixedJson = JSON.parse(stripFences(fixResponse));
        const retryValidation = validateTranscriptOutput(fixedJson);

        if (retryValidation.success && retryValidation.data) {
          return {
            success: true,
            modelUsed: `${provider.type}:${provider.model}`,
            data: retryValidation.data,
            rawOutput: lastRawOutput,
          };
        } else {
          lastValidationErrors = retryValidation.errors;
          console.warn(`[AI Engine] Model ${provider.model} failed retry validation. Trying next provider...`);
        }
      }
    } catch (providerError) {
      console.error(`[AI Engine] Error with ${provider.type}:${provider.model}:`, providerError);
    }
  }

  // All providers failed or validation errors persisted
  return {
    success: false,
    modelUsed: providers.map((p) => p.model).join(', '),
    validationErrors: lastValidationErrors.length > 0 ? lastValidationErrors : undefined,
    rawOutput: lastRawOutput,
    error:
      lastValidationErrors.length > 0
        ? `Transcript extracted with ${lastValidationErrors.length} unresolved business rule issues. Data was not saved.`
        : 'Failed to extract valid project data from transcript across all AI providers.',
  };
}
