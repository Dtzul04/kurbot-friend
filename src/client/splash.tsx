import './index.css';

import { navigateTo } from '@devvit/web/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Hey {context.username ?? 'there'} 👋
        </h1>
        <p className="mx-auto max-w-xs text-base font-medium leading-snug text-zinc-700 dark:text-zinc-200">
          Speak to Kurbot — unlock possibilities.
        </p>
        <button
          type="button"
          className="flex min-h-[2.75rem] items-center justify-center rounded-full bg-[#d93900] px-8 text-base font-semibold text-white shadow-lg transition hover:bg-[#c23300] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-orange-600 dark:hover:bg-orange-500"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Speak to Kurbot
        </button>
      </div>

      <footer className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 text-[0.8em] text-zinc-500 dark:text-zinc-400">
        <button
          type="button"
          className="cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <button
          type="button"
          className="cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        >
          r/Devvit
        </button>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <button
          type="button"
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
    <Splash />
  </StrictMode>
);
