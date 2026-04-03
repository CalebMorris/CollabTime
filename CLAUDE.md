# CollabTime

Timezone coordination tool. Users pick a time in their timezone; others see it in theirs.

## Stack

- React 19, TypeScript, Tailwind CSS 4
- Vite, ESLint 9 (flat config), Vitest + Testing Library, chrono-node
- chrono-node: normalizes `EST`/`CST`/`MST`/`PST` → DST-aware `ET`/`CT`/`MT`/`PT` in `src/utils/parseTime.ts`

## Commands

```
npm run dev           # start dev server
npm run build         # type-check + build
npm run test          # watch mode
npm run lint          # eslint
npm run test:e2e      # Playwright (requires dev server on localhost:5173)
npm run test:e2e:ui   # Playwright UI mode
```

## Linting

Config: `eslint.config.js`. **Intentional suppressions** (do not remove):
- `jsx-a11y/no-autofocus` — `autoFocus` correct for modals per WCAG
- `TimezoneSelect` `role="option"` divs — keyboard via `aria-activedescendant`, not tab-focusable
- `LockInModal` `role="alertdialog"` click-to-dismiss overlay — Escape handled separately
- `thisSocket` in `useRoom.ts` — declared before callbacks, assigned once; cannot be `const` (TDZ ref)
- `RoomSocket.test.ts` — test helper `this` capture (false positive)
- `PartyCreateOverlay` / `PartyJoinOverlay` backdrop `role="presentation"` — correct semantic for click-outside-dismiss

## Conventions

- Use `jq` for JSON parsing, not Python
- Descriptive names (`selectedTimezone` not `tz`; `roomSocket` not `ws`)
- Write failing test first (red-green TDD); tests live alongside source (`*.test.ts` / `*.test.tsx`)

## Testing

Vitest excludes `e2e/**` in `vite.config.ts`.

### E2E (Playwright)

| File | Scope |
|---|---|
| `e2e/solo-mode.spec.ts` | Page load, import, timezone picker, export, deep links |
| `e2e/party-overlays.spec.ts` | Create/join overlays, modals, validation, clipboard, focus trap |
| `e2e/party-ws.spec.ts` | Party flows; `page.routeWebSocket()` mocks server |

**Prerequisites:** `npx playwright install` (once), dev server running, `BASE_URL` env var (default: `http://localhost:5173/CollabTime/`)

**Clipboard tests:** Chromium only (WebKit/Firefox no-op); use `page.context().grantPermissions()`.

**WS mocking:** `wsRoute.onMessage(handler)`, `wsRoute.send(jsonString)`, `wsRoute.close()`; payloads match `src/room/roomProtocol.ts`.

**React StrictMode double-invoke:** Call `serverWs$()` **after** `waitForRoomConnected` (not before). `mockServer()` tracks `latestWs` to overwrite on reconnect.

**Reconnect:** Set `shouldRespond = false` before `serverWs.close()` to keep "reconnecting" banner visible for assertions.

**Timing:** Never use `vi.useFakeTimers()` in e2e tests (Playwright manages real time). Prefer `expect(...).toBeVisible({ timeout: N })` over `page.waitForTimeout()`.

**Axe tests:** Never pair `vi.useFakeTimers()` + `axe()` (fake timers block async, cause cascading failures). Test timing separately.

**Timezone parsing tests:** Cover (1) DST period (March ref date), (2) standard time (January ref date), (3) round-trip assertion (`"8PM EST"` → displays as `8PM` in IANA tz, not just UTC check).

## Accessibility

- Update ARIA roles/labels/attributes with markup changes
- Motion effects: **omit entirely** for `prefers-reduced-motion: reduce` (don't hide)
- `role="progressbar"` needs accessible name (`aria-label` / `aria-labelledby` / `title`)
- `aria-live` invalid on `<button>` — place on sibling `<span>` / `<div>`
- Modal dialogs require: (1) focus into dialog on open, (2) Tab trap, (3) Escape closes + restores focus
- `LockInModal`: use `getByRole('alertdialog')` in tests
- `TimezoneSelect`: use `getByRole('combobox', { name: /search timezones/i })`; closes on click-outside (no Escape)
- Tailwind `animate-pulse` unguarded — use `motion-safe:animate-pulse` or `@media (prefers-reduced-motion: reduce)`

## Party System

**Architecture:** Layer 1 `src/room/` (pure TS, WS + protocol), Layer 2 `src/hooks/` (`useRoom`, `usePartyMode`), Layer 3 `src/components/party/` (UI). `AppMode` discriminated union in `App.tsx` drives solo/party switching. `useDeepLink` solo-only; party manages URL via `usePartyMode`.

**State persistence:** `sessionStorage` namespaced by `roomCode`.

**UX decisions:**

| Decision | Rule |
|---|---|
| Proposals board | Viewer's timezone only, no TZ labels |
| Dead room errors | Generic "Room not found" for all `ROOM_NOT_FOUND` (no oracle) |
| Post lock-in export | Nicknames only, no timezone |
| Nickname re-roll | Dropped from MVP (fixed per session) |
| Lock-in modal | Auto-dismiss 2500ms, tappable to skip |

**URL params:**

| Parameter | Format | Effect |
|---|---|---|
| `?code=<roomCode>` | `adjective-noun-noun` | Pre-fills join (read-only) |
| `?locked-in=<roomCode>&time=<epochMs>` | code + Unix ms | Export screen directly |

**Server protocol:**
- `join` always creates if missing — `ROOM_NOT_FOUND` only on locked/expired/rejoin-fail; no client "exists check"
- `room_activated` carries full `msg.participants` snapshot — update entire array, not just phase
- Optional fields sent as `undefined`, not `null` — use `!= null` checks

**Capacity check:**
- `src/utils/fetchPartyCapacity.ts`: `GET /capacity` → `{ accepting_rooms, reason }` (10 req/60 s limit; HTTP 200 always). Fails closed on error/non-OK; 429 fails open. Derives HTTP base from `VITE_WS_URL` via `wsUrlToHttpBase`.
- `src/hooks/usePartyCapacity.ts`: polls every 30 s if unavailable; stops once accepting. Accepts injectable `fetcher` for testing; use `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync` for polling tests.
- `CoordinateSection` / `PartyJoinOverlay`: receive `accepting` / `loadingCapacity` props. Show "Party rooms are temporarily unavailable." banner + `aria-disabled` button when unavailable. Deep-link path (`?code=`) bypasses `CoordinateSection` — `PartyJoinOverlay` must also receive these props.
- No jest-dom: use `element.getAttribute('aria-disabled')` not `toHaveAttribute`.

**WebSocket testing:**
- `useRoom` accepts injectable `socketFactory?: () => RoomSocket`; pass `FakeRoomSocket` with `simulateMessage(msg)` helper
- `thisSocket` guard prevents stale sockets from clobbering state; cleanup resets to `INITIAL_STATE` for StrictMode remounts
- `ProposeCtaBar` enabled only when `roomPhase === 'active'`; E2E tests use `joinedMsg()` override in `party-ws.spec.ts`

## MVP Scope

- Timezone detection from browser (overridable)
- Natural language timestamp import via chrono-node
- Manual time + timezone selection
- Discord timestamp export
- Deep link export
