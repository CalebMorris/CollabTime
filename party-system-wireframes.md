# CollabTime — Party System: Wireframes & Edge Cases

> **Status:** Draft exploration
> **Last updated:** 2026-03-21
> **Purpose:** Visual design reference. Not an implementation plan.
> **Companion doc:** See `party-system-ux.md` for core decisions.

---

## Core Mechanic Recap

No voting. Each person proposes a time. **Agreement = proposing the same time.**
Win condition: all present members show identical proposed times → **"Locked In"**

---

# Part 1: Dead Room UX

*What happens when a user opens a link to an expired or non-existent session.*

---

## Decision Matrix

| Scenario | Heading | Primary CTA | Preserve data? |
|---|---|---|---|
| **Expired** | "This session has expired" | Create New Session | No |
| **Never existed** | "We couldn't find that session" | I Have a Different Code | No |
| **Locked In** | "This session has concluded" | Copy Confirmed Time | **Yes — time in URL** |
| **Invalid format** | "That's not a valid room code" | I Have a Different Code | No |
| **Network error** | "Connection lost" | Retry | No |

---

## Screen: Expired (Most Common)

```
┌─────────────────────────────────────────────────────────────┐
│  CollabTime                                   [America/NYC]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        ⏱️ This session has expired          │
│                        ─────────────────────────────────    │
│                        The room "purple-falcon-bridge"      │
│                        closed after 2h of inactivity.       │
│                        Sessions only last while people       │
│                        are active.                          │
│                                                              │
│              [Create New Session]  [I have a different code] │
│                                                              │
│                           [Go to Solo Mode]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Screen: Never Existed / Typo

```
┌─────────────────────────────────────────────────────────────┐
│  CollabTime                                   [America/NYC]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        ❓ We couldn't find that session     │
│                        ─────────────────────────────────    │
│                        The room code "purpl-falkon-brige"   │
│                        doesn't exist. This could be a typo  │
│                        or the link may be incorrect.        │
│                                                              │
│              [I have a different code]  [Create New Session] │
│                                                              │
│                           [Go to Solo Mode]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Screen: Locked In (Special Case — Preserve the Time)

When a session ends via lock-in, encode the confirmed time in the URL:
`?locked-in=purple-falcon-bridge&time=1711006400`

That way, even after the session is cleaned up server-side, the link still renders the confirmed time.

