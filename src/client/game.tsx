import './index.css';

import type { ChangeEvent, FormEvent } from 'react';
import type { ChatHistoryResponse, ChatRequest } from '../shared/chat';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { StrictMode, useEffect, useRef, useState } from 'react';

type ChatSender = 'you' | 'kurbot';
type ChatMessage = {
  id: number;
  sender: ChatSender;
  text: string;
};
type ChatBubbleProps = {
  chatMessage: ChatMessage;
};

const createUserMessage = (id: number, text: string): ChatMessage => {
  return {
    id,
    sender: 'you',
    text,
  };
};

const createKurbotReply = (id: number, text: string): ChatMessage => {
  return {
    id,
    sender: 'kurbot',
    text,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseApiErrorMessage = (raw: unknown): string | undefined => {
  if (!isRecord(raw)) {
    return undefined;
  }
  const message = raw['message'];
  if (typeof message !== 'string') {
    return undefined;
  }
  const trimmed = message.trim();
  return trimmed === '' ? undefined : trimmed;
};

const parseChatReply = (raw: unknown): string | undefined => {
  if (!isRecord(raw)) {
    return undefined;
  }
  const reply = raw['reply'];
  if (typeof reply !== 'string') {
    return undefined;
  }
  const trimmed = reply.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const ChatBubble = ({ chatMessage }: ChatBubbleProps) => {
  const isUser = chatMessage.sender === 'you';

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-orange-100/90 dark:bg-orange-900/45 px-4 py-3 text-[0.9375rem] leading-relaxed text-zinc-900 dark:text-zinc-100'
            : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-white dark:bg-zinc-900/90 px-4 py-3 text-[0.9375rem] leading-relaxed text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80'
        }
      >
        <p
          className={
            isUser
              ? 'text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'
              : 'text-[0.7rem] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400'
          }
        >
          {isUser ? 'You' : 'Kurbot'}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap break-words">{chatMessage.text}</p>
      </div>
    </div>
  );
};

export const App = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'kurbot',
      text: 'Hey — I am Kurbot Friend. Type anything to get started.',
    },
  ]);

  const [draft, setDraft] = useState<string>('');
  const nextMessageId = useRef<number>(2);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const isSendDisabled = draft.trim().length === 0 || isTyping;

  useEffect(() => {
    const element = chatContainerRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/chat/history');
        if (!res.ok) {
          return;
        }
        const data: ChatHistoryResponse = await res.json();
        if (data.messages.length === 0) {
          return;
        }
        const mapped: ChatMessage[] = data.messages.map((saved, index) => {
          return {
            id: index + 1,
            sender: saved.sender,
            text: saved.text,
          };
        });
        setMessages(mapped);
        nextMessageId.current = data.messages.length + 1;
      } catch {
        // Leave default welcome if history cannot be loaded
      }
    };
    void loadHistory();
  }, []);

  function getNextMessageId(): number {
    const id = nextMessageId.current;
    nextMessageId.current += 1;
    return id;
  }

  const addMessages = (newMessages: ChatMessage[]) => {
    setMessages((previousMessages) => [...previousMessages, ...newMessages]);
  };

  const sendDraft = async() =>{
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      return;
    }

    setDraft('');
    setIsTyping(true);
    addMessages([createUserMessage(getNextMessageId(), trimmedDraft)]);
    try {
      const payload: ChatRequest = { message: trimmedDraft };
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw: unknown = await res.json();
      if (!res.ok) {
        const errMsg = parseApiErrorMessage(raw);
        addMessages([
          createKurbotReply(
            getNextMessageId(),
            errMsg ?? `Something went wrong (HTTP ${res.status}).`,
          ),
        ]);
        return;
      }

      const reply = parseChatReply(raw);
      if (reply === undefined) {
        addMessages([
          createKurbotReply(
            getNextMessageId(),
            'Unexpected response from Kurbot.',
          ),
        ]);
        return;
      }

      addMessages([createKurbotReply(getNextMessageId(), reply)]);
    } catch {
      addMessages([
        createKurbotReply(
          getNextMessageId(),
          'Could not reach the server. Check your connection and try again.',
        ),
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 pb-20 pt-8 sm:pt-10">
        <header className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl mb-1">
            Kurbot Friend
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            A friend in your corner - say what's on your mind.
          </p>
        </header>

        <div
          ref={chatContainerRef}
          className="max-h-[min(64vh,26rem)] min-h-[12rem] w-full flex-1 overflow-y-auto scroll-smooth rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-md ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:ring-white/10 ring-2 ring-orange-500/20"
        >
          <div className="space-y-3">
            {messages.map((chatMessage) => (
              <ChatBubble key={chatMessage.id} chatMessage={chatMessage} />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <p className="pl-1 text-xs italic text-zinc-500 dark:text-zinc-400 animate-pulse">
                  Kurbot is typing…
                </p>
              </div>
            )}
          </div>
        </div>

        <form
          className="flex w-full gap-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void sendDraft();
          }}
        >
          <input
            className="h-11 min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm transition-shadow placeholder:text-zinc-400 focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/25 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            placeholder="Message Kurbot…"
            value={draft}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDraft(event.target.value)
            }
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={isSendDisabled}
            className={
              isSendDisabled
                ? 'h-11 shrink-0 cursor-not-allowed rounded-full bg-zinc-200 px-5 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
                : 'h-11 shrink-0 cursor-pointer rounded-full bg-[#d93900] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#c23300] focus:outline-none focus:ring-2 focus:ring-orange-500/40 dark:bg-orange-600 dark:hover:bg-orange-500 acrive:scale-95'
            }
          >
            Send
          </button>
        </form>
      </main>

      <footer className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 text-[0.8em] text-zinc-500 dark:text-zinc-400">
        <button
          className="cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <button
          className="cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        >
          r/Devvit
        </button>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <button
          className="cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => navigateTo('https://discord.com/invite/R7yu2wh9Qz')}
        >
          Discord
        </button>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
