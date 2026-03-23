# CollabTime — Party System: Master Reference

> **Status:** Consolidated design reference
> **Last updated:** 2026-03-21
> **Sources:** `party-system-ux.md` (decisions), `party-system-privacy-security.md` (decisions, supersedes wireframes on privacy points), `party-system-wireframes.md` (draft visual reference)

---

## 1. Vision

CollabTime's party system is a lightweight, ephemeral, multiplayer timezone negotiation layer. A group creates or joins a session, proposes meeting times using the existing time picker (each person sees times in their own timezone), and converges by proposing the same time. No accounts. No voting. No chat. When everyone agrees — they're **Locked In**.

---

## 2. Confirmed Decisions

### Room Identity

| Decision | Answer |
|---|---|
| Room identifier | 3-word passphrase only (e.g., `purple-falcon-bridge`) — code IS the room, no separate name |
| Code format | `adjective-noun-noun`, lowercase, hyphen-separated |
| Code strength | ~64 billion combinations (vs. JackBox 4-letter: ~457K — brute-forceable) |
| Room access | Open — anyone with the code can join; passphrase strength is the access control |
| Entry via link | `?code=purple-falcon-bridge` pre-fills the code field (read-only on join screen) |

### Core Mechanic

| Decision | Answer |
|---|---|
| Agreement model | Proposal-based only — no Accept/Reject buttons |
| Win condition | All present members have identical proposed times → **"Locked In"** |
| Proposal model | One active proposal per person at a time; new proposal silently replaces old |
| Late joiners | See all current proposals immediately; counted in quorum only after submitting their first proposal |
| Post lock-in | Read-only export screen; new session required to re-negotiate |
| History | Current proposals only — no proposal change log shown |

### Session Lifecycle

| Decision | Answer |
|---|---|
| Lifetime | Ephemeral — auto-expires ~2 hours of inactivity |
| Storage | In-memory only; no persistent storage after session ends |
| Confirmed time | Encoded in URL on lock-in: `?locked-in=purple-falcon-bridge&time=<epoch>` |
| Reconnection | 30-second grace period; reconnect sends session token to reclaim slot |
| Server restart | Sessions are lost — in-memory only |

### Display Names

**Decision (privacy doc, supersedes wireframes):** Auto-generated anonymous nicknames. No free-text name entry.

- Nickname format: two-word combos (e.g., "Teal Fox", "Quick River")
- User can tap **[🔀 New nickname]** to get a different one
- Nickname exists only for the session duration
- Wordlist: curated server-side, ~1M combinations (1000 adj × 1000 noun), no offensive terms

**UI:** Replace any "Your display name:" text input with a nickname display + re-roll button:
```
Your nickname this session:
  Teal Fox  [🔀 New nickname]
```

### Timezone Visibility

**Decision (privacy doc, supersedes wireframes):** Timezones are hidden from all other participants. Timezone = location signal.

- Each participant's timezone is used server-side for time conversion only
- It is **never broadcast** to other clients
- Every participant sees proposed times converted into **their own local timezone**
- No timezone labels appear next to names on the proposals board

**Proposals board format (OLD → NEW):**
```
OLD: Sarah (EST)          NEW: Teal Fox
     Fri, 3:00 PM EST          Fri, 3:00 PM   ← in viewer's own TZ
```

### Privacy & Security

| Decision | Answer |
|---|---|
| Session token | Server-issued on join; 128-bit cryptographically random |
| Token storage | `sessionStorage` only (not `localStorage` — cleared on tab close, not in URLs) |
| Reconnect auth | Token sent to server; validates before restoring slot |
| Rate limiting | Max 10 failed join attempts per IP per 5 minutes; exponential backoff after 3 |
| Server logging | Minimal operational only — errors and anonymized connection events; no names, times, or timezones in persistent logs |
| Transport | HTTPS + WSS required; no plaintext connections |
| Input validation | Room code: max 30 chars, three lowercase words separated by hyphens |
| URL privacy | Post-lock-in deep link contains timestamp only — no names, timezones, or room codes |
| User disclosure | Footer copy on join screen: *"Nicknames and proposals exist only during the session. Nothing is stored after it ends."* |

