# Kurbot Friend

Kurbot Friend is a fun Devvit chat app for Reddit built around quick, playful conversations with a coding buddy twist. The goal is to make users smile, feel encouraged, and get unstuck fast.

## Status

WIP — shaping the chat experience and personality-first MVP.

## Tech Stack

- Framework: [Devvit Web](https://developers.reddit.com/)
- Frontend: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Vite](https://vite.dev/)
- Backend: [Hono](https://hono.dev/), Node.js v22 serverless runtime
- API Layer: [tRPC](https://trpc.io/)
- Language: [TypeScript](https://www.typescriptlang.org/)

## Core Direction

- A chat-first UI that feels playful and low-pressure
- Quick prompts like “I’m stuck” or “Hype me up”
- AI-powered replies later for more personality and interaction
- Light progress or streak tracking using Reddit storage (Redis)

## Getting Started

> Requires Node.js v22+

1. Install dependencies:

```bash
npm install
```

2. Start local development:

```bash
npm run dev
```

## Commands

- `npm run dev` — Start local development server
- `npm run build` — Build client and server
- `npm run deploy` — Upload a new app version
- `npm run launch` — Publish app for review
- `npm run login` — Log the Devvit CLI into Reddit
- `npm run type-check` — Run type checks, linting, and formatting checks

## Notes

- This repository does not include secrets.
- API keys for future LLM integration should be stored in environment configuration and never committed.
