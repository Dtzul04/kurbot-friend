import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
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

  const username = await reddit.getCurrentUsername();
  const reply = `Got it, ${username ?? 'friend'}. You said: “${message}”.`;

  const previous = await readChatMessages(postId);
  const next: SavedChatMessage[] = [
    ...previous,
    { sender: 'you', text: message },
    { sender: 'kurbot', text: reply },
  ];
  await writeChatMessages(postId, next);

  return c.json<ChatResponse>({ reply }, 200);
});