```
┌─────────────────────────────────────────────────────────────┐
│  CollabTime                                   [America/NYC]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        🔒 Session Confirmed                 │
│                        ─────────────────────────────────    │
│                        Your group locked in this time:      │
│                                                              │
│                        Wed, Mar 21, 2026 · 3:00 PM EDT      │
│                        (UTC: 7:00 PM)                       │
│                        In 4 hours 32 minutes ⏱️             │
│                                                              │
│           [Copy to Discord]  [Copy Deep Link]  [Calendar]   │
│                                                              │
│                      [Create New Session]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## "I Have a Different Code" — Inline Entry

When the user taps the secondary CTA, the screen expands inline (no navigation):

```
┌──────────────────────────────────┐
│ Enter room code:                 │
│ [_________________________]      │
│ e.g. purple-falcon-bridge        │
│                         [→ Join] │
└──────────────────────────────────┘
```

- Real-time format validation; button enables when valid
- On submit: re-attempts join; if still dead → same screen with new code name in copy
- No page navigation needed

## Transition Behavior

- On cold link load: query backend immediately (no artificial delay)
- If backend is slow (>5s): show `⏳ Looking for your session… [Cancel]`
- Show result state (dead or alive) as soon as response arrives

---

# Part 2: Full Flow Wireframes (Desktop)

*The existing solo mode IS the starting point. There is no separate mode select screen.*
*Party mode is entered via: (a) a shared session link, or (b) UI controls within the existing solo mode.*

---

## Entry Points into Party Mode

The current solo mode UI has two states:

**Empty state** — centered single column, no time selected:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime                                              [America/Phoenix ▸] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              PICK A TIME                                     │
│                    ┌─────────────────────────────┐                           │
│                    │ e.g. tomorrow at 3pm, ...   │                           │
│                    │  [Parse]                    │                           │
│                    │          or                 │                           │
│                    │ Date and time [___________] │                           │
│                    └─────────────────────────────┘                           │
│                                                                               │
│                              RESULT                                          │
│                    ┌─────────────────────────────┐                           │
│                    │ Local time  — : —            │                           │
│                    │ UTC         — : —            │                           │
│                    └─────────────────────────────┘                           │
│                                                                               │
│         ╔═══════════════════════════════════════════════════╗               │
│         ║  COORDINATE  ← NEW SECTION                        ║               │
│         ║                                                    ║               │
│         ║  [👥 Start a Party]    [🔗 Join a Party]           ║               │
│         ║                                                    ║               │
│         ╚═══════════════════════════════════════════════════╝               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**With time selected** — two columns, SHARE & EXPORT visible on the right:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime                                              [America/Phoenix ▸] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  PICK A TIME                     │  SHARE & EXPORT                          │
│  ┌─────────────────────────────┐ │  ┌──────────────────────────────────┐   │
│  │ November 28 at 1:01 AM      │ │  │ http://…/?t=1543392060    [copy] │   │
│  │  [Parse]                    │ │  └──────────────────────────────────┘   │
│  │  or  [date & time picker  ] │ │  ┌──────────────────────────────────┐   │
│  └─────────────────────────────┘ │  │ 📅 Calendar event  [GCal][.ics] │   │
│                                   │  └──────────────────────────────────┘   │
│  RESULT                           │  ┌──────────────────────────────────┐   │
│  ┌─────────────────────────────┐ │  │ 🎮 Discord timestamps          ▸ │   │
│  │ • Ago 2668d 14h 49m         │ │  └──────────────────────────────────┘   │
│  │ Local time America/Phoenix  │ │                                          │
│  │ Wed, Nov 28, 2018, 1:01 AM  │ │  ╔══════════════════════════════════╗   │
│  │ UTC Wed, Nov 28, 2018 8:01AM│ │  ║  COORDINATE  ← NEW SECTION       ║   │
│  └─────────────────────────────┘ │  ║                                  ║   │
│                                   │  ║  [👥 Start a Party]              ║   │
│                                   │  ║  Propose this time to your group ║   │
│                                   │  ║                                  ║   │
│                                   │  ║  [🔗 Join a Party]               ║   │
│                                   │  ║  Enter a room code               ║   │
│                                   │  ╚══════════════════════════════════╝   │
│                                   │                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Entry point via shared link** — opening `?session=purple-falcon-bridge` skips solo mode entirely and lands directly on the Join screen (with code pre-filled). No UI interaction needed.

---

### "Start a Party" — with a time pre-loaded

When the user has a time selected and clicks **[Start a Party]**, that time becomes the initial proposed time in the session — the leader enters the negotiation room already having proposed something.

When **no time is selected**, clicking **[Start a Party]** creates the session and drops the user into the negotiation room with an empty picker (propose when ready).

---

## Screen: Create Session

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime                          ◄ Back                    [TZ Picker]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                   ╔══════════════════════════════════════════╗               │
│                   ║  YOUR SESSION CODE                        ║               │
│                   ║                                           ║               │
│                   ║    purple-falcon-bridge    [Copy] [🔗]   ║               │
│                   ║                                           ║               │
│                   ║  Share this code or link with teammates. ║               │
│                   ║  Session expires after ~2hrs of inactivity.║             │
│                   ╚══════════════════════════════════════════╝               │
│                                                                               │
│                   ┌──────────────────────────────────────────┐               │
│                   │  Your display name:                      │               │
│                   │  [________________________________]       │               │
│                   └──────────────────────────────────────────┘               │
│                                                                               │
│                              [Enter the Room]                                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Code is generated server-side; read-only display
- Two copy targets: code alone `[Copy]`, full shareable link `[🔗]`
- Leader joins their own session by entering a name → `[Enter the Room]`

---

## Screen 3: Join Session (Manual Code Entry)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime                          ◄ Back                    [TZ Picker]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                    ┌───────────────────────────────────────┐                 │
│                    │  Join a Session                        │                 │
│                    │  Have a 3-word code? Enter it below.  │                 │
│                    │                                        │                 │
│                    │  Session code:                         │                 │
│                    │  [purple-falcon-bridge____________]    │                 │
│                    │  e.g. purple-falcon-bridge             │                 │
│                    │                                        │                 │
│                    │  Your display name:                    │                 │
│                    │  [________________________________]    │                 │
│                    │                                        │                 │
│                    │  ⓘ Others will see your name          │                 │
│                    │                         [Join Session] │                 │
│                    └───────────────────────────────────────┘                 │
│                                                                               │
│                    ─────────────────────────────────────────                 │
│                            Already joined? [Return to session]               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

- If arriving via link: code is pre-filled from URL param, shown read-only
- Join button disabled until both fields have content
- Inline error on bad/expired code: `⚠ Session not found. Check the code and try again.`

---

## Screen 4: Negotiation Room

*The main loop. Left = proposals board. Center = your time picker. Right = result + export (locked).*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime    ◄ Leave (purple-falcon-bridge)                  [TZ Picker]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐   ┌──────────────────────┐  ┌──────────────────┐ │
│  │  PROPOSALS           │   │  YOUR PICKER          │  │  RESULT          │ │
│  │  ──────────────────  │   │  ────────────────────  │  │  ──────────────  │ │
│  │                      │   │                        │  │                  │ │
│  │  Sarah               │   │  Enter time:           │  │  In 4d 10m ⏱️   │ │
│  │  Fri, Mar 21 · 14:30 │   │  [tomorrow at 3pm   ] │  │                  │ │
│  │  (GMT-0600)          │   │  ─────── or ───────    │  │  Your timezone   │ │
│  │  ◉ active            │   │  Date: [2026-03-21]    │  │  Fri Mar 21      │ │
│  │                      │   │  Time: [14:30      ]   │  │  2:30 PM         │ │
│  │  Alex                │   │  TZ:   [GMT-0600 ▸]    │  │                  │ │
│  │  Fri, Mar 21 · 14:30 │   │                        │  │  UTC             │ │
│  │  (GMT-0500)          │   │  [Propose This Time]   │  │  Fri Mar 21      │ │
│  │  ◉ active            │   │                        │  │  8:30 PM         │ │
│  │                      │   └──────────────────────┘  │                  │ │
│  │  Jordan              │                              │  ──────────────  │ │
│  │  🔄 Reconnecting...  │                              │  EXPORT          │ │
│  │  (30s grace)         │                              │  (locked until   │ │
│  │                      │                              │   lock-in)       │ │
│  │  You (Parker)        │                              │  Discord ▸       │ │
│  │  Fri, Mar 21 · 14:30 │                              │  Deep link ▸     │ │
│  │  (GMT-0600)          │                              │                  │ │
│  │  ◉ your proposal     │                              └──────────────────┘ │
│  │                      │                                                   │
│  │  ═══════════════════ │                                                   │
│  │  2 of 3 agree        │                                                   │
│  │  (Jordan reconnecting│                                                   │
│  └──────────────────────┘                                                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key design details:**
- Left panel: one entry per participant, showing their proposal in the viewer's timezone
- Consensus indicator at bottom of left panel: `2 of 3 agree` — pulses as it approaches unanimous
- Reconnecting participant shown in-place with spinner and grace period hint
- `[Propose This Time]` is the only action — clicking it silently replaces your previous proposal
- Export panel locked (dimmed) until lock-in

---

## Screen 5: Lock-In Celebration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime                                                    [TZ Picker]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│             ✨  ✨   ✨   ✨   ✨   ✨   ✨   ✨   ✨                       │
│                                                                               │
│                        ╔══════════════════════╗                              │
│                        ║                      ║                              │
│                        ║    LOCKED IN! 🎉     ║                              │
│                        ║                      ║                              │
│                        ║    Fri, Mar 21       ║                              │
│                        ║    2:30 PM GMT-06    ║                              │
│                        ║                      ║                              │
│                        ║    All 3 on board    ║                              │
│                        ║                      ║                              │
│                        ╚══════════════════════╝                              │
│                                                                               │
│             ✨  ✨   ✨   ✨   ✨   ✨   ✨   ✨   ✨                       │
│                                                                               │
│                      Redirecting to export in [3]…                          │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Full-screen modal/overlay, ~2-3 second hold
- Auto-transitions to export screen; tap to skip countdown
- Confetti animation (respects `prefers-reduced-motion`)

---

## Screen 6: Post Lock-In Export (Read-Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CollabTime        ◄ Back to Dashboard             [TZ Picker]              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                   Session Locked In 🎉  purple-falcon-bridge                 │
│                                                                               │
│     ┌───────────────────────────────────────────────────────────────┐        │
│     │  CONFIRMED TIME                                               │        │
│     │  In 4 days, 10 min  •  Fri, Mar 21, 2026 · 2:30 PM (GMT-06) │        │
│     │  UTC: Fri, Mar 21, 2026 · 8:30 PM                            │        │
│     └───────────────────────────────────────────────────────────────┘        │
│                                                                               │
│     ┌───────────────────────────────────────────────────────────────┐        │
│     │  PARTICIPANTS (3)                                             │        │
│     │  ✓ Sarah (GMT-06)   Fri, Mar 21 · 2:30 PM                   │        │
│     │  ✓ Alex  (GMT-05)   Fri, Mar 21 · 3:30 PM                   │        │
│     │  ✓ Parker (GMT-06)  Fri, Mar 21 · 2:30 PM                   │        │
│     │  Confirmed 2 min ago                                         │        │
│     └───────────────────────────────────────────────────────────────┘        │
│                                                                               │
│     ┌───────────────────────────────────────────────────────────────┐        │
│     │  EXPORT                                                       │        │
│     │  [⊕ Copy Link]  collabtime.app?t=1711006400                  │        │
│     │                                                               │        │
│     │  Discord Timestamps:                                          │        │
│     │  Short time    Fri, Mar 21, 2:30 PM            [Copy]        │        │
│     │  Long time     Friday, March 21, 2026, 2:30 PM [Copy]        │        │
│     │  Relative      in 4 days, 10 min               [Copy]        │        │
│     │                                                               │        │
│     │  [📅 Calendar Export]                                         │        │
│     └───────────────────────────────────────────────────────────────┘        │
│                                                                               │
│          [Share Again]     [New Session]     [Back to Solo Mode]             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# Part 3: Per-Story Wireframes — Desktop (1200px+)

*Each story starts from the existing solo mode UI. The party room screens replace the solo UI while the session is active; solo mode is restored if the user leaves.*

---

## Story 1: Party Leader — Create & Share

```
╔═══════════════════════════════════════════════════════════════╗
║  CREATE A PARTY                                               ║
║                                                               ║
║  Your passphrase code:                                        ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║  purple-falcon-bridge                                  ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║             [⚡ Copy Code]          [📋 Copy Link]           ║
║                                                               ║
║  Share link:  collabtime.app/?code=purple-falcon-bridge       ║
║                                                               ║
║  Your display name:                                           ║
║  [__________________________________________________]         ║
║                        [→ Enter Party]                        ║
╚═══════════════════════════════════════════════════════════════╝
```

- Code is non-editable, server-generated
- Two copy targets: code only, and full URL
- Toast feedback: "Copied!" fades after 2s
- Join own session immediately via display name entry

---

## Story 2: Party Member — Join via Link

```
╔═══════════════════════════════════════════════════════════════╗
║  JOIN PARTY                                                   ║
║                                                               ║
║  Session code (from link):                                    ║
║  ╔══════════════════════════════════════════ read-only ═════╗ ║
║  ║  purple-falcon-bridge                                    ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  Your display name:                                           ║
║  [_____________________________________________]              ║
║                                                               ║
║  No account needed.                                           ║
║                                    [→ Enter Party]            ║
║                                    (disabled until name filled)
╚═══════════════════════════════════════════════════════════════╝
```

---

## Story 3: Party Member — Join via Code

```
╔═══════════════════════════════════════════════════════════════╗
║  JOIN PARTY                                                   ║
║                                                               ║
║  Session code:                                                ║
║  [type code: purple-falcon-bridge_____________________]       ║
║  Code is case-insensitive, hyphens optional                   ║
║                                                               ║
║  Your display name:                                           ║
║  [__________________________________________________]         ║
║                                                               ║
║  Error state:                                                 ║
║  ⚠ Session not found. Did you mean: purple-falcon-bridge?     ║
║                                                               ║
║                                    [→ Enter Party]            ║
╚═══════════════════════════════════════════════════════════════╝
```

- Both fields required; button disabled until both filled
- Errors shown inline, not modal
- Fuzzy-match hint on near-misses (optional)

---

## Story 4: Propose a Time (Negotiation Room, Detail)

```
LEFT COLUMN (sticky)           │  RIGHT COLUMN (live board)
───────────────────────────────┼────────────────────────────────
╔═══════════════════════════╗  │  ╔══════════════════════════╗
║  PICK A TIME               ║  │  ║  PARTY: purple-falcon    ║
║                             ║  │  ║  4 people               ║
║  [natural language input ]  ║  │  ╚══════════════════════════╝
║  [→ Parse]                  ║  │
║  ─────── or ───────         ║  │  ╔══════════════════════════╗
║  Date: [2026-03-21]         ║  │  ║  CURRENT PROPOSALS       ║
║  Time: [14:30      ]        ║  │  ║  ────────────────────     ║
║  TZ:   [GMT-0600 ▸]         ║  │  ║  Alice (EST)             ║
╚═══════════════════════════╝  │  ║  Fri, 3:00 PM             ║
                                │  ║                          ║
