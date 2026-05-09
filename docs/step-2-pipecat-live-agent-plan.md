# Step 2 — Pipecat live agent session runner

## Goal
Turn the current logical Pipecat orchestration seam into the primary live-agent path:
- prompt/instructions loaded from FastAPI
- tool manifest exposed from FastAPI
- live agent session uses tool calling as the normal control path
- frontend connects to the live Pipecat-managed session state
- fake `/ask` remains only as a test/dev harness, not product architecture

## Current baseline from step 1
- `apps/pipecat/server.py` supports bootstrap/connect/disconnect.
- Pipecat session registry exists in-memory.
- FastAPI contract + instructions load correctly.
- `/ask` can already route grounded questions and simple tool-like directives via FastAPI.
- Repo validation is green:
  - `npm run test:api`
  - `npm run build:web`
  - focused Pipecat grounded-loop test passes.

## What step 2 should mean in this repo
Because this repo is still browser-transport-first, step 2 should not pretend we already have a full server-side audio/media worker.

Instead, step 2 should deliver a *real live agent contract* where:
1. Pipecat owns session bootstrap + live agent config.
2. Pipecat exposes tool-calling behavior as the intended runtime path.
3. frontend connects to Pipecat as the live orchestrator entrypoint.
4. browser/WebRTC transport can still carry the audio until a deeper worker exists.

## Detailed implementation steps

### 2.1 Define the live Pipecat session model
In `apps/pipecat/server.py` extend session state with:
- `agent_status`: `idle | bootstrapped | connected | listening | thinking | speaking | paused | disconnected`
- `transport_mode`: `browser-webrtc | browser-fallback | server-orchestrated`
- `tool_state` / last tool call metadata
- `live_session` metadata passthrough
- `frontend_contract` payload for the web app

Definition of done:
- bootstrap/connect responses expose a consistent state model the frontend can rely on

### 2.2 Normalize a live-agent bootstrap response
Unify bootstrap/connect into a shape that clearly tells the frontend:
- whether OpenAI realtime is configured
- whether browser direct transport is still being used underneath
- whether Pipecat is the orchestration authority
- what instructions/tool manifest apply
- what next action the client should take

Response should include:
- session identity
- orchestration mode
- instructions
- tool manifest
- transport details
- avatar readiness
- current slide index
- next step / status label

Definition of done:
- frontend no longer needs to infer live behavior from mixed legacy payloads

### 2.3 Add an explicit Pipecat live-agent endpoint layer
Add endpoints like:
- `POST /sessions/{session_id}/agent/start`
- `GET /sessions/{session_id}/agent/state`
- `POST /sessions/{session_id}/agent/stop`

These do not need to run full audio media server logic yet.
They should:
- mark the live agent as active
- create/update live transport metadata from FastAPI/bootstrap services
- expose instructions/tool manifest/current slide context
- serve as the primary entrypoint for web live mode

Definition of done:
- there is a clean “live agent session” contract separate from the temporary `/ask` harness

### 2.4 Make tool-calling the canonical behavior path
Refactor tool handling into explicit helpers:
- `call_get_current_slide`
- `call_search_slides`
- `call_get_slide_content`
- `call_next_slide`
- `call_prev_slide`
- `call_goto_slide`
- `call_pause`
- `call_resume`

Then expose them through:
- tool manifest returned to clients
- internal dispatch helpers used by any fake/test ask route

Definition of done:
- tool behavior is structured like a real agent tool layer, not string-matching glued into one route

### 2.5 Make frontend live mode consume the new Pipecat agent contract
Targets likely include:
- `apps/web/lib/api.ts`
- `apps/web/components/PresentationShell.tsx`
- related avatar/live controls

Changes:
- use Pipecat agent start/state endpoints as the preferred live entrypoint
- keep browser speech fallback as secondary/dev path
- display real agent states from Pipecat (`connected`, `listening`, `thinking`, etc.)
- keep transcript/slide state synchronized with backend truth

Definition of done:
- Start live voice uses Pipecat agent contract first
- UI labels reflect real orchestration state

### 2.6 Keep fake ask only for testing/dev harness
Retain `/sessions/{session_id}/ask` only to:
- simulate a transcript turn in e2e/dev
- validate tool dispatch and grounded answering without live mic/audio

Definition of done:
- route is clearly auxiliary, not the main architectural path

### 2.7 Add validation for the step-2 live contract
Add/extend tests to validate:
- bootstrap/connect/agent-start/state/stop flow
- tool manifest present in live contract
- current slide context included
- fake ask still works as harness
- frontend build stays green

Minimum validation gates:
- focused API/Pipecat tests
- `npm run test:api`
- `npm run build:web`

## Recommended execution order
1. Extend Pipecat session state model.
2. Add agent start/state/stop endpoints.
3. Refactor tool calls into explicit helpers.
4. Normalize bootstrap/connect payloads.
5. Switch frontend live startup to agent start/state contract.
6. Keep fake ask as test harness.
7. Add/adjust tests and rerun gates.

## Immediate coding target
Start in `apps/pipecat/server.py`:
- add agent start/state/stop endpoints
- normalize live state model
- extract tool-call helpers
