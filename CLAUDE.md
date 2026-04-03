# CollabTime

Timezone coordination tool. Users pick a time in their timezone; others see it in theirs.

## Stack

- React 19, TypeScript, Tailwind CSS 4
- Vite (dev server + build)
- ESLint 9 (flat config, `eslint.config.js`) with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y`
- Vitest + Testing Library (tests)
- chrono-node (natural language date parsing)

### chrono-node timezone behaviour

chrono-node maps `EST`/`CST`/`MST`/`PST` to **fixed offsets** (e.g. EST = UTC-5 always). It separately provides DST-aware region codes: `ET`, `CT`, `MT`, `PT`. To handle the common case where users write "EST" year-round meaning "Eastern time", `parseTime` normalises the four standard abbreviations to their region counterparts before parsing (`src/utils/parseTime.ts`). The region codes honour US DST transitions automatically.

## Commands

```
npm run dev           # start dev server
npm run build         # type-check + build
npm run test          # run tests (watch mode)
npm run lint          # eslint
npm run coverage      # test coverage
npm run test:e2e      # Playwright integration tests (requires dev server on localhost:5173)
npm run test:e2e:ui   # Playwright UI mode (for debugging)
```

## Linting

Config: `eslint.config.js` (ESLint 9 flat config). Run with `npm run lint`.

**Enabled rule sets:**
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` recommended
- `eslint-plugin-jsx-a11y` recommended (with `no-autofocus` disabled — `autoFocus` is intentionally used for modal focus management per WCAG)

**Intentional suppressions** (do not remove without understanding the pattern):
- `jsx-a11y/no-autofocus` — disabled globally; `autoFocus` is correct practice for moving focus into modals
- `jsx-a11y/click-events-have-key-events` + `jsx-a11y/interactive-supports-focus` on `role="option"` divs in `TimezoneSelect` — keyboard navigation uses the `aria-activedescendant` pattern on the parent input; options are not tab-focusable by design
- `jsx-a11y/no-noninteractive-element-interactions` + `jsx-a11y/click-events-have-key-events` on `LockInModal`'s `role="alertdialog"` div — the full-screen overlay is intentionally click-to-dismiss; Escape is handled separately
- `prefer-const` on `thisSocket` in `useRoom.ts` — declared before callbacks (which close over it) then assigned once; cannot be `const` without moving the assignment inline, which TypeScript would flag as a TDZ reference in closures
- `@typescript-eslint/no-this-alias` in `RoomSocket.test.ts` — test helper captures `this` to track the active mock WebSocket instance; the rule targets `const self = this` antipatterns and fires as a false positive here

**Backdrop divs** in `PartyCreateOverlay` and `PartyJoinOverlay` use `role="presentation"` to suppress jsx-a11y warnings — this is the correct semantic for a click-outside-to-dismiss overlay layer.

## Conventions

- Use `jq` instead of Python for parsing JSON in shell scripts or commands
- Use descriptive variable names that convey context; avoid short single-word names (e.g. prefer `selectedTimezone` over `tz`, `parsedTimestamp` over `ts`)
- Avoid abbreviated names for library/API objects (e.g. prefer `roomSocket`, `webSocket`, or `socket` over `ws`)

## Testing

Use red-green TDD. Write a failing test first, then implement. Tests live alongside source files (`*.test.ts` / `*.test.tsx`).

Vitest is configured with `exclude: ['**/e2e/**']` in `vite.config.ts` to prevent Playwright spec files from being picked up by the unit test runner.

### E2E tests (Playwright)

Tests live in `e2e/`. Three files:

| File | Scope |
|---|---|
| `e2e/solo-mode.spec.ts` | Page load, text import, manual selector, timezone picker, export panel, deep links |
| `e2e/party-overlays.spec.ts` | Create/join overlays — modal behaviour, validation, clipboard, focus trap |
| `e2e/party-ws.spec.ts` | Party room flows — uses `page.routeWebSocket()` to mock the server, no live WS needed |

**Prerequisites before running e2e tests:**

1. Browser binaries must be installed (one-time): `npx playwright install`
2. The dev server must be running: `npm run dev`
3. Target URL is configurable via `BASE_URL` env var (default: `http://localhost:5173/CollabTime/`)

