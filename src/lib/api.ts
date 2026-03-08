import { supabase } from '@/integrations/supabase/client';
import type { FlashCard } from '@/stores/useCardStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function generateCards(topic: string): Promise<{ topic: string; cards: FlashCard[] }> {
  const { data, error } = await supabase.functions.invoke('generate-cards', {
    body: { topic },
  });

  if (error) throw new Error(error.message || 'Failed to generate cards');
  if (data?.error) throw new Error(data.error);
  return data;
}

type Msg = { role: 'user' | 'assistant'; content: string };

export async function streamChat({
  messages,
  topic,
  cardContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  topic: string;
  cardContext?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ messages, topic, cardContext }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) { onError('No response body'); return; }
  await parseSSE(resp.body, onDelta, onDone);
}

export async function streamSummary({
  topic,
  cards,
  onDelta,
  onDone,
  onError,
}: {
  topic: string;
  cards: FlashCard[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ topic, cards }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) { onError('No response body'); return; }
  await parseSSE(resp.body, onDelta, onDone);
}

async function parseSSE(body: ReadableStream, onDelta: (t: string) => void, onDone: () => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }

      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}
