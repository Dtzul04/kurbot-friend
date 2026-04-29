# Kurbot Friend

Kurbot Friend is a [Devvit Web](https://developers.reddit.com/) app for Reddit: a supportive, chat-style companion in the expanded post view, with a lightweight splash for the feed.

## What it does

- **Inline (`splash.html`)** — entry to open the full experience.
- **Expanded (`game.html`)** — chat UI; messages go to **`POST /api/chat`** and replies are generated with **Groq** (OpenAI-compatible chat completions) on the **server only**.
- **History** — **`GET /api/chat/history`** loads prior messages for the current post from **Redis** (`chat:${postId}`).

## Stack

- Frontend: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Vite](https://vite.dev/)
- Backend: [Hono](https://hono.dev/) on the Devvit serverless runtime (`src/server`)
- AI: [Groq API](https://console.groq.com/docs/api-reference) (`https://api.groq.com/openai/v1/chat/completions`); model ID is set in `src/server/routes/api.ts` (e.g. `llama-3.3-70b-versatile`—change if Groq deprecates it)
- Shared types: `src/shared` (e.g. chat request/response shapes)
- Persistence: Redis via `@devvit/web/server`

## AI and secrets

Global app settings are defined in **`devvit.json`** under `settings.global`. The Groq key is a **secret** (`groqApiKey`).

After a successful playtest install, set the value (never commit keys):

```bash
npx devvit settings set groqApiKey
```

See [Settings and Secrets](https://developers.reddit.com/docs/capabilities/server/settings-and-secrets).

## Fetch domains (HTTP)

Server `fetch()` is restricted to [allow-listed hosts](https://developers.reddit.com/docs/capabilities/server/http-fetch). This app requests **`api.groq.com`** so the server can call Groq’s chat API.

**Reddit** reviews domain requests when you playtest or upload. **`devvit.json` lists `api.groq.com`**, but outbound calls stay blocked until that hostname is **approved** for your app. Check **Developer Settings** → HTTP fetch domains for your app (`https://developers.reddit.com/apps/kurbot-friend/developer-settings`).

If logs show `HTTP request to domain: api.groq.com is not allowed`, approval is still missing or denied. See [HTTP fetch policy](https://developers.reddit.com/docs/capabilities/server/http-fetch-policy).

## Getting started

Use **Node.js 22.12+** so Vite’s engine check is satisfied (22.11 may warn).

1. Install dependencies:

```bash
npm install
```

2. Log in once:

```bash
npm run login
```

3. Run playtest (builds and installs on your Devvit test subreddit):

```bash
npm run dev
```

Open the playtest URL the CLI prints. **`git push` only updates GitHub** — it does not install the app on Reddit. Use upload/publish when you are ready for a wider rollout.

## Commands

- `npm run dev` — Devvit playtest (watch + test subreddit install)
- `npm run build` — Build client and server to `dist/`
- `npm run deploy` — Type-check, lint, test, then `devvit upload`
- `npm run launch` — Deploy then `devvit publish`
- `npm run login` — `devvit login`
- `npm run type-check` — `tsc --build`
- `npm run lint` — ESLint on `src/**/*.{ts,tsx}`
- `npm run test` — Vitest

## Notes

- Do not put API keys in client code or in the repo. Use Devvit secrets and read them server-side with `settings` from `@devvit/web/server`.
