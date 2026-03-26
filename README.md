# Collab Time

**Live site:** https://calebmorris.github.io/CollabTime/

## Setup

```
npm install
npm run dev
```

The dev server URL will be printed in the terminal.

### Screenshots

Install the Playwright browser binary (one-time):

```
npx playwright install chromium
```

Then take screenshots across all form factors:

```
npm run screenshots
```

Output defaults to `docs/screenshots/`. Override with `SCREENSHOT_DIR`:

```
SCREENSHOT_DIR=tmp/shots npm run screenshots
```

### Integration tests (Playwright)

The `e2e/` directory contains Playwright integration tests that run against a live instance of the app.

**Install browser binaries (one-time):**

```
npx playwright install
```

**Run against the local dev server** (start `npm run dev` first):

```
npm run test:e2e
```

**Run against a different target** (e.g. staging or production):

```
BASE_URL=https://calebmorris.github.io/CollabTime/ npm run test:e2e
```

**Interactive UI mode** (useful for debugging):

```
npm run test:e2e:ui
```

**Run a specific file or test:**

```
npx playwright test e2e/solo-mode.spec.ts
npx playwright test --grep "parses an ISO 8601"
```

**Run a specific browser only:**

```
npx playwright test --project=chromium
```

Test files:

| File | What it covers |
|---|---|
| `e2e/solo-mode.spec.ts` | Page load, text import, manual selector, timezone picker, export panel, deep links |
| `e2e/party-overlays.spec.ts` | Create/join overlays — modal behaviour, validation, clipboard, focus trap |
| `e2e/party-ws.spec.ts` | Party room with mocked WebSocket — connection lifecycle, proposals, lock-in, dead room |

> The party-ws tests use `page.routeWebSocket()` to intercept the WebSocket connection and simulate server messages — no live WebSocket server is required.

---

Rough idea: Simple JackBox-style way to coordinate timing of an event between multiple people that live in different regions and timezones.

Planned phases:
* Initial static page - single user flow to make it dead-easy to convert between time-zones and share with others
* Multi-user coordination - multiple users in a "room" that can make suggestions for a given time in their individual time-zones that the other users see in their local time-zones. People can approve/reject/suggest similar to calendar flows

# Features - MVP

## Settings - My Time Zone

Default to the zone pulled from the browser, this should be a time-zone that the user can update to a specific value if the detection is wrong.

## Export - Discord Format

Preview the specific timestamp in the various Discord [formats](https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa), grouped in a discord section. Allow for easy click-to-copy for the syntax (ex: `<t:1543392060:f>`).

## Export - Deep Link

Link that takes a user to [[Collab Time]] with a preconfigured timestamp selected.

# User Stories - Solo

## Import From Text

I am a general user trying to make sure I have my schedule aligned with an event. Sometimes when I see a particular date of an event, I get confused and mix up when it's actually happening when I convert to my time-zone.

If I copy, or just type out, a specific timestamp with timezone, the website should attempt to parse it for usage in the conversion. If unable to parse there should be human-readable indications why it's not working.

Supported input formats:
- Natural language: `today at 8PM EST`, `tomorrow at 3pm`, `June 15 at noon`
- ISO 8601: `2024-01-15T09:00:00Z`, `2024-01-15T09:00:00-05:00`
- Unix timestamp (seconds or milliseconds): `1543392060`

US timezone abbreviations (`EST`, `CST`, `MST`, `PST`) are treated as their current regional time — so `EST` entered during daylight saving time resolves to Eastern Daylight Time (UTC-4), matching how people actually write these abbreviations.

## Manual Selecting Time

I am a general user trying to make sure I have my schedule aligned with an event. Sometimes when I see a particular date of an event, I get confused and mix up when it's actually happening when I convert to my time-zone.

I should be able to select a given time-zone and time by way of some UI elements (a clock input or a click-and-select), and have it convert to my own timezone.