**Clipboard tests** call `page.context().grantPermissions(['clipboard-read', 'clipboard-write'])` — this works in Chromium but is a no-op in WebKit/Firefox where the clipboard API behaves differently. Clipboard assertions are therefore most reliable on the `chromium` project.

**Party-room WS tests** intercept the WebSocket via `page.routeWebSocket(/.*/)`. The handler receives a `WebSocketRoute` object. Key API:
- `wsRoute.onMessage(handler)` — receive messages sent by the page (method call, not property assignment)
- `wsRoute.send(jsonString)` — push a server message to the page
- `wsRoute.close()` — simulate a server-side disconnect

Message payloads must be JSON strings matching the protocol types in `src/room/roomProtocol.ts`.

**React StrictMode double-invoke:** In development, React double-invokes effects, which creates two WebSocket connections per room mount — the first is cleaned up immediately, the second is the live one. Always call the `serverWs$()` getter **after** `waitForRoomConnected` (not before) to receive the active connection. The `mockServer()` helper in `party-ws.spec.ts` handles this by tracking the most recently opened socket (`latestWs`), overwriting on each new connection.

**Reconnect tests:** After `serverWs.close()`, the app immediately reconnects. To keep the "reconnecting" banner visible long enough to assert, set a `shouldRespond = false` flag before closing so the reconnect WS hangs without a response.

**Do not** add `vi.useFakeTimers()` to e2e tests — Playwright manages real browser time. Use `page.waitForTimeout()` sparingly (prefer `expect(...).toBeVisible({ timeout: N })` instead).

### Axe / accessibility tests

Never use `vi.useFakeTimers()` in the same test as `axe()` — fake timers block axe's internal async machinery, causing a 5s timeout and cascading "axe is already running" failures in all subsequent tests. Test timing behaviour in separate non-axe tests.

### Timezone parsing tests

For any test involving a timezone abbreviation in natural language input, always cover:
1. **During DST** (e.g. ref date in March) — US standard abbreviations like `EST` are colloquially used year-round
2. **During standard time** (e.g. ref date in January) — verify the offset is still correct when DST is not active
3. **Round-trip assertion** — parse `"8PM EST"` and confirm the timestamp displays back as `8PM` in the relevant IANA timezone (not just check UTC). This catches off-by-one-hour bugs that pass UTC checks but produce wrong local times.

## Accessibility

Keep accessibility up to date alongside any UI/UX change:
- Update ARIA roles, labels, and attributes when markup changes
- Ensure keyboard navigation and focus order remain correct
- Add or update `a11y.test.tsx` coverage for new/changed interactive elements
- For motion effects (confetti, animations): **omit the element entirely** when `prefers-reduced-motion: reduce` — do not just hide it
- `role="progressbar"` must have an accessible name — add `aria-label`, `aria-labelledby`, or `title`; axe will fail without one
- `aria-live` is invalid on `<button>` elements — place it on a non-interactive sibling `<span>` or `<div>`; screen readers may silently ignore it on interactive elements
- Modal dialogs (`role="dialog"` / `role="alertdialog"`) require: (1) focus moved into dialog on open, (2) Tab cycles within dialog only (focus trap), (3) Escape key closes and returns focus to the trigger
- `LockInModal` uses `role="alertdialog"` — use `getByRole('alertdialog')` in tests, not `getByRole('dialog')`
- The timezone picker (`TimezoneSelect`) uses `role="combobox"` for its search input — use `getByRole('combobox', { name: /search timezones/i })` in tests, not `[role="listbox"]`; the picker closes on click-outside only (no Escape handler)
- Tailwind's `animate-pulse` is **not** guarded by `prefers-reduced-motion` — use `motion-safe:animate-pulse` or a custom CSS animation with a `@media (prefers-reduced-motion: reduce)` guard

## Party System

### Architecture

Three layers — no router, no global state library:

- **Layer 1** `src/room/` — pure TS WebSocket transport + protocol types (no React)
- **Layer 2** `src/hooks/` — `useRoom` (WS state machine), `usePartyMode` (view routing)
- **Layer 3** `src/components/party/` — all party UI components

