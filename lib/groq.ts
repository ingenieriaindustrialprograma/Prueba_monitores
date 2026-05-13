import OpenAI from 'openai';

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Lazy-init: avoids crashing at build time when env vars are absent
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || 'not-configured',
      baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    });
  }
  return _client;
}

// Throttle: 1 request each 2 seconds to avoid rate limits
let lastCall = 0;

export async function groqChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  retries = 3
): Promise<string> {
  const groq = getClient();
  const now = Date.now();
  const wait = Math.max(0, 2000 - (now - lastCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 3000,
      });
      return res.choices[0]?.message?.content ?? '';
    } catch (err: unknown) {
      if (attempt === retries - 1) throw err;
      // Exponential backoff: 2s, 4s, 8s
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }
  }
  return '';
}
