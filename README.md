# Kurbot Friend

Kurbot Friend is a Devvit Web app for Reddit: a playful, chat-style “coding buddy” meant to feel encouraging and low-pressure.

## Status

WIP — chat-first MVP; server-backed replies (e.g. LLM) planned later.

## Tech Stack

- Framework: [Devvit Web](https://developers.reddit.com/)
- Frontend: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Vite](https://vite.dev/)
- Backend: [Hono](https://hono.dev/) on the Node.js v22+ Devvit serverless runtime
- API: JSON routes under `/api` (client uses `fetch`); shared request/response types in `src/shared`
- Persistence / platform: [Redis](https://redis.io/) and Reddit APIs via `@devvit/web/server` where needed
- Language: [TypeScript](https://www.typescriptlang.org/)
## Direction

- Chat-first expanded view; optional splash → expanded flow
- Placeholder assistant copy now; AI-powered replies later (keys and model calls **server-side only**)
- Light state (e.g. streaks) can use Redis when you add it

## Getting Started

> Use **Node.js v22.12+** (or the current LTS range Devvit documents), so Vite’s engine check is satisfied.

1. Install dependencies:

```bash
npm install
```

2. Log in once:

```bash
npm run login
```

3. Run **playtest** (builds your project and installs it on your Devvit **test subreddit** so you can try the app on Reddit while you code):

```bash
npm run dev
```

Open the playtest URL the CLI prints (or your `*_dev` subreddit with the `?playtest=…` query param if docs say to). **`git push` only updates GitHub** — it does not update Reddit. Publishing to a wider audience is a separate **upload / publish** step when you are ready.

## Commands

- `npm run dev` — Devvit playtest (watch + install on test subreddit)
- `npm run build` — Build client and server to `dist/`
- `npm run deploy` — Type-check, lint, test, then `devvit upload`
- `npm run launch` — Deploy then `devvit publish` (store / review flow)
- `npm run login` — `devvit login` (Reddit account for CLI)
- `npm run type-check` — `tsc --build` (TypeScript project references)
- `npm run lint` — ESLint on `src/**/*.{ts,tsx}`
- `npm run test` — Vitest

## Notes

- No secrets in the repo.
- When you add an LLM, keep API keys in Devvit/server configuration, not in client code.
