# LiveSalesAIPresenter

Demo-friendly local MVP for a slide-aware, voice-only AI sales presenter.

## What this repo does
- Upload a PDF deck
- Turn it into slide images + extracted content
- Create a public presentation session
- Serve a Next.js presentation surface backed by FastAPI session state
- Run a browser/Pipecat/OpenAI Realtime voice path when `OPENAI_API_KEY` is present
- Fall back to browser speech recognition + grounded backend answers when Realtime credentials are missing
- Keep slide navigation, transcript, and Q&A grounded in the FastAPI session state

## Preferred run path: Docker

This repo should be run through Docker Compose by default.

### First time only
```bash
cp .env.example .env
npm run setup
```

Notes:
- `.env` is local-only and must never be committed or pushed
- `setup` prefers `python3.13` automatically when available, which avoids current `pydantic-core` build issues on Python 3.14

### Start the stack
```bash
npm run docker:up
```

### Stop the stack
```bash
npm run docker:down
```

Canonical local endpoints:
- Web app: `http://localhost:3012`
- API: `http://localhost:8025`
- Pipecat voice service: `http://localhost:8110`

Use the Docker stack as the source of truth for routine development, validation, and demos.

## Secondary local path: host dev launcher

Use this only when intentionally debugging outside Docker or when working on a very targeted inner loop.

```bash
npm run dev
```

That starts the API, Pipecat voice service, and web app together on host processes. If a preferred port is busy, the dev launcher automatically selects the next free port and prints the exact URLs to use for that run. Treat those printed URLs as canonical.

## 2-minute operator flow
1. Start the stack with `npm run dev` or `npm run docker:up`.
2. Open the web URL printed by `npm run dev`, or `http://localhost:3012` for Docker.
3. Either click **Use default attached deck** or upload a PDF on the home page.
4. Wait for preprocessing to finish and skim the slide preview.
5. Click **Create live demo session**.
6. Open the generated presentation link.
7. In that tab, click **Start** and run the deck with the transport controls.
8. Use the Q&A box or voice controls to simulate audience objections or follow-up questions.

## Project layout
- `apps/web`: Next.js operator and presentation UI
- `apps/api`: FastAPI backend for deck ingestion, sessions, grounding, transcript, and slide assets
- `apps/pipecat`: voice orchestrator for Pipecat/OpenAI Realtime, `/ask`, and WebRTC transport proof
- `storage/decks`: local generated deck files

## Verification

Run this validation sequence before calling meaningful changes done.

### 1) API unit tests
```bash
npm run test:api
```

### 2) Web production build
```bash
npm run build:web
```

### 3) Voice-only proof against the real running stack
Use this focused smoke when validating the current MVP finish line. Replace the ports with the exact URLs printed by `npm run dev` if the launcher picked fallbacks:
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:13000 \
PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8025 \
PLAYWRIGHT_PIPECAT_BASE_URL=http://127.0.0.1:8110 \
npm run test:voice-proof
```

This proves the default-deck/session path, Pipecat bootstrap, transcript-driven `/ask` loop, current-slide answer, one slide-navigation tool call, one grounded deck answer, SDP answer, ICE exchange, and remote browser audio receiver.

### 4) Broader E2E against the real running stack
For the Docker path:
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 PLAYWRIGHT_REUSE_EXISTING_SERVER=1 npm run test:e2e
```

For the host `npm run dev` path, point Playwright at the exact printed web URL instead of assuming `3000`.

Important: if you run `npm run test:e2e` without `PLAYWRIGHT_BASE_URL`, Playwright may start or target a different app on port `3000`. For this repo, prefer the explicit `PLAYWRIGHT_BASE_URL=...` form when verifying against a running stack.

Note: the build script intentionally clears `apps/web/.next` first. That avoids a flaky local Next cache/runtime state that can otherwise surface as missing `vendor-chunks/next.js` or other stale server bundle errors on `/present/[token]`.

## Development process for this repo

Use this lightweight default loop:
1. Read this README first
2. Check `git status`
3. Plan the change and pick the simplest sound approach
4. Prefer Docker for running services
5. Implement cleanly, not just quickly
6. Run unit tests + build + e2e relevant to the change
7. Review diff and update docs if the workflow changed
8. Keep `.env` local and secrets out of git/GitHub

## Voice-only local proof path
- Start the host stack with `npm run dev` and use the printed URLs as canonical for that run.
- Validate backend + web first with `npm run test:api` and `npm run build:web`.
- For the fastest voice-only proof, validate the Pipecat transcript path first: create a default deck/session, bootstrap Pipecat, then POST transcript prompts to `/sessions/:id/ask` to prove grounded Q&A and slide tool calls.
- Treat real browser/Pipecat media transport as a second proof step: verify `live/create`, `live/join`, SDP answer, ICE exchange, and browser connection state.
- Do not call the voice slice complete until both the transcript loop and one real transport handshake are proven.

## Current MVP boundaries
- The active finish line is voice-only; no avatar vendor or browser avatar SDK is part of this version.
- Pipecat owns the focused proof path: `/bootstrap`, `/live/create`, `/live/join`, `/live/ice`, `/ask`, and slide/navigation tools.
- With a running host stack, `npm run test:voice-proof` validates both transcript-driven grounded Q&A/tool calls and one real browser WebRTC transport handshake.
- The browser media-path proof currently verifies SDP answer, ICE candidate exchange, and a live remote audio receiver; spoken-audio automation remains a later slice.
- With `OPENAI_API_KEY`, the broader app can create an OpenAI Realtime voice session; without credentials it falls back to browser speech recognition plus grounded backend answers.
- Best demo experience is still with relatively small PDF decks.