╔═══════════════════════════╗  │  ║  Bob (PST)               ║
║  RESULT                    ║  │  ║  Fri, 12:00 PM           ║
║  In 2d 14h 45m             ║  │  ║  ◉ YOUR PROPOSAL         ║
║  Local: Fri Mar 21 3:00 PM ║  │  ║                          ║
║  UTC:   Fri Mar 21 9:00 PM ║  │  ║  Dave (JST)              ║
╚═══════════════════════════╝  │  ║  ⏳ No proposal yet        ║
                                │  ║                          ║
                                │  ║  ⚠ 2 of 3 agree; waiting ║
                                │  ║    for Dave              ║
                                │  ╚══════════════════════════╝
                                │
                                │  [→ Propose This Time]
                                │  (sticky, always visible)
```

---

## Story 5: Convergence & Lock-In

```
                          ╔════════════════════════════════╗
                          ║   ✨ LOCKED IN! ✨              ║
                          ║                                ║
                          ║ Everyone agreed on:            ║
                          ║                                ║
                          ║ Friday, Dec 20, 2025           ║
                          ║ 3:00 PM EST / 8:00 PM UTC      ║
                          ║                                ║
                          ║ ✓ Alice  (EST)  3:00 PM        ║
                          ║ ✓ Bob    (PST) 12:00 PM        ║
                          ║ ✓ Casey  (CET)  9:00 PM        ║
                          ║                                ║
                          ╚════════════════════════════════╝
               (confetti rains down in background)

