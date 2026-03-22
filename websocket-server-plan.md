# CollabTime WebSocket Relay Server — Implementation Plan

## Context

CollabTime currently works as a fully client-side tool: a user picks a time, shares a deep link (`?t=unixSeconds`), and others open it to see the time in their own timezone. There is zero networking code.

`collab-time-coordination.md` describes the next step: multiple people need to negotiate a time collaboratively — Person A suggests Time X, Person B can accept or counter-propose Time Y, and when all participants accept, the time is confirmed. This requires real-time server-mediated communication.

The approach is a **WebSocket relay server** inspired by Jackbox's Ecast v2 model: a central server allocates rooms with short codes, all participants connect to it via WebSocket, and the server broadcasts state changes to the room. No peer-to-peer, no auth, no database — just ephemeral in-memory rooms.

---

## Repository Layout (after all phases)

```
CollabTime/
├── main/                  # Existing frontend (React + Vite)
│   └── src/
│       ├── hooks/
│       │   └── useRoom.ts          # NEW: WS connection + room state
│       ├── components/
│       │   ├── RoomCreate.tsx      # NEW
│       │   ├── RoomJoin.tsx        # NEW
│       │   └── RoomLobby.tsx       # NEW: participant list + propose/accept UI
│       └── ...
├── server/                # NEW: Node.js WebSocket relay
│   └── src/
│       ├── server.ts      # HTTP upgrade + WS server entry
│       ├── rooms.ts       # In-memory room store
│       ├── handlers.ts    # Message dispatch
│       └── codegen.ts     # 4-char room code generation
└── shared/                # NEW: Shared TypeScript types
    └── protocol.ts        # Message types used by both client and server
```

---

## Protocol (Ecast v2-inspired)

All messages are JSON over WebSocket:

```ts
{ seq: number, type: MessageType, payload: object }
```

### Client → Server

| type | payload | description |
|---|---|---|
| `join` | `{ roomCode, displayName }` | Join a room with a display name |
| `propose_time` | `{ timestampMs }` | Suggest a Unix timestamp |
| `accept_time` | `{ timestampMs }` | Accept the currently proposed time |
| `reject_time` | `{}` | Reject — clear your acceptance |

### Server → Client

| type | payload | description |
|---|---|---|
| `room_state` | `{ participants, proposedTimestamp, acceptances }` | Full snapshot on join |
| `participant_joined` | `{ participantId, displayName }` | Someone joined |
| `participant_left` | `{ participantId }` | Someone disconnected |
| `time_proposed` | `{ proposedBy, timestampMs }` | New time on the table |
| `acceptance_updated` | `{ acceptances: string[] }` | Who has accepted so far |
| `time_confirmed` | `{ timestampMs }` | All participants accepted — done |
| `error` | `{ code, message }` | Room not found, invalid message, etc. |

---

## Phase 1 — Core Server + Room Management

**Goal**: Server allocates rooms; clients can connect and see each other.

### Server (`server/`)

- `package.json` — Node.js project, deps: `ws`, `typescript`, `tsx`, `vitest`
- `shared/protocol.ts` — TypeScript types for all messages
- `server/src/codegen.ts` — generates 4-char uppercase room codes, collision-safe
- `server/src/rooms.ts` — `RoomStore`: `Map<code, Room>` with `createRoom()`, `getRoom()`, `addParticipant()`, `removeParticipant()`
- `server/src/handlers.ts` — processes `join`; validates room code; sends `room_state` to joiner; broadcasts `participant_joined` to others
- `server/src/server.ts` — `http.createServer` + `ws.WebSocketServer` on upgrade; dispatches to handlers; on close broadcasts `participant_left`

**Room creation**: `POST /rooms` → HTTP endpoint returns `{ code }`. First participant then connects via WS using that code.

### Tests (TDD — failing test first)

- `rooms.test.ts` — RoomStore CRUD, code uniqueness
- `handlers.test.ts` — join flow, duplicate name handling, room-not-found error
- `server.test.ts` — integration: HTTP room creation + WS join, participant list, disconnect broadcast

### Client (`main/src/`)

- `src/hooks/useRoom.ts` — manages `WebSocket` lifecycle; exposes room state (`participants`, `proposedTimestamp`, `acceptances`, `confirmedTimestamp`)
- `src/hooks/useRoom.test.ts` — mock WS, test state transitions

**Verification**: `POST /rooms` returns a code; two browser tabs connect and both see each other in participant list.

---

## Phase 2 — Time Proposal & Acceptance

**Goal**: Participants propose a time, others accept or reject, confirmation fires when unanimous.

### Server additions (`handlers.ts`)

- `propose_time`: validates timestamp, updates `room.proposedTimestamp`, clears all acceptances, broadcasts `time_proposed`; proposer's acceptance is implicit
- `accept_time`: records acceptance, broadcasts `acceptance_updated`; if all participants accepted → broadcasts `time_confirmed`
- `reject_time`: clears acceptance state, broadcasts `acceptance_updated`

