import type { HostedModel, SplunkEnv } from './types';

/**
 * Real Splunk hosted-model client. Assumes an OpenAI-compatible chat-completions
 * endpoint (the common shape for hosted-model gateways); adjust the request/parse
 * shape to match your Splunk instance's AI endpoint if it differs.
 */
export function makeHostedModel(env: SplunkEnv): HostedModel {
  const endpoint = env.SPLUNK_MODEL_ENDPOINT;
  const model = env.SPLUNK_MODEL_NAME ?? 'splunk-hosted';
  if (!endpoint) throw new Error('SPLUNK_MODEL_ENDPOINT is required for the hosted model');

  async function chat(messages: { role: string; content: string }[], temperature = 0.2): Promise<string> {
    const res = await fetch(endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.SPLUNK_MODEL_TOKEN ? { Authorization: `Bearer ${env.SPLUNK_MODEL_TOKEN}` } : {}),
      },
      body: JSON.stringify({ model, temperature, messages }),
    });
    if (!res.ok) throw new Error(`Hosted model failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      content?: { text?: string }[];
    };
    return data.choices?.[0]?.message?.content ?? data.content?.[0]?.text ?? '';
  }

  return {
    async complete(prompt, opts) {
      return chat([{ role: 'user', content: prompt }], opts?.temperature);
    },

    async json<T>(prompt: string, instruction: string): Promise<T> {
      const content = await chat(
        [
          {
            role: 'system',
            content: `You are Synt, an autonomous SOC analyst. Respond with ONLY valid JSON, no prose, no markdown fences. ${instruction}`,
          },
          { role: 'user', content: prompt },
        ],
        0.1,
      );
      return JSON.parse(extractJson(content)) as T;
    },

    async nlToSpl(question, indexes) {
      const content = await chat(
        [
          {
            role: 'system',
            content: `Translate the analyst's question into a single valid Splunk SPL search. Use only these indexes: ${indexes.join(', ')}. Respond with ONLY the SPL, no explanation, no code fences.`,
          },
          { role: 'user', content: question },
        ],
        0,
      );
      return content.replace(/```[a-z]*|```/g, '').trim();
    },
  };
}

function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf(']'), body.lastIndexOf('}'));
  return start >= 0 && end >= start ? body.slice(start, end + 1) : body;
}