Export section slides in immediately below:
  [📋 Copy Link]  [Copy to Discord]  [📅 Calendar]
```

---

## Story 6: Late Joiner

```
RIGHT COLUMN: CURRENT PROPOSALS
════════════════════════════════════════════
  ⚠ You just joined  (badge, dismissible)
  You're not in the count yet — propose a time to join!
────────────────────────────────────────────
  Alice (EST)   Fri, 3:00 PM   ◉ active
  Bob   (PST)   Fri, 12:00 PM  ◉ active
  Carol (CET)   Fri, 9:00 PM   ◉ active
────────────────────────────────────────────
  ℹ️  3 people have proposed. Propose a matching time to agree.
════════════════════════════════════════════
```

- No reset; late joiner sees state immediately
- Warning badge until they submit their first proposal
- Proposal button is immediately active

---

## Story 7: Reconnecting State

```
PROPOSAL BOARD: State Transitions

[0s] Connection lost:
  Carol (CET)
  ⚠️ Connection lost...

[5s] Still gone:
  Carol (CET)
  🔄 Reconnecting... (30s grace)

[Success] Reconnects:
  Carol (CET)
  Fri, 9:00 PM       ← proposal restored
  ✓ Reconnected      ← fleeting toast, fades

[Timeout] Grace expires:
  Carol removed from list
  Participant count updates: "2 people now"
  If Carol was the only blocker → check lock-in condition
