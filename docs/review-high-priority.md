# PR Review: High Priority

These are not blockers but should be fixed before or shortly after release. Each item is discrete.

---

## H1 — Clipboard `.writeText()` has no `.catch()`

**Files:** `src/components/party/PartyCreateOverlay.tsx:20,27`, `src/components/ShareLink.tsx`, `src/components/DiscordExport.tsx`

`navigator.clipboard.writeText()` is called without a `.catch()` in all three places. On non-HTTPS origins or when the user denies clipboard permission, the promise rejects silently — the "Copied!" state is never set and the user gets no feedback.

```ts
// Current
navigator.clipboard.writeText(roomCode).then(() => {
  setCodeCopied(true)
  setTimeout(() => setCodeCopied(false), 2000)
})

// Fix
navigator.clipboard.writeText(roomCode).then(() => {
  setCodeCopied(true)
  setTimeout(() => setCodeCopied(false), 2000)
}).catch(() => {
  // optionally: show a fallback (e.g. select the text for manual copy)
  console.warn('[PartyCreateOverlay] clipboard write failed')
})
```

---

## H2 — Raw server error codes shown directly to users

**File:** `src/components/party/PartyRoom.tsx:117`

Non-terminal errors like `ROOM_NOT_ACTIVE`, `RATE_LIMITED`, and `INVALID_PROPOSAL` are displayed as-is: `Error: {room.errorCode}`. These are internal server codes, not user-facing copy.

**Fix:** Add a mapping from `ServerErrorCode` to human-readable strings, similar to how `ConnectionStatus` maps phase strings to labels.

```tsx
const ERROR_LABELS: Partial<Record<ServerErrorCode, string>> = {
  ROOM_NOT_ACTIVE: 'The room is not accepting proposals yet.',
  RATE_LIMITED: 'Too many requests — please wait a moment.',
  INVALID_PROPOSAL: 'That time couldn\'t be submitted.',
}

// In render:
{room.errorCode && (
  <p className="text-sm text-red-400">
    {ERROR_LABELS[room.errorCode] ?? 'Something went wrong.'}
  </p>
)}
```

---

## H3 — No loading indicator during `connecting` / `joining` phases

**File:** `src/components/party/PartyRoom.tsx:164-178`

When `connectionPhase` is `connecting` or `joining`, the UI shows only a plain centered text label ("Connecting..." / "Joining..."). Users on slow networks see no visual movement and may think the app has hung.

**Fix:** Add a spinner or animated indicator alongside the text. A simple CSS animation works; just ensure it has a `prefers-reduced-motion` guard (see `index.css` for the existing animation pattern).

---

## H4 — `ROOM_CODE_RE` duplicated and missing from URL param decoders

**Files:** `src/components/party/PartyJoinOverlay.tsx:4`, `src/components/party/PartyDeadRoom.tsx:3`, `src/utils/partyLink.ts:64-80`

The same regex `/^[a-z]+-[a-z]+-[a-z]+$/` is defined twice in two component files. It's also absent from `partyLink.ts`, meaning room codes from `?code=` and `?locked-in=` URL params are never validated — only user-typed codes go through the regex.

**Fix:**
1. Export `ROOM_CODE_RE` from `src/utils/partyLink.ts`
2. Import and reuse it in both components
3. Apply it in `decodePartyCode()` and `decodeLockedInParams()` — return `null` for codes that don't match

---

## H5 — Grace period countdown is cosmetic; reconnect runs indefinitely

**File:** `src/hooks/useRoom.ts:336-339`

`reconnectSecondsRemaining` counts down to 0 in the UI, but there is no timer that fires when it reaches 0. The WebSocket reconnect attempt runs indefinitely. The "30 seconds" shown to users is not a real guarantee.

**Fix:** Decide on the intended behavior:
- If reconnect should time out: add a `setTimeout` for `RECONNECT_GRACE_PERIOD_MS` that closes the socket and sets `connection_failed` if still in `reconnecting` phase
- If reconnect is meant to be indefinite: remove the countdown from the UI (it's misleading) and show a static "Reconnecting..." message instead
- Extract `30` to a named constant `RECONNECT_GRACE_PERIOD_S` either way

---

## H6 — `ConnectionStatus` accepts `phase: string` instead of `ConnectionPhase`

**File:** `src/components/party/PartyRoom.tsx:164`

```tsx
function ConnectionStatus({ phase }: { phase: string }) {
  const labels: Record<string, string> = { ... }
  return <p ...>{labels[phase] ?? phase}</p>
}
```

The `ConnectionPhase` discriminated union is already defined in `useRoom.ts`. Using `string` here defeats exhaustiveness checking — adding a new phase without a corresponding label silently falls back to displaying the raw phase string.

**Fix:**

```tsx
import type { ConnectionPhase } from '../../hooks/useRoom'

function ConnectionStatus({ phase }: { phase: ConnectionPhase }) {
  const labels: Record<ConnectionPhase, string> = {
    idle: 'Idle',
    connecting: 'Connecting...',
    joining: 'Joining...',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
    connection_failed: 'Connection failed',
    expired: 'Room expired',
  }
  return <p className="text-sm text-gray-400" aria-live="polite">{labels[phase]}</p>
}
```

TypeScript will now error if a new phase is added without a label.

---

## H7 — `VITE_WS_URL ?? ''` passes empty string to WebSocket constructor

**File:** `src/hooks/useRoom.ts:164`

If `VITE_WS_URL` is not set at build time, `new WebSocket('')` throws a `SyntaxError`. The error is caught by `ws.onerror`, setting `connectionPhase` to `connection_failed` — but with no indication that the cause is a missing env var. Makes deployment misconfiguration very hard to debug.

**Fix:**

```ts
const wsUrl = import.meta.env.VITE_WS_URL
if (!wsUrl) {
  console.error('[useRoom] VITE_WS_URL is not set — cannot connect')
  setState((s) => ({ ...s, connectionPhase: 'connection_failed' }))
  return
}
thisSocket.connect(wsUrl)
```
