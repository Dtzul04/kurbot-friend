# Kurbot Friend

Kurbot Friend is a Devvit web app for Reddit designed as an AI-powered vibe architect companion. It helps users navigate coding and technical-audit friction with supportive guidance and flow-state suggestions.

## Status

WIP — active development (MVP in progress).

## Tech Stack

- Framework: [Devvit Web](https://developers.reddit.com/)
- Frontend: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Vite](https://vite.dev/)
- Backend: [Hono](https://hono.dev/), Node.js v22 serverless runtime
- API Layer: [tRPC](https://trpc.io/)
- Language: [TypeScript](https://www.typescriptlang.org/)

## Planned Features

- Interactive dashboard with vibe/status display
- Action triggers for Deep Work, Creative Flow, and Technical Audit
- AI-driven responses through external LLM integration
- Focus streak persistence using Reddit storage (Redis)

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