```

- All transitions are inline on the participant's card — no modal
- Other participants can continue proposing/updating during reconnection

---

# Part 4: Per-Story Wireframes — Mobile Web (375px)

*Thumb zone: top = hard to reach, bottom = easy.*
*On mobile, SHARE & EXPORT appears below RESULT in a single scrollable column. The COORDINATE section sits at the bottom of that stack.*

---

## Mobile Entry Points (from existing solo UI)

**Empty state** — COORDINATE section below RESULT:
```
┌─ 375px ───────────────────────────────┐
│ CollabTime              [America/Phx ▸]│  ← hard to reach
├────────────────────────────────────────┤
│                                        │
│  PICK A TIME                           │
│  ┌──────────────────────────────────┐  │
│  │ e.g. tomorrow at 3pm, ...        │  │
│  │  [Parse]                         │  │
│  │            or                    │  │
│  │  Date and time [_______________] │  │
│  └──────────────────────────────────┘  │
│                                        │
│  RESULT                                │
│  ┌──────────────────────────────────┐  │
│  │ Local time  — : —                │  │
│  │ UTC         — : —                │  │
│  └──────────────────────────────────┘  │
│                                        │
│  COORDINATE                            │
│  ┌──────────────────────────────────┐  │
│  │  [👥 Start a Party]              │  │  ← easy to reach
│  │  [🔗 Join a Party]               │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**With time selected** — COORDINATE appears after SHARE & EXPORT:
```
┌─ 375px ───────────────────────────────┐
│ CollabTime              [America/Phx ▸]│
├────────────────────────────────────────┤
│  PICK A TIME  [Nov 28 at 1:01 AM]     │
│  RESULT       [Ago 2668d · 1:01 AM]   │
│               ↑ existing content ↑    │
│  SHARE & EXPORT                        │
│  [http://…/?t=154…]         [copy]    │
│  [📅 Calendar]  [GCal]  [.ics]        │
│  [🎮 Discord timestamps          ▸]   │
│                                        │
│  COORDINATE                            │
│  ┌──────────────────────────────────┐  │
│  │  [👥 Start a Party]              │  │
│  │  Propose this time to your group │  │
│  │  [🔗 Join a Party]               │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Via shared link** — `?session=purple-falcon-bridge` skips solo mode and lands directly on the Join screen with code pre-filled. No scrolling, no COORDINATE section visible.

---

## Story 1: Create & Share (Mobile)

*Triggered by tapping [👥 Start a Party] in the COORDINATE section of solo mode.*

```
┌─ 375px ───────────────────────────────┐
│ CollabTime  ← purple-falcon-bridge    │  ← room code shown in header
│                              [Leave]  │  ← easy escape back to solo
├────────────────────────────────────────┤
│                                        │
│  YOUR SESSION CODE                     │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │    purple-falcon-bridge          │  │  ← monospace, large, high contrast
│  │                                  │  │
│  │  [Share ↗]        [Copy ✓]      │  │  ← native share sheet / clipboard
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Waiting for others to join…     │  │
│  │  0 people here                   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Your name:                            │
│  ┌──────────────────────────────────┐  │
│  │  [___________________________]   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  [Enter the Room]                │  │  ← easy to reach, thumb zone
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