**Business rules**:
- One proposed time at a time — new proposal replaces old and resets all acceptances
- Proposer implicitly accepts their own proposal
- Client cannot accept a timestamp different from the current proposal

### Tests (TDD)

- `handlers.test.ts` additions — propose/accept/reject flows, consensus detection, re-proposal resets acceptances

### Client additions (`useRoom.ts`)

- Expose `proposeTime(timestampMs)`, `acceptTime()`, `rejectTime()` actions
- Derive `myAcceptance` from `acceptances` + local `participantId`

**Verification**: Two tabs — tab A proposes a time, tab B sees it; tab B accepts, `time_confirmed` fires on both.

---

## Phase 3 — Frontend UI Integration

**Goal**: Users can create/join rooms and collaborate through the existing UI.

### New components

- `RoomCreate.tsx` — "Start a collab room" button → calls `POST /rooms`, displays code + shareable link (`?t=...&room=ABCD`), connects via `useRoom`
- `RoomJoin.tsx` — text input for room code + display name → connects via `useRoom`
- `RoomLobby.tsx`:
  - Participant list with acceptance status per person
  - Current proposed time (formatted in viewer's own timezone via existing `formatTime` utils)
  - "Suggest this time" button — wires current `timestamp` → `proposeTime()`
  - "Accept" / "Counter-propose" actions on the proposed time
  - Confirmed time display when consensus is reached

### `App.tsx` changes

- Add a "Collaborate" mode toggle at the top level
- Pass `timestamp` and `setTimestamp` to `RoomLobby` so the time picker and room stay in sync
- When `time_confirmed` fires, set `timestamp` to the confirmed value

### Tests (TDD)

- `RoomCreate.test.tsx`, `RoomJoin.test.tsx`, `RoomLobby.test.tsx` — mock `useRoom`, test all render states

### Accessibility

- Update ARIA roles and labels on all new interactive elements
- Add `a11y.test.tsx` coverage for room UI

**Verification**: Full end-to-end flow — create room, share link, second person joins, propose/accept cycle, confirmed time shown.

---

## Phase 4 — Resilience & Polish

**Goal**: Handle real-world network flakiness.

### Server additions

- Room TTL: rooms expire after 2 hours of inactivity; periodic cleanup job
- Participant reconnect grace period: hold slot for 30 seconds after WS closes before broadcasting `participant_left` (survives page refresh)
- Reconnect token: server issues an opaque `participantId` on join; client stores in `sessionStorage`; on reconnect client sends it to reclaim slot

### Client additions (`useRoom.ts`)

- Exponential backoff reconnection (max 30s interval)
- `connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'failed'`
- Persist `participantId` + `roomCode` to `sessionStorage` for page refresh survival

### UI additions

- Connection status indicator in `RoomLobby`
- "Reconnecting…" state while WS is down
- Room expiry notice

**Tests**: Reconnect flow with mock WS, TTL expiry unit tests on server.

---

## Phase 5 — Deployment

**Goal**: Accessible from any device over the internet.

- `server/Dockerfile` — Node 22 Alpine, `tsx` for TS execution, exposes port 8080
- `docker-compose.yml` in repo root — frontend (Vite) + server for local dev
- Environment variables:
  - Client: `VITE_WS_URL` (defaults to `ws://localhost:8080` in dev)
  - Server: `PORT`, `ROOM_TTL_MS`, `CORS_ORIGIN`
- Deployment target: Railway or Fly.io (both support WebSockets, free tier available)

**Verification**: Two people on different devices complete the full propose/accept flow against the production server.

---

## Critical Files

| File | Action |
|---|---|
| `shared/protocol.ts` | CREATE — shared message types |
| `server/src/codegen.ts` | CREATE |
| `server/src/rooms.ts` | CREATE |
| `server/src/handlers.ts` | CREATE |
| `server/src/server.ts` | CREATE |
| `server/package.json` | CREATE |
| `main/src/hooks/useRoom.ts` | CREATE |
| `main/src/components/RoomCreate.tsx` | CREATE |
| `main/src/components/RoomJoin.tsx` | CREATE |
| `main/src/components/RoomLobby.tsx` | CREATE |
| `main/src/App.tsx` | MODIFY — add collaborate mode |
| `main/src/a11y.test.tsx` | MODIFY — add room UI coverage |

## Reuse from Existing Code

| Utility | Location | Usage |
|---|---|---|
| `encodeDeepLink` / `decodeDeepLink` | `src/utils/deepLink.ts` | Room share link encodes both `?t=` and `&room=ABCD` |
| `formatInTimezone` | `src/utils/formatTime.ts` | Display proposed time in each participant's timezone |
| `useTimezone` | `src/hooks/useTimezone.ts` | Room lobby reads local timezone for display |
| `parseTime` | `src/utils/parseTime.ts` | Unchanged — time entry flow unaffected |
