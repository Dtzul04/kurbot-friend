import './index.css';

import type { ChangeEvent, FormEvent } from 'react';
import type { ChatHistoryResponse, ChatRequest, ChatResponse } from '../shared/chat';
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

export const ChatBubble = ({ chatMessage }: ChatBubbleProps) => {
  const isUser = chatMessage.sender === 'you';

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-orange-100 dark:bg-orange-900/40 px-4 py-3 text-sm text-gray-900 dark:text-gray-100'
            : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
        }
      >
        <p
          className={
            isUser
              ? 'text-xs font-semibold mb-1 opacity-70'
              : 'text-xs font-semibold mb-1 text-orange-600 dark:text-orange-400'
          }
        >
          {isUser ? 'You' : 'Kurbot'}
        </p>
        <p>{chatMessage.text}</p>
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

  useEffect(() => {
    const element = chatContainerRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages]);

  const [draft, setDraft] = useState<string>('');
  const nextMessageId = useRef<number>(2);
  const isSendDisabled = draft.trim().length === 0;
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);

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
    try  {
      const payload: ChatRequest = { message: trimmedDraft};
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      addMessages([createKurbotReply(getNextMessageId(), data.reply)]);
    } catch {
      addMessages ([
        createKurbotReply(getNextMessageId(), 'Sorry - something went wrong.'),
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-white dark:bg-gray-900 px-4 py-8">
    
      <div className="flex flex-col items-center gap-2 max-w-[560px]">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
          Kurbot Friend
        </h1>
        <p className="text-base text-center text-gray-600 dark:text-gray-300">
          Your chaotic-good coding buddy with a tiny twist.
        </p>
      </div>

      <div ref={chatContainerRef} className="max-h-[360px] overflow-y-auto w-full max-w-[560px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3 shadow-sm">
        {messages.map((chatMessage) => (
          <ChatBubble key={chatMessage.id} chatMessage={chatMessage} />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold mb-1 text-orange-600 dark:text-orange-400">
                Kurbot 
              </p> 
              <p>Kurbot is typing...</p>
            </div>
          </div>
        )}
      </div>

      <form
        className="w-full max-w-[560px] flex gap-2"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void sendDraft();
        }}
      >
        <input
          className="flex-1 h-10 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-gray-100"
          placeholder="Type your response..."
          value={draft}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setDraft(event.target.value)
          }
        />
        <button
          type="submit"
          disabled={isSendDisabled}
          className={
            isSendDisabled
              ? 'h-10 rounded-full px-4 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-[#d93900] dark:bg-orange-600 text-white h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700'
          }
        >
          Send
        </button>
      </form>

      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-[0.8em] text-gray-600 dark:text-gray-400">
        <button
          className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
          onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        >
          r/Devvit
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
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
