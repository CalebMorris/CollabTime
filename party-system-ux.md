# CollabTime — Party System: UX Exploration Document

> **Status:** Complete — decisions captured
> **Last updated:** 2026-03-21
> **Purpose:** Brainstorming/exploration doc. Not an implementation plan.

---

## 1. Context

CollabTime currently serves solo users who want to convert a timestamp between timezones and share it (Discord export, deep link). The next major feature is a **party system** — a lightweight, ephemeral, JackBox-inspired multiplayer coordination layer where a group negotiates and confirms a shared meeting time across timezones.

---

## 2. Existing Solo Mode (Baseline)

Users can:
- Type or paste natural-language text to parse a timestamp (chrono-node)
- Manually pick a time via UI controls
- Override timezone detection
- Export a Discord timestamp in multiple formats (click-to-copy)
- Share a deep link (`?t=<unix>`) that opens CollabTime pre-loaded with that time

The party system sits *on top of* this — the time picker/converter remains the core interaction tool.

---

## 3. Party System Concept

### The Flow
1. **Party leader** creates a session → receives a shareable room code and link
2. Leader shares the code/link out-of-band (Discord, text, etc.)
3. **Party members** join the session via code or link
4. Participants negotiate: propose times, converge on one
5. **Win condition:** all present members have proposed the same time → "Locked In"

### Naming

| Concept | Decision | Notes |
|---|---|---|
| Room identifier | **3-word passphrase code only** (e.g., `purple-falcon-bridge`) | No separate room name; the code IS the room |
| Win condition language | **"Locked In"** | Energetic, final, fits collaborative tone |

**Why 3-word passphrase over 4-letter JackBox code:**
JackBox: 26⁴ ≈ 457,000 combos (brute-forceable in minutes).
3-word (4k-word list): 4,000³ ≈ 64 billion combos — infeasible without rate limiting bypass.
Format: `adjective-noun-noun` (e.g., `golden-river-desk`). Easy to read aloud, type on mobile, and remember visually.

---

## 4. Core Mechanic

There is **no accept/reject voting**. The mechanic is purely proposal-based:

- Each person proposes a time using the existing time picker (one active proposal per person at a time)
- **"Agreement" = proposing the same time as others** — no separate Accept button
- Proposing a new time silently replaces your previous proposal for the room
- **Win condition:** all present members have identical proposed times → "Locked In"

This makes the session room a **live board of "what time does each person want"** — no chat, no votes, just proposals converging.

---

## 5. User Stories

### Solo User (unchanged baseline)
> As a solo user, I paste a timestamp with timezone and want to see it converted to my local timezone for sharing.

### Party Leader
> As the party leader, I want to create a new session, get a shareable code/link, and invite others — without requiring them to have accounts.

### Party Member (joiner)
> As a party member, I received a session code. I want to join, see each participant's currently proposed time in MY timezone, and propose a time of my own.

### Time Proposer
> As any participant, I want to suggest a time using the existing time picker so the group can see it in their respective timezones.

### Late Joiner
> As someone who joins after negotiation has started, I want to see everyone's current proposals immediately and start participating.

### Confirmed State (post-win)
> As any participant, once a time is locked in, I want to export it (Discord, deep link, calendar) and leave.

---

## 6. Core Action Flows

### Flow A: Create → Share → Join
```
Leader: [Party Mode] → [Create Session]
  → Server generates: purple-falcon-bridge
  → UI shows: code + shareable link (?session=purple-falcon-bridge)
  → Leader copies link → shares via Discord/text

Member: opens link or visits site + enters code
  → Joins session → sees participant list + all current proposals
```

### Flow B: Time Negotiation
```
Participant A: sets time in picker → [Propose this time]
  → All members see: "A: [time in each viewer's timezone]"

  → Member B agrees: picks same time → [Propose]
    → B now shows same time as A
    → If only A and B in session → "🔒 Locked In"

  → Member B disagrees: picks different time → [Propose]
    → B now shows their own time; A's proposal still visible
    → Both proposals shown side-by-side in each person's timezone
    → Negotiation continues until all proposals match
```
*Key: "agreeing" = proposing the same time. Each person has exactly one active proposed time visible to the room.*

### Flow C: Export After Lock
```
Win condition met → session freezes → "🔒 Locked In" state
  → Read-only screen with confirmed time
  → Export options:
    → Discord copy buttons (all formats)
    → Deep link (solo-mode URL with the confirmed timestamp)
    → [Calendar export] (future)
  → Session remains read-only; new session needed to re-negotiate
```

---

## 7. Confirmed Decisions

| Decision | Answer |
|---|---|
| Room identifier | Code only (`purple-falcon-bridge` style) — no separate room name |
| Win condition trigger | Unanimous — all present members must share the same proposed time |
| Proposal model | One active proposal per person; new proposal replaces/hides old one |
| Late joiners | See current proposals immediately, participate right away |
| Disconnection | ~30s grace period shown as "reconnecting" before removal |
| Session lifetime | Ephemeral — auto-expires ~2hrs inactivity, no persistent storage |
| Post lock-in | Read-only export screen; new session required to re-negotiate |
| History display | Current proposals only — no change log shown to participants |

### Key UX Implications
- Convergence is visual: as proposals align, the "distance" between times shrinks until they're identical
- No deadlock mechanics needed (no leader override) — if someone stalls, the group negotiates socially
- The export screen after lock-in is the natural handoff to existing solo export features (Discord, deep link)
- Disconnection grace period prevents a page refresh from ruining a near-locked session
