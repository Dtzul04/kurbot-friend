import { Hono } from 'hono';
import { context, redis, reddit, settings } from '@devvit/web/server';
import type {
  ChatHistoryResponse,
  ChatRequest,
  ChatResponse,
  SavedChatMessage,
} from '../../shared/chat';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

const getChatKey = (postId: string) => `chat:${postId}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseSavedMessages = (raw: string): SavedChatMessage[] => {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    const messages: SavedChatMessage[] = [];
    for (const item of data) {
      if (!isRecord(item)) {
        continue;
      }
      const sender = item['sender'];
      const text = item['text'];
      if (sender !== 'you' && sender !== 'kurbot') {
        continue;
      }
      if (typeof text !== 'string' || !text) {
        continue;
      }
      messages.push({ sender, text });
    }
    return messages;
  } catch {
    return [];
  }
};

const readChatMessages = async (postId: string): Promise<SavedChatMessage[]> => {
  const raw = await redis.get(getChatKey(postId));
  if (!raw) {
    return [];
  }
  return parseSavedMessages(raw);
};

const writeChatMessages = async (
  postId: string,
  messages: SavedChatMessage[]
) => {
  await redis.set(getChatKey(postId), JSON.stringify(messages));
};

/** Groq Chat Completions (OpenAI-compatible). See https://console.groq.com/docs/api-reference */
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
/** Pick a supported model ID from Groq docs; update if deprecations bite. */
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const parseGroqMessageContent = (data: unknown): string | undefined => {
  if (!isRecord(data)) {
    return undefined;
  }
  const choices = data['choices'];
  if (!Array.isArray(choices) || choices.length < 1) {
    return undefined;
  }
  const first = choices[0];
  if (!isRecord(first)) {
    return undefined;
  }
  const messageBody = first['message'];
  if (!isRecord(messageBody)) {
    return undefined;
  }
  const content = messageBody['content'];
  if (typeof content !== 'string') {
    return undefined;
  }
  const trimmed = content.trim();
  return trimmed === '' ? undefined : trimmed;
};

const fetchGroqReply = async (
  apiKey: string,
  displayName: string,
  userMessage: string
): Promise<string | undefined> => {
  try {
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              `You are Kurbot Friend—a warm, brief, supportive Reddit chat buddy. Speak to "${displayName}" like a thoughtful friend (no slang overload). Typically a few sentences unless they ask for more.`,
          },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_completion_tokens: 512,
      }),
    });

    const body: unknown = await res.json();
    if (!res.ok) {
      console.error(`Groq error ${res.status}`, body);
      return undefined;
    }
    return parseGroqMessageContent(body);
  } catch (error) {
    console.error('Groq fetch failed', error);
    return undefined;
  }
};

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

api.get('/chat/history', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>({
      status: 'error',
      message: 'postId is required',
    }, 400);
  }
  const messages = await readChatMessages(postId);
  return c.json<ChatHistoryResponse>({ messages }, 200);
});

api.post('/chat', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const body = await c.req.json<ChatRequest>();
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return c.json({ status: 'error', message: 'Message is required' }, 400);
  }

  const groqApiKeyUnknown = await settings.get('groqApiKey');
  const groqApiKey =
    typeof groqApiKeyUnknown === 'string' ? groqApiKeyUnknown.trim() : '';
  if (!groqApiKey) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message:
          'Groq API key is not configured. Ask the app developer to set groqApiKey.',
      },
      503
    );
  }

  const username = await reddit.getCurrentUsername();
  const friendName = username ?? 'friend';
  const reply = await fetchGroqReply(groqApiKey, friendName, message);
  if (reply === undefined) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message:
          'Kurbot could not reach the AI service. For Devvit playtest: Reddit must approve outgoing HTTP to api.groq.com for this app—open Developer Settings for your app and confirm that domain is allowed (not pending).',
      },
      502
    );
  }

  const previous = await readChatMessages(postId);
  const next: SavedChatMessage[] = [
    ...previous,
    { sender: 'you', text: message },
    { sender: 'kurbot', text: reply },
  ];
  await writeChatMessages(postId, next);

  return c.json<ChatResponse>({ reply }, 200);
});