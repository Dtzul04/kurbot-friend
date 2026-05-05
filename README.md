# Kurbot Friend

Kurbot Friend is a Reddit Devvit web app that gives users an AI-powered chat companion inside a Reddit post, solving the problem of turning a static Reddit experience into an interactive, persistent conversation.

## Live Demo

PLACEHOLDER

[ACTION NEEDED: Replace this with the Reddit Devvit playtest, app, or launch URL once the project is deployed.]

## Tech Stack

- **React 19**: Chosen to build the interactive chat UI with component-based state management and a modern frontend workflow.
- **TypeScript**: Chosen to make client/server data contracts safer, especially for chat requests, responses, and saved message history.
- **Tailwind CSS 4**: Chosen for fast, consistent UI styling without creating a large custom CSS layer.
- **Vite**: Chosen because it gives the Devvit web frontend a fast build pipeline and clean development experience.
- **Devvit Web**: Chosen because the product is designed to run natively inside Reddit as an inline and expanded post experience.
- **Hono**: Chosen as a lightweight backend routing layer for Devvit server endpoints such as chat, history, and utility API routes.
- **Redis via Devvit**: Chosen to persist per-post chat history and provide recent-message context back to the AI.
- **Google Gemini API**: Chosen to generate AI chat responses from the server using a Devvit globally allow-listed domain without exposing API keys to the browser.

## Architecture Overview

Kurbot Friend uses two Devvit frontend entrypoints: an inline splash view for the Reddit feed and an expanded chat view for the main experience. The React client sends requests to Hono routes running in Devvit's server environment, where the backend reads Reddit context, sends recent Redis-backed chat history to Gemini for context, and saves new messages back to Redis. Shared TypeScript types keep the frontend request/response shapes aligned with the backend.

## Local Setup

1. Clone the repository:

```bash
git clone https://github.com/Dtzul04/kurbot-friend.git
```

2. Install dependencies:

```bash
npm install
```

3. Log in to Devvit:

```bash
npm run login
```

4. Run the Devvit playtest once so Devvit registers the app settings from `devvit.json`:

```bash
npm run dev
```

5. Configure the Gemini API key as a Devvit secret:

```bash
npx devvit settings set geminiApiKey
```

6. Restart playtest after setting the secret:

```bash
npm run dev
```

7. Optional quality checks:

```bash
npm run type-check
npm run lint
```

The app fetches Gemini through `generativelanguage.googleapis.com`, which appears on Devvit's global fetch allowlist.

## Known Limitations / What I Would Improve With More Time

- Chat history is stored per Reddit post in Redis with bounded retention, but there is not yet a user-level long-term memory model.
- The AI integration currently depends on a single Gemini model ID (`gemini-2.5-flash-lite`), so I would add model configuration, fallback handling, and better observability around quota or provider failures.
- The UI is functional, but I would improve loading states, accessibility review, mobile polish, and empty/error states before a production launch.
- The app does not have an automated test suite yet; I would add focused tests for chat parsing, API error handling, Redis persistence, and frontend request states.
