# Party System — Client Implementation Plan

> **Status:** Approved — ready for phased implementation
> **Last updated:** 2026-03-23
> **Sources:** `party-system.md`, `party-system-privacy-security.md`, server `PROTOCOL.md`

---

## Confirmed Product Decisions

| Decision | Answer |
|---|---|
| Dead room UX | Generic "Room not found" for all `ROOM_NOT_FOUND` errors — no oracle leakage |
| Nickname re-roll | **Dropped from MVP** — auto-generated nickname is fixed for session |
| `?code=` deep link | Pre-fills join screen (read-only); user taps [Join Party] to connect |
| Post lock-in export | Nicknames only — no timezone info shown |
| Lock-in modal | Auto-dismisses in 2–3s; tappable/clickable to skip |
| Reconnecting UI | "Reconnecting... 24s" countdown banner + "Your slot is held" |
| Multi-tab | Each tab = separate participant; no cross-tab detection |
| Proposals board | All proposals shown in the **viewer's own timezone only** — zero TZ labels |

---

## Architecture Overview

Three layers — no router, no global state library:

```
Layer 1: src/room/             — WebSocket transport + protocol types (pure TS, no React)
Layer 2: src/hooks/            — useRoom (WS state machine), usePartyMode (view routing)
Layer 3: src/components/party/ — all party UI components
```

`App.tsx` uses an `AppMode` discriminated union for conditional rendering. `useDeepLink` is gated to `solo` mode only to avoid URL ownership conflicts.

---

## Full File Inventory

### New files

```
src/
├── room/
│   ├── roomProtocol.ts / .test.ts    # All WS message types + parseServerMessage()
│   ├── roomSession.ts / .test.ts     # sessionStorage token helpers (keyed by roomCode)
│   └── RoomSocket.ts / .test.ts      # Thin WebSocket wrapper class (no React)
├── hooks/
│   ├── useRoom.ts / .test.ts         # WS lifecycle, room state, reconnect countdown
│   ├── usePartyMode.ts / .test.ts    # AppMode view state machine + URL detection
│   └── useKeyboardInset.ts / .test.ts  # visualViewport keyboard height (mobile)
├── utils/
│   └── partyLink.ts / .test.ts      # URL encode/decode for ?code= and ?locked-in=
└── components/party/
    ├── CoordinateSection.tsx / .test.tsx      # Entry buttons in solo UI
    ├── PartyCreateOverlay.tsx / .test.tsx     # Modal: room code + copy buttons
    ├── PartyJoinOverlay.tsx / .test.tsx       # Modal: code input or pre-filled
    ├── PartyRoom.tsx / .test.tsx              # Three-column room orchestrator
    ├── ProposalsBoard.tsx / .test.tsx         # Participant list + aria-live
    ├── ParticipantRow.tsx / .test.tsx         # Single participant row (5 variants)
    ├── ConsensusMeter.tsx / .test.tsx         # "2 of 3 agree" progress bar
    ├── ProposeCtaBar.tsx / .test.tsx          # Sticky [Propose This Time] CTA
    ├── ReconnectingBanner.tsx / .test.tsx     # Top banner: "Reconnecting... 24s"
    ├── LockInModal.tsx / .test.tsx            # Full-screen celebration + confetti
    ├── PartyExportScreen.tsx / .test.tsx      # Post lock-in read-only export
    ├── PartyDeadRoom.tsx / .test.tsx          # Generic "Room not found" screen
    ├── RoomCodePill.tsx                        # Compact header code display
    └── NicknameDisplay.tsx                    # "Your nickname: Teal Fox" (static)
```

### Modified files

| File | Change |
|---|---|
| `src/App.tsx` | Add `AppMode` union, URL detection, `CoordinateSection`, gate `useDeepLink` |
| `src/hooks/useDeepLink.ts` | Add `enabled?: boolean` param; skip URL sync when false |
| `src/index.css` | Add `@keyframes` for confetti, slide-in-from-left, banner slide-down |
| `src/vite-env.d.ts` | Add `VITE_WS_URL: string` to `ImportMetaEnv` |
| `src/a11y.test.tsx` | Add axe coverage for all new party components |

