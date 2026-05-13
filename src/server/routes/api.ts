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

type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

const getChatKey = (postId: string, username: string) =>
  `chat:${postId}:${username}`;

const getCountKey = (postId: string) => `count:${postId}`;

const MAX_CONTEXT_MESSAGES = 12;
const MAX_STORED_MESSAGES = 40;
/** Limits abuse: Redis payload size and Gemini input. */
const MAX_CHAT_MESSAGE_CHARS = 4000;

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

const readChatMessages = async (
  postId: string,
  username: string
): Promise<SavedChatMessage[]> => {
  const raw = await redis.get(getChatKey(postId, username));
  if (!raw) {
    return [];
  }
  return parseSavedMessages(raw);
};

const writeChatMessages = async (
  postId: string,
  username: string,
  messages: SavedChatMessage[]
) => {
  await redis.set(
    getChatKey(postId, username),
    JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
  );
};

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const parseGeminiMessageContent = (data: unknown): string | undefined => {
  if (!isRecord(data)) {
    return undefined;
  }
  const candidates = data['candidates'];
  if (!Array.isArray(candidates) || candidates.length < 1) {
    return undefined;
  }
  const first = candidates[0];
  if (!isRecord(first)) {
    return undefined;
  }
  const content = first['content'];
  if (!isRecord(content)) {
    return undefined;
  }
  const parts = content['parts'];
  if (!Array.isArray(parts)) {
    return undefined;
  }
  const textParts: string[] = [];
  for (const part of parts) {
    if (!isRecord(part)) {
      continue;
    }
    const text = part['text'];
    if (typeof text === 'string') {
      textParts.push(text);
    }
  }
  const trimmed = textParts.join('').trim();
  return trimmed === '' ? undefined : trimmed;
};

const buildGeminiContents = (
  previousMessages: SavedChatMessage[],
  userMessage: string
): GeminiContent[] => {
  const recentMessages = previousMessages.slice(-MAX_CONTEXT_MESSAGES);
  const historyContents: GeminiContent[] = recentMessages.map((message) => ({
    role: message.sender === 'you' ? 'user' : 'model',
    parts: [{ text: message.text }],
  }));

  return [
    ...historyContents,
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];
};

const fetchGeminiReply = async (
  apiKey: string,
  displayName: string,
  previousMessages: SavedChatMessage[],
  userMessage: string
): Promise<string | undefined> => {
  try {
    const res = await fetch(GEMINI_CHAT_URL, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `You are Kurbot Friend, a warm, brief, supportive Reddit chat buddy. Speak to "${displayName}" like a thoughtful friend. Typically answer in a few sentences unless they ask for more.`,
            },
          ],
        },
        contents: buildGeminiContents(previousMessages, userMessage),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });

    const body: unknown = await res.json();
    if (!res.ok) {
      console.error(`Gemini error ${res.status}`, body);
      return undefined;
    }
    return parseGeminiMessageContent(body);
  } catch (error) {
    console.error('Gemini fetch failed', error);
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
      redis.get(getCountKey(postId)),
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

  const count = await redis.incrBy(getCountKey(postId), 1);
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

  const count = await redis.incrBy(getCountKey(postId), -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

api.get('/chat/history', async (c) => {
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

  const username = await reddit.getCurrentUsername();
  if (!username) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'You must be logged in to use chat.',
      },
      401
    );
  }

  const messages = await readChatMessages(postId, username);
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
  if (message.length > MAX_CHAT_MESSAGE_CHARS) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: `Message is too long (max ${MAX_CHAT_MESSAGE_CHARS} characters).`,
      },
      400
    );
  }

  const username = await reddit.getCurrentUsername();
  if (!username) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'You must be logged in to use chat.',
      },
      401
    );
  }

  const geminiApiKeyUnknown = await settings.get('geminiApiKey');
  const geminiApiKey =
    typeof geminiApiKeyUnknown === 'string' ? geminiApiKeyUnknown.trim() : '';
  if (!geminiApiKey) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message:
          'Gemini API key is not configured. Ask the app developer to set geminiApiKey.',
      },
      503
    );
  }

  const previous = await readChatMessages(postId, username);
  const reply = await fetchGeminiReply(
    geminiApiKey,
    username,
    previous,
    message
  );
  if (reply === undefined) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message:
          'Kurbot could not get a reply from the AI service. Check your API key, quota, or try again in a moment.',
      },
      502
    );
  }

  const next: SavedChatMessage[] = [
    ...previous,
    { sender: 'you', text: message },
    { sender: 'kurbot', text: reply },
  ];
  await writeChatMessages(postId, username, next);

  return c.json<ChatResponse>({ reply }, 200);
});