# Contributing

This is currently a solo-developer project, but commits should still be clear enough for a reviewer, recruiter, or future maintainer to understand the purpose of each change.

## Conventional Commits

Use this format:

```text
type: short description
```

Use the imperative mood, keep the subject concise, and make one logical change per commit.

Allowed types:

- `feat`: Adds a user-facing feature or capability.
- `fix`: Fixes a bug or incorrect behavior.
- `docs`: Updates documentation only.
- `refactor`: Improves code structure without changing behavior.
- `chore`: Updates tooling, configuration, dependencies, or maintenance tasks.
- `test`: Adds or updates tests.
- `style`: Changes formatting or visual/code style without changing logic.

## Project-Specific Examples

```text
feat: add Redis-backed chat history for each Reddit post
```

```text
fix: handle missing Gemini API key with a server error response
```

```text
docs: document Devvit secret setup for geminiApiKey
```

```text
refactor: extract chat response parsing into shared helpers
```

```text
chore: add Gemini fetch domain to Devvit HTTP permissions
```

```text
test: cover saved chat message validation
```

```text
style: polish expanded chat view spacing and message bubbles
```

## Before Committing

Run the quality checks when the change touches application code:

```bash
npm run type-check
npm run lint
```

Automated tests are not configured yet. When tests are added, restore a test script and include it in the normal pre-commit check.