---

## Phase 1 — Protocol & Transport Layer

> **Scope:** Pure TypeScript, no React. Fully testable in isolation.
> **Files:** `src/room/roomProtocol.ts`, `src/room/roomSession.ts`, `src/room/RoomSocket.ts`
> **Also:** `src/vite-env.d.ts`, `src/utils/partyLink.ts`

### 1a. `roomProtocol.ts`

All WebSocket message types as TypeScript discriminated unions.

```ts
type RoomPhase = 'waiting' | 'active' | 'locked_in'

interface Participant {
  participantToken: string   // stable public identity
  nickname: string
  isConnected: boolean       // false during 30s grace period
}

interface Proposal {
  participantToken: string
  epochMs: number
}

interface RoomSnapshot {
  code: string
  state: RoomPhase
  participants: Array<{ participantToken: string; nickname: string; isConnected: boolean; proposalEpochMs: number | null }>
  lockedInEpochMs: number | null
}

// Client → Server
type ClientMessage = JoinMessage | RejoinMessage | ProposeMessage | LeaveMessage

// Server → Client
type ServerMessage = JoinedMessage | ParticipantJoinedMessage | RoomActivatedMessage
  | RoomDeactivatedMessage | ParticipantLeftMessage | ParticipantDisconnectedMessage
  | ParticipantReconnectedMessage | ProposalUpdatedMessage | LockedInMessage
  | RoomExpiredMessage | ErrorMessage

type ServerErrorCode = 'ROOM_NOT_FOUND' | 'ROOM_NOT_ACTIVE' | 'ROOM_FULL'
  | 'RATE_LIMITED' | 'INVALID_PROPOSAL' | 'REJOIN_FAILED' | 'INVALID_TOKEN'

// Parsing (returns null for malformed JSON or missing type field)
function parseServerMessage(raw: string): ServerMessage | null
```

**Tests:** malformed JSON → null, missing type → null, all 11 message types parse correctly, unknown future type passes through.

### 1b. `roomSession.ts`

`sessionStorage` helpers, namespaced by `roomCode` to prevent stale-token collisions.

```ts
saveSessionToken(roomCode, token): void
loadSessionToken(roomCode): string | null     // returns null if not set
saveParticipantToken(roomCode, token): void
loadParticipantToken(roomCode): string | null
clearRoomSession(roomCode): void              // clears both keys for that room
```

`sessionToken` is private (32-char hex, used only for `rejoin`). `participantToken` is stored to re-identify self after reconnect.

