import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';

type VibeMode = 'deep-work' | 'creative-flow' | 'technical-audit';

const VIBE_RESPONSES: Record<VibeMode, string> = {
  'deep-work':
    'Deep Work mode activated. Silence notifications, pick one target, and sprint for 25 focused minutes.',
  'creative-flow':
    'Creative Flow mode activated. Start messy, ship a rough draft, then improve it in one clean pass.',
  'technical-audit':
    'Technical Audit mode activated. Verify assumptions, check edge cases, and document one clear next action.',
};

export const App = () => {
  const [selectedMode, setSelectedMode] = useState<VibeMode>('deep-work');

  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-white dark:bg-gray-900">
      <img
        className="object-contain w-1/2 max-w-[250px] mx-auto"
        src="/snoo.png"
        alt="Snoo"
      />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
          Kurbot Friend
        </h1>
        <p className="text-base text-center text-gray-600 dark:text-gray-300">
          Edit{' '}
          <span className="bg-[#e5ebee] dark:bg-gray-700 px-1 py-0.5 rounded">
            src/client/game.tsx
          </span>{' '}
          to keep building your dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
        <button
          className="flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700"
          onClick={() => setSelectedMode('deep-work')}
        >
          Deep Work
        </button>
        <button
          className="flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700"
          onClick={() => setSelectedMode('creative-flow')}
        >
          Creative Flow
        </button>
        <button
          className="flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700"
          onClick={() => setSelectedMode('technical-audit')}
        >
          Technical Audit
        </button>
      </div>
      <div className="w-[90%] max-w-[560px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kurbot response</p>
        <p className="text-base text-gray-900 dark:text-gray-100">
          {VIBE_RESPONSES[selectedMode]}
        </p>
      </div>
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
