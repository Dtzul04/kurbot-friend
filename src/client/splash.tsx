import './index.css';

import { navigateTo } from '@devvit/web/client';
import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
          Kurbot Friend
        </p>
        <p className="mx-auto max-w-xs text-base font-medium leading-snug text-zinc-700 dark:text-zinc-200">
          A supportive AI companion for quick thoughts, study breaks, and honest check-ins.
        </p>
        <button
          type="button"
          className="flex w-full min-h-[2.75rem] items-center justify-center rounded-full bg-[#d93900] px-8 text-base font-semibold text-white shadow-lg transition hover:bg-[#c23300] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-orange-600 dark:hover:bg-orange-500"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Start chatting
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