**Tests:** save/load round trip; null when missing; key namespacing (two rooms don't conflict); `clearRoomSession` only clears the specified room.

### 1c. `RoomSocket.ts`

Thin class wrapping native `WebSocket`. Injects typed `RoomSocket` callbacks — no React, no state.

```ts
interface RoomSocketCallbacks {
  onOpen: () => void
  onMessage: (msg: ServerMessage) => void
  onClose: (event: CloseEvent) => void
  onError: () => void
}

class RoomSocket {
  connect(url: string): void   // guard: if (ws !== null) return (no double-connect)
  send(msg: ClientMessage): void
  disconnect(): void
  get isOpen(): boolean
}
```

Parses inbound frames via `parseServerMessage`. Silently drops unparseable frames.

**Tests:** mock `globalThis.WebSocket`; double-connect guard; `send` when closed is no-op; `onMessage` fires for valid JSON; `disconnect` calls `ws.close`.

### 1d. `partyLink.ts`

URL utilities for party mode. Mirrors the pattern of `src/utils/deepLink.ts`.

```ts
// URL generation
encodePartyRoomUrl(roomCode: string): string
  // → ?code=purple-falcon-bridge
encodePartyLockedUrl(roomCode: string, epochMs: number): string
  // → ?locked-in=purple-falcon-bridge&time=1711209600000

// URL parsing
decodePartyCode(search: string): string | null
decodeLockedInParams(search: string): { roomCode: string; epochMs: number } | null

// Initial mode detection (called once on App mount)
detectInitialMode(search: string): AppMode
  // ?code=…       → { kind: 'party-join-overlay', code: '…' }
  // ?locked-in=…  → { kind: 'party-locked', roomCode: '…', confirmedMs: … }
  // otherwise     → { kind: 'solo' }
```

**Tests:** encode/decode round trips; null for missing/malformed params; `detectInitialMode` for each URL pattern.

### 1e. `vite-env.d.ts` update

```ts
interface ImportMetaEnv {
  readonly VITE_WS_URL: string
}
```

---

## Phase 2 — `useRoom` Hook

> **Scope:** Core WebSocket state machine. All party UI depends on this.
> **Files:** `src/hooks/useRoom.ts`, `src/hooks/useRoom.test.ts`

### State machine

```
idle → connecting → joining → connected ⟷ reconnecting
                                    ↓
                              expired | error
```

### Internal state

```ts
{
  connectionPhase: 'idle' | 'connecting' | 'joining' | 'connected'
                 | 'reconnecting' | 'connection_failed' | 'expired'
  ownParticipantToken: string | null
  ownNickname: string | null
  roomPhase: RoomPhase | null
  participants: Participant[]
  proposals: Proposal[]           // upserted on proposal_updated
  lockedEpochMs: number | null
  gracePeriodStartedAt: number | null   // Date.now() when self-disconnected
  errorCode: ServerErrorCode | null
}
```

### Public interface

```ts
function useRoom(
  roomCode: string,
  socketFactory?: () => RoomSocket   // injectable for tests
): {
  connectionPhase, ownParticipantToken, ownNickname,
  roomPhase, participants, proposals, lockedEpochMs,
  ownProposal: Proposal | null,              // derived
  reconnectSecondsRemaining: number | null,  // derived (ticks 1/s only while reconnecting)
  errorCode,
  connect(), disconnect(), propose(epochMs)
}
```

### Key message handler behaviours

| Message | Action |
|---|---|
| WS open | Check `sessionStorage` → `rejoin` if token exists, else `join` |
| `joined` | Save tokens to `sessionStorage`; populate full room snapshot |
| `participant_disconnected` (self) | `connectionPhase = 'reconnecting'`; record `gracePeriodStartedAt`; immediately open new WS + send `rejoin` |
| `participant_disconnected` (other) | Mark `isConnected = false` — proposal stays on board |
| `participant_reconnected` | Mark `isConnected = true`; if self: clear reconnecting state |
| `proposal_updated` | Upsert by `participantToken` |
| `locked_in` | Set `roomPhase = 'locked_in'`, `lockedEpochMs`; clear `sessionStorage` |
| `room_expired` | Clear storage, close socket, `connectionPhase = 'expired'` |
| Terminal errors (`ROOM_NOT_FOUND`, `ROOM_FULL`, `REJOIN_FAILED`, `INVALID_TOKEN`) | Close socket, set `errorCode` |
| Non-terminal errors (`RATE_LIMITED`, `INVALID_PROPOSAL`) | Set `errorCode` only; stay connected |

### Reconnect countdown (derived)

```ts
reconnectSecondsRemaining =
  gracePeriodStartedAt === null ? null
  : Math.max(0, Math.ceil(30 - (nowMs - gracePeriodStartedAt) / 1000))
```

`nowMs` updates via 1s `setInterval` only while `connectionPhase === 'reconnecting'`.

### Testing approach

Inject `socketFactory` to get a `FakeRoomSocket` with `simulateMessage(msg)` — no `globalThis.WebSocket` patching.
Use `vi.useFakeTimers()` for reconnect countdown tests.

**Tests (all via `renderHook`):** initial idle state; connect/joining/connected lifecycle; join vs rejoin selection from sessionStorage; all message type handlers; self-disconnect → reconnecting countdown; countdown reaches 0; terminal vs non-terminal errors; `propose()` no-op guards; `disconnect()` sends leave + clears storage; unmount cleanup.

---

## Phase 3 — `usePartyMode` + App.tsx Integration

> **Scope:** View routing state machine + wiring into `App.tsx`.
> **Files:** `src/hooks/usePartyMode.ts`, `src/utils/partyLink.ts` (Phase 1), `src/App.tsx`, `src/hooks/useDeepLink.ts`

### `AppMode` union

```ts
type AppMode =
  | { kind: 'solo' }
  | { kind: 'party-create-overlay' }
  | { kind: 'party-join-overlay'; code: string | null }
  | { kind: 'party-room'; roomCode: string }
  | { kind: 'party-locked'; roomCode: string; confirmedMs: number }
  | { kind: 'party-dead'; attemptedCode: string }
```

### `usePartyMode()` interface

```ts
{
  appMode: AppMode,
  startParty: () => void,
  joinParty: (codeOrNull?: string | null) => void,
  enterRoom: (roomCode: string) => void,
  lockIn: (roomCode: string, confirmedMs: number) => void,
  deadRoom: (attemptedCode: string) => void,
  backToSolo: () => void,
}
```

On mount: calls `detectInitialMode(window.location.search)` to set initial `AppMode`. Manages URL sync (`?code=`, `?locked-in=`) separately from `useDeepLink`.

### `App.tsx` changes

```tsx
const initialMode = detectInitialMode(window.location.search)
const [appMode, setAppMode] = useState<AppMode>(initialMode)

// Gate useDeepLink — party mode owns the URL
useDeepLink(handleTimestamp, appMode.kind === 'solo' ? timestamp : null)

// Full-screen party modes replace all content
if (appMode.kind === 'party-room')   return <PartyRoom ... />
if (appMode.kind === 'party-locked') return <PartyExportScreen ... />
if (appMode.kind === 'party-dead')   return <PartyDeadRoom ... />

// Solo: existing layout + CoordinateSection + overlay modals
```

`useDeepLink` update: add `enabled?: boolean` (or accept `null` timestamp) to skip URL sync when inactive.

**Tests:** URL detection for each `?code=` / `?locked-in=` / plain URL pattern; all `AppMode` transitions; `useDeepLink` not called when `appMode !== 'solo'`.

---

## Phase 4 — Entry Points & Overlays

> **Scope:** The two modals and the COORDINATE section in solo UI. No WebSocket yet — these trigger `usePartyMode` transitions.
> **Files:** `CoordinateSection`, `PartyCreateOverlay`, `PartyJoinOverlay`, `NicknameDisplay`, `RoomCodePill`

### `CoordinateSection`

Added to solo UI below `ConversionDisplay`. Two full-width buttons (48px min height):
- `[👥 Start a Party]` → `bg-indigo-600`
- `[🔗 Join a Party]` → `bg-gray-800 border border-gray-700`

Passes current `timestamp` (if set) to `startParty` — becomes leader's initial proposal.

### `PartyCreateOverlay`

Centered dialog, `role="dialog"` `aria-modal="true"`, focus-trapped, `bg-black/60 backdrop-blur-sm` backdrop.

- Generated room code displayed in large monospace
- "Copy Code" + "Copy Link" buttons
- `NicknameDisplay`: "Your nickname this session: Teal Fox" (static — no re-roll button)
- Privacy notice footer: *"Nicknames and proposals exist only during the session."*
- `[Enter the Room]` CTA → calls `enterRoom(roomCode)`

### `PartyJoinOverlay`

Same dialog structure.

- Code input: `type="text"` `autocapitalize="off"` `autocorrect="off"` `spellcheck="false"` `inputMode="url"`
- Auto-hyphen logic: strip all hyphens from value → split on word boundaries → re-join with hyphens as user types
- `[Join Party]` disabled until format matches `/^[a-z]+-[a-z]+-[a-z]+$/`
- If `?code=` was in URL: input is `readOnly`, lock icon, pre-filled
- All server errors: generic "Room not found"
- Privacy notice footer

**Tests (all components):** render, button disabled/enabled states, auto-hyphen formatting, `readOnly` pre-fill, error display, focus management.

---

## Phase 5 — Proposals Board

> **Scope:** The core visual of the negotiation room. Heaviest test surface.
> **Files:** `ProposalsBoard`, `ParticipantRow`, `ConsensusMeter`

### `ProposalsBoard`

```tsx
<section
  aria-labelledby="proposals-heading"
  aria-live="polite"
  aria-atomic="false"
  aria-relevant="additions text"
>
```

Renders one `<ParticipantRow>` per participant, then `<ConsensusMeter>`.

**Waiting state** (1 participant): shows nudge "Waiting for others to join..." below own row.

### `ParticipantRow` — 5 variants

| Variant | Visual |
|---|---|
| Self | `border-l-2 border-indigo-500`; "(You) · Teal Fox"; proposal time in viewer's TZ |
| Other w/ proposal | Nickname + `formatInTimezone(epochMs, viewerTimezone)` — **no TZ label** |
| Other, no proposal | Nickname + "—" in gray-500 |
| Reconnecting | `opacity-60`; amber spinner + "Reconnecting..."; proposal still shown |
| Locked | `✓` in emerald-400 prepended to all rows |

All proposal times use `formatInTimezone(epochMs, viewerTimezone)` from `src/utils/formatTime.ts`. The viewer's timezone is applied to every row — zero foreign TZ info exposed.

### `ConsensusMeter`

```tsx
<p role="status" aria-live="polite" aria-atomic="true">
  {agreedCount} of {eligibleCount} agree
</p>
```

Thin `h-1` bar: `bg-indigo-500` → `bg-emerald-500 animate-pulse` when all agree.

**Tests:** all 5 row variants; `aria-live` region present; consensus counts and bar color; waiting-state nudge; locked-state checkmarks.

---

## Phase 6 — Negotiation Room Shell

> **Scope:** The `PartyRoom` three-column wrapper, responsive layout, header.
> **Files:** `PartyRoom`, `ProposeCtaBar`, `useKeyboardInset`

### `PartyRoom`

Instantiates `useRoom(roomCode)`. Owns: header (room code pill + timezone selector + [Leave]), three columns, `<LockInModal>` portal, `<ReconnectingBanner>`.

**Column layout (desktop `lg:`):** `flex h-[calc(100vh-4rem)]`
- Left `w-72 flex-shrink-0 overflow-y-auto`: `ProposalsBoard`
- Center `flex-1 overflow-y-auto`: `TextImport` + `ManualSelector` + `ProposeCtaBar`
- Right `w-80 flex-shrink-0 overflow-y-auto`: export panel (`pointer-events-none opacity-40` until locked)

**Mobile:** single-column scrollable; sticky `ProposeCtaBar` above keyboard.

**Leave:** sends `disconnect()` from `useRoom`; calls `backToSolo()` from `usePartyMode`.

### `ProposeCtaBar`

Fixed bottom CTA. Disabled when `timestamp === null` or `roomPhase !== 'active'`.

Mobile positioning: `style={{ bottom: keyboardInsetHeight + 'px' }}`.

### `useKeyboardInset()`

```ts
// Returns keyboard height in pixels
useKeyboardInset(): number
```

Uses `visualViewport.resize` + `visualViewport.scroll` events:
```ts
Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
```

**Tests:** `PartyRoom` renders all three columns; [Leave] calls disconnect + backToSolo; `ProposeCtaBar` disabled states; `useKeyboardInset` returns 0 when no keyboard.

---

## Phase 7 — Reconnect & Lock-In

> **Scope:** Reconnecting banner and lock-in celebration modal.
> **Files:** `ReconnectingBanner`, `LockInModal`, `src/index.css` additions

### `ReconnectingBanner`

`position: fixed top-0 left-0 right-0 z-50`. `role="alert"`. Amber background.

Text: "Reconnecting... 24s — Your slot is held."

Shown when `connectionPhase === 'reconnecting'`. `secondsRemaining` comes from `useRoom.reconnectSecondsRemaining`. Slides down on mount; slides up on dismiss. Room content shifts down via `pt-[72px]`.

### `LockInModal`

`fixed inset-0 z-[100]`. React portal. `role="alertdialog"` `aria-modal="true"`. Focus trapped.

- Confetti canvas — **entirely absent** (not hidden) when `prefers-reduced-motion: reduce`; replaced with static sparkle emoji
- Confirmed time displayed via `ConversionDisplay` (viewer's TZ)
- "All N on board" subtext
- Countdown `[3]` in corner
- Tap/click anywhere → `onDismiss()` immediately
- Auto-dismisses after 2500ms via `setTimeout`

### `index.css` additions

```css
@keyframes slide-in-from-left { from { transform: translateX(-2rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes banner-slide-down   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
```

All animations wrapped in `@media (prefers-reduced-motion: no-preference)`.

**Tests:** banner shows/hides with `connectionPhase`; countdown renders `secondsRemaining`; `role="alert"` present; modal auto-dismisses after 2500ms (`vi.useFakeTimers`); tap-to-skip fires `onDismiss`; confetti absent when `prefers-reduced-motion`.

---

## Phase 8 — Export & Dead Room Screens

> **Scope:** Post lock-in and error screens. Mostly composition of existing components.
> **Files:** `PartyExportScreen`, `PartyDeadRoom`

### `PartyExportScreen`

Post lock-in full page. Reuses existing components unchanged:
- `ConversionDisplay` — confirmed time in viewer's TZ
- `ShareLink`, `CalendarExport`, `DiscordExport` — all passed `confirmedMs` + `timezone`

Adds participants section: nicknames with `✓` checkmarks only (no TZ data per privacy decision).

CTAs: `[New Session]` → `startParty()`; `[Back to Solo Mode]` → `backToSolo()`.

### `PartyDeadRoom`

Generic screen for all `ROOM_NOT_FOUND` errors.

```
Room not found

The code "purple-falcon-bridge" didn't connect to a session.
It may have expired or the code could be incorrect.

[Try a Different Code]    ← inline expansion, no navigation
[Start a New Party]
[Go to Solo Mode]
```

"Try a Different Code" expands an inline code-entry form within the same card.

**Tests:** all three CTAs fire correct transitions; attempted code shown; inline expansion works; participants listed by nickname only on export screen.

---

## Phase 9 — Accessibility Completion

> **Scope:** `a11y.test.tsx` additions + final ARIA audit.
> **Files:** `src/a11y.test.tsx`

Add jest-axe `toHaveNoViolations()` tests for:
- `CoordinateSection` — both buttons, 44px touch targets
- `PartyJoinOverlay` — idle, error, and pre-filled states
- `PartyCreateOverlay`
- `ProposalsBoard` — 1, 2, and 3 participants; reconnecting participant row
- `LockInModal` — focus trap, `role="alertdialog"`
- `ReconnectingBanner` — `role="alert"`
- `PartyDeadRoom` — inline expansion

---

## Verification Checklist (final)

**Manual smoke test:**
1. `npm run dev` — two tabs, create party in tab 1, join via `?code=` in tab 2 → proposals board → both propose same minute → lock-in modal → export screen
2. Disconnect tab 1's network → reconnecting banner + countdown → reconnect → proposals intact
3. `?code=expired-code-xxx` → "Room not found" screen
4. Set tabs to different timezones — proposals board shows viewer's own TZ in each tab
5. Mobile devtools 375px — sticky CTA stays above keyboard on iOS Safari

**Automated:**
```
npm run test      # all new tests green, no existing regressions
npm run coverage  # no coverage regressions
npm run lint      # no new errors
npm run build     # type-check clean (VITE_WS_URL typed)
```