- `[Share ↗]` opens native iOS/Android share sheet
- `[Copy]` copies code; "Copied!" fades after 2s
- Header shows room code and a `[Leave]` escape hatch back to solo mode
- "Enter the Room" disabled until name filled

---

## Story 2: Join via Link (Mobile)

*User taps a shared link (`?session=purple-falcon-bridge`). Solo mode is never shown — app detects the session param and goes straight to the join screen.*

```
┌─ 375px ───────────────────────────────┐
│ CollabTime              [America/Phx ▸]│
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ✓ Session found:                │  │
│  │    purple-falcon-bridge          │  │  ← read-only, confirmed
│  └──────────────────────────────────┘  │
│                                        │
│  What's your name?                     │
│  ┌──────────────────────────────────┐  │
│  │  [_______________________________]│  │
│  │  autocapitalize="off"            │  │
│  └──────────────────────────────────┘  │
│                                        │
│               (keyboard open area)     │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  [Join Party]                    │  │  ← stays above keyboard
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

- Code pre-filled and read-only from URL param — zero friction
- Name is the only thing to type; join button disabled until filled
- No solo mode content shown — this is the first thing the user sees

---

## Story 3: Join via Code (Mobile — Keyboard UX)

```
┌─ 375px ───────────────────────────────┐
│ [CollabTime]              [TZ ▼]      │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  Enter Party Code                │  │
│ │  Format: word-word-word          │  │
│ │  Example: purple-falcon-bridge   │  │
│ │                                  │  │
│ │  [purple-falcon-bridge_______]   │  │  ← auto-formats as user types
│ │  (autocorrect="off",             │  │
│ │   autocapitalize="off",          │  │
│ │   spellcheck="false")            │  │
│ │                                  │  │
│ │  Your name:                      │  │
│ │  [_______________________________] │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  [Join Party]                    │  │  ← thumb zone
│ └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Mobile code entry strategy (Recommended: auto-format single field)**
- User types `purplefalconbridge` → app auto-inserts hyphens
- Accepts case-insensitive input; normalizes to lowercase
- Visual confirmation: `✓ purple-falcon-bridge` in green once valid