`AppMode` discriminated union in `App.tsx` drives view switching between solo and party screens. `useDeepLink` is **gated to solo mode only** (`appMode.kind === 'solo'`) — party mode manages its own URL state via `usePartyMode`.

### State persistence

`sessionStorage` keys are namespaced by `roomCode` to prevent stale-token collisions across rooms.

### Product/UX decisions

| Decision | Rule |
|---|---|
| Proposals board timezones | Viewer's own timezone only — **no TZ labels** on any row |
| Dead room errors | Generic "Room not found" for all `ROOM_NOT_FOUND` errors — no oracle leakage |
| Post lock-in export | **Nicknames only** — no timezone info shown |
| Nickname re-roll | **Dropped from MVP** — auto-generated nickname is fixed for the session |
| Lock-in modal | Auto-dismisses after 2500ms; tappable/clickable to skip early |

### URL parameters

| Parameter | Format | Effect |
|---|---|---|
| `?code=<roomCode>` | `adjective-noun-noun` | Pre-fills join overlay (read-only); user taps [Join Party] to connect |
| `?locked-in=<roomCode>&time=<epochMs>` | room code + Unix ms | Opens export screen directly with confirmed time |

### Server protocol notes

- `join` **always creates** a new room if the code doesn't exist — `ROOM_NOT_FOUND` does **not** fire for fresh room codes. It only fires when joining a locked or expired room, or when a `rejoin` fails (e.g. token expired). There is no way to "check if a room exists" from the client.
- `room_activated` carries a full participant snapshot in `msg.participants` — update the full participants array when handling this message, not just the `roomPhase` field.
- Server may omit optional fields entirely (send `undefined`) rather than `null` — use loose `!= null` checks when filtering optional fields like `proposalEpochMs`.

### Capacity check

The server exposes `GET /capacity` → `{ accepting_rooms: boolean, reason: null | "HIGH_LOAD" }` (rate-limited: 10 req/60 s per IP; always HTTP 200 even when at capacity).

- `src/utils/fetchPartyCapacity.ts` — fetches the endpoint. **Fails closed** (returns `false`) on network error or non-OK response; 429 fails open (server is alive, WS may still work). Derives the HTTP base URL from `VITE_WS_URL` via `wsUrlToHttpBase` (`ws://host/ws` → `http://host`).
- `src/hooks/usePartyCapacity.ts` — calls `fetchPartyCapacity` once on mount. If unavailable, polls every 30 s until capacity opens; stops polling once `accepting_rooms` is `true`. Accepts an injectable `fetcher` parameter for testing (use `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync` for polling tests).
- `CoordinateSection` and `PartyJoinOverlay` both accept `accepting: boolean` and `loadingCapacity: boolean` props. When capacity is unavailable: show "Party rooms are temporarily unavailable." banner and set `aria-disabled` on the affected button(s). The deep-link join path (`?code=`) bypasses `CoordinateSection`, so `PartyJoinOverlay` must also receive these props.
- `toHaveAttribute` is **not available** in this project (no jest-dom) — use `element.getAttribute('aria-disabled')` instead.

### Testing: WebSocket hooks

- `useRoom` accepts an injectable `socketFactory?: () => RoomSocket` parameter — avoids patching `globalThis.WebSocket`
- In tests, pass a `FakeRoomSocket` with a `simulateMessage(msg)` helper
- Use `vi.useFakeTimers()` for reconnect-countdown and auto-dismiss timing tests
- Each `openConnection()` call captures `let thisSocket` before defining the callback object. All callbacks guard with `if (socketRef.current !== thisSocket) return` to prevent stale sockets (e.g. from React StrictMode double-invoke) from clobbering live state. The cleanup effect resets to `INITIAL_STATE` so that StrictMode remounts can reconnect cleanly.
- The `ProposeCtaBar` button is only enabled when `roomPhase === 'active'`. E2E tests that need to click "Propose This Time" must join with `roomState: 'active'` (override available in the `joinedMsg()` helper in `party-ws.spec.ts`).

## MVP Scope

- Timezone detection from browser (user-overridable)
- Natural language / text timestamp import via chrono-node
- Manual time + timezone selection UI
- Discord timestamp export (click-to-copy formats like `<t:1543392060:f>`)
- Deep link export with preconfigured timestamp