### UI Layout

**Entry points (no separate mode-select screen):**
- Two buttons integrated into existing solo UI: **[👥 Start a Party]** and **[🔗 Join a Party]**
- Pre-selected solo time becomes the leader's initial proposed time

**Desktop (1200px+):** Three-column negotiation room
- Left: Proposals board (sticky) — one row per participant, time in viewer's TZ, consensus meter
- Center: Time picker (natural language + manual) + [Propose This Time] button
- Right: Result display; export panel (locked/dimmed until lock-in)

**Mobile (375px):** Single-column scrollable
- COORDINATE section below RESULT (or SHARE & EXPORT if time selected)
- Sticky [Propose This Time] CTA in thumb zone
- Native `datetime-local` picker
- Room code in header; "Leave" escape hatch
- Code entry: `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, auto-inserts hyphens

**Lock-in:** Full-screen celebration modal (2–3s), confetti animation, auto-transitions to export.

**Accessibility:**
- Confetti respects `prefers-reduced-motion`
- Touch targets: 44px minimum
- Proposals board should use `aria-live="polite"` for screen reader announcements
- Keyboard navigation required for all interactive elements

---

## 3. Wireframe Elements Still Needing Updates

The wireframes (`party-system-wireframes.md`) were drafted before the privacy review. These elements need updating before wireframes are used for implementation reference:

| Element | Current in Wireframes | Correct per Privacy Doc |
|---|---|---|
| Proposals board participant label | `Sarah (EST)` | `Teal Fox` (auto-nickname, no TZ) |
| Proposals board time display | Time in participant's TZ + TZ label | Time in viewer's TZ, no TZ label |
| Join screen name field | Free-text "Your display name:" input | Auto-generated nickname + re-roll button |
| Export participant list | Shows `✓ Sarah (GMT-06) · 2:30 PM` | Nicknames only; TZ hidden or omitted |
| Join screen | No privacy notice | Footer: "Nicknames and proposals exist only during the session." |
| URL param name | Inconsistent (`?session=` vs `?code=`) | Standardize to `?code=` |
| Button label conventions | Mixed (emoji, arrows, plain text) | Standardize — pick one convention |
| Desktop column order | Inconsistent (proposals-left vs proposals-right) | Standardize: proposals left, picker center, export right |

---

## 4. Open Questions

These are genuinely unresolved — decisions that block specific implementation areas.

### Blocks Protocol / Data Model (answer first)

**Q1 — Canonical time representation**
How are proposals stored and compared on the server? Options:
- `Unix timestamp (ms)` — unambiguous, DST-safe, recommended
- `{ date, hour, minute, timezone }` — human-readable but DST-risky

*Blocks: proposal comparison logic, lock-in equivalence check, sync protocol.*

**Q2 — Quorum definition**
"All present members" is ambiguous. Which applies?
- (a) All who have ever joined the session
- (b) All who have submitted at least one proposal
- (c) All currently connected (excluding those in 30s grace period)

Option (c) is most practical but needs explicit decision.

*Blocks: lock-in detection logic, participant count display.*

**Q3 — DST handling**
If a session spans a DST boundary (e.g., created before spring forward, lock-in after), do stored Unix timestamps re-render correctly? Does proposal matching still hold across the boundary?

*Blocks: time comparison implementation.*

**Q4 — Error message differentiation**
There is a conflict between docs on this point:
- Privacy doc: "No feedback distinguishing 'wrong code' from 'room expired'" (prevents oracle attacks that let attackers map room lifecycle)
- Wireframes: Distinct screens — "This session has expired" vs. "We couldn't find that session"

**Decision needed:** Generic error for all failure cases, or distinct messages? (Distinct messages are a minor oracle attack surface but provide much better UX for the common "I have a typo" case.)

*Blocks: dead-room UX implementation, server error response schema.*

### Blocks UI Implementation (answer before building screens)

**Q5 — Solo lock-in**
Can a single participant lock in a time alone, or is a minimum of 2 required?

**Q6 — Proposal during grace period**
When a participant disconnects and is in the 30s grace window, does their proposal remain visible on the board? Does the quorum count drop immediately, or only after grace expires?

**Q7 — Late joiner badge**
The "You just joined" badge — dismissed manually or auto-expires after submitting first proposal?

**Q8 — Reconnection countdown visibility**
Server enforces the 30s grace period timer. Does the client UI show a visible countdown, or just "Reconnecting..."?

**Q9 — Participant list post lock-in**
Export screen shows confirmed time + participant list. Are timezone offsets shown there (as wireframes show), or hidden (per privacy doc)? The privacy doc doesn't explicitly address the export screen.

**Q10 — Lock-in screen skip**
The celebration modal auto-dismisses after 2–3s. Can users tap/click to skip it immediately?

### Blocks Shipping (answer before launch)

**Q11 — Session size limits**
Max participants per room? Any protection against 1000+ person rooms (memory exhaustion, network flooding)?

**Q12 — Multi-tab behavior**
`sessionStorage` is per-tab. If a user opens two tabs with the same session, they'll get two separate tokens. What's the intended behavior?

**Q13 — Logging retention**
"Minimal operational logs" — what is the exact retention window (24h? 7 days?)? Are logs encrypted at rest? Who has access?

**Q14 — Wordlist maintenance**
Where is the nickname wordlist stored? How are offensive terms filtered? Is it updatable without a deploy?

**Q15 — What counts as "inactivity" for 2hr expiry**
Is it: no WebSocket messages? No proposals submitted? No connected participants? Needs a precise definition for the server implementation.

---

## 5. Implementation Roadmap

The existing app is **frontend-only** (React 19, TypeScript, Tailwind CSS 4, Vite). No backend exists. The party system is entirely greenfield server-side, with new UI components on the frontend.

### Phase 0 — Resolve Blockers (prerequisite)
Answer Q1–Q4 above before writing any code. These block the data model and protocol.

### Phase 1 — Core Server
Node.js WebSocket relay server:
- Room creation and code generation (3-word passphrase, CSPRNG)
- Participant join/leave with session tokens
- In-memory session store (room state, participant list, proposals)
- Rate limiting (10 failed joins / IP / 5min, exponential backoff)
- ~2hr idle expiry

### Phase 2 — Time Proposal Protocol
- Shared TypeScript types in `/shared/` (room state, participant, proposal, message schema)
- WebSocket message protocol (join, propose, lock-in, disconnect events)
- Proposal broadcast (server → all clients)
- Lock-in detection (per quorum definition from Q2)
- Confirmed-time URL generation on lock-in

### Phase 3 — Frontend Integration
- `useRoom` hook (WebSocket lifecycle, state management, reconnect)
- New components: `RoomCreate`, `RoomJoin`, `RoomLobby` (proposals board + picker), `RoomLocked` (export)
- Update `App.tsx` to integrate party mode entry points
- Reuse existing: `ConversionDisplay`, `DiscordExport`, `CalendarExport`, `ShareLink`, `useTimezone`, `useDeepLink`

### Phase 4 — Resilience & Edge Cases
- Reconnection grace period (server timer + client banner UI)
- Dead-room UX (expired, never-existed, locked-in, invalid format, network error)
- Fuzzy code-entry matching (typo hints on join)
- Error states for all WebSocket failures

### Phase 5 — Deployment
- Node.js server hosting
- WSS/HTTPS termination
- CORS configuration
- Structured logging pipeline with session payload exclusions confirmed