---

## Story 4: Propose a Time (Mobile)

```
┌─ 375px ───────────────────────────────┐
│ [CollabTime]  purple-falcon-br  ●     │  ← connection dot
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  Propose a Time                  │  │
│ │  My TZ: America/New_York         │  │
│ │                                  │  │
│ │  [2026-03-21  14:30         ▼]  │  │  ← datetime-local (native picker)
│ │                                  │  │
│ │  → Fri, Mar 21 · 2:30 PM EDT    │  │
│ │    19:30 UTC · 20:30 CET         │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  Others' Proposals               │  │
│ │  ─────────────────────────────── │  │
│ │  Alex   3:30 PM EDT  ✓ matches   │  │
│ │  Bailey 7:30 PM EDT  ✗ differs   │  │
│ │  Casey  [no proposal]            │  │
│ │  ──────────────────────────────  │  │
│ │  2 of 3 agree                    │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  [Propose This Time]             │  │  ← sticky, easy to reach
│ │  48px height, full width         │  │
│ └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Button states:
```
DEFAULT:  [Propose This Time]  (indigo)
LOADING:  [⟳ Proposing...]    (gray, disabled)
SUCCESS:  [✓ Proposed]        (green, 2s then reverts)
CHANGED:  [Propose This Time]  (indigo, re-enabled)
```

---

## Story 5: Lock-In (Mobile)

```
┌─ 375px ───────────────────────────────┐
│ [CollabTime]              [TZ ▼]      │
│                                        │
│  ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨      │  ← confetti (2s, reduced-motion aware)
│                                        │
│ ┌──────────────────────────────────┐  │
│ │       🎉 YOU'RE IN! 🎉           │  │
│ │                                  │  │
│ │  Saturday, March 21, 2026        │  │
│ │  14:30 EDT (Your TZ)             │  │
│ │  ═══════════════════════════     │  │
│ │  ✓ You      14:30 EDT            │  │
│ │  ✓ Alex     15:30 CDT            │  │
│ │  ✓ Bailey   19:30 GMT            │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  Copy to Discord:                │  │
│ │  [Full Format  <t:17110...:F>] [Copy] │
│ │  [Short Time   <t:17110...:t>] [Copy] │
│ │  [Deep Link    collabtime.app] [Copy] │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  [Share]    [Discord]            │  │  ← thumb zone
│ └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Story 6: Late Joiner (Mobile)

```
┌─ 375px ───────────────────────────────┐
│ [CollabTime]  purple-falcon-br        │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  ⚠ You just joined               │  │
│ │  Propose a time to be counted    │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  Most others have proposed:      │  │
│ │  Saturday, March 21 · 14:30 EDT  │  │
│ │  3 people agree ✓                │  │
│ │                                  │  │
│ │  [I agree — propose 14:30 EDT]   │  │  ← shortcut button
│ │  ─────── OR ────────             │  │
│ │  [Propose Different Time]        │  │
│ └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- Shortcut "I agree" button pre-fills the picker with the consensus time
- Late joiner's participation adds them to the count; if they match → may trigger lock-in

---

## Story 7: Reconnecting State (Mobile)

```
┌─ 375px ───────────────────────────────┐
│ [CollabTime]  purple-falcon-br  🔄    │  ← subtle reconnecting indicator in header
│                                        │
│ ╔══════════════════════════════════╗  │
│ ║  🔄 Reconnecting...              ║  │  ← amber banner, non-blocking
│ ║  Your proposals are preserved    ║  │
│ ╚══════════════════════════════════╝  │
│                                        │
│ [Normal proposals board, still visible]│
│                                        │
│ [Propose This Time] — still enabled   │  ← queue proposals; send on reconnect
└─────────────────────────────────────────┘
```

On reconnect:
```
│ ╔══════════════════════════════════╗  │
│ ║  ✓ Reconnected                   ║  │  ← green, auto-dismisses 2s
│ ╚══════════════════════════════════╝  │
```

On timeout (grace period expired):
```
│ ╔══════════════════════════════════╗  │
│ ║  ✗ Connection failed             ║  │  ← red
│ ║  [Rejoin Session]                ║  │
│ ╚══════════════════════════════════╝  │
```

---

# Appendix: Mobile-Specific Interaction Notes

## Code Entry on Mobile Keyboard

Input attributes to prevent autocorrect:
```html
<input
  type="text"
  autocapitalize="off"
  autocorrect="off"
  spellcheck="false"
  inputmode="text"
/>
```

Auto-format strategy (recommended):
- User types `purplefalconbridge` → JS detects word boundaries → inserts hyphens
- Normalizes to lowercase on blur
- Accepts with or without hyphens, with or without spaces

## Sticky CTA Above Keyboard

```
Keyboard open → viewport shrinks → CTA must stay visible
Use: position: fixed; bottom: env(safe-area-inset-bottom)
On input focus: setTimeout(() => cta.scrollIntoView(), 100)
```

## Connection Status Indicator

Always visible in header:
- `●` green = connected
- `🔄` amber = reconnecting (animated spin)
- `✗` red = failed, tap to retry

Non-blocking. Never a modal for connection state.

## Touch Target Minimums

- All buttons: `min-height: 44px`
- All tappable areas: `min-width: 44px`
- Copy buttons on Discord export: full row is tappable, not just the button

## Confetti Animation

```css
@media (prefers-reduced-motion: reduce) {
  .confetti { display: none; }
}
```
