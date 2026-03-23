# CollabTime — Party System: Privacy & Security Analysis

> **Status:** Complete — decisions captured
> **Last updated:** 2026-03-21
> **Companion docs:** `party-system-ux.md`, `party-system-wireframes.md`

---

## Scope

Users of CollabTime may not want others to know where they live (timezone = location signal) or accidentally reveal their real name. This document captures the full risk surface from a privacy and security review, plus the product decisions made to address each risk.

---

## Confirmed Decisions

| Decision | Answer |
|---|---|
| Timezone visibility to other participants | **Hidden** — each viewer sees proposed times in their own timezone only; no timezone labels shown to others |
| Display names | **Auto-generated random nickname** (e.g. "Teal Fox", "Quick River"); fixed for session duration (re-roll dropped in MVP); no user-typed names |
| Room access control | **Open always** — anyone with the code can join; 64B-combination passphrase is the access control |
| Server-side logging | **Minimal operational only** — errors and anonymized connection events; no names, proposed times, or timezones persisted |
| Reconnection authentication | **Server-issued session token** — stored in `sessionStorage`; reconnect sends token to reclaim slot; hijack-resistant |

---

## Risk Register

### High Priority (Design Changes Required)

#### 1. Timezone leakage → location inference
**Severity:** High → **Resolved by decision**

Each participant's timezone is a reliable proxy for geographic location (narrows to within a few hundred miles). The original wireframes showed `"Sarah (EST)"`, `"Dave (JST)"` next to every proposal.

**Decision:** Hide all timezone labels from the proposals board. Every participant sees proposed times converted into their own local timezone. The server knows each participant's timezone for conversion purposes only; it is never broadcast to other clients.

**UX change required:** Proposals board entry format changes from:
```
Sarah (EST)
Fri, 3:00 PM
```
to:
```
Sarah
Fri, 3:00 PM   ← in the viewer's own timezone
```

---

#### 2. Display name as PII vector
**Severity:** High → **Resolved by decision**

Free-text display names lead users to enter real names, email handles, or workplace identifiers without realizing these are visible to all room members.

**Decision:** Auto-generate an anonymous nickname on join (two-word animal/color combos or similar wordlist). No free-text name entry. Nickname is fixed for the duration of the session — re-roll is dropped in MVP.

**UX change required:** Replace the "Your display name:" text input with a static nickname display:
```
Your nickname this session:
  Teal Fox
```

---

### Medium Priority (Technical Fixes)

#### 3. Session hijacking via reconnection
**Severity:** Medium-High → **Resolved by decision**

If reconnection is validated only by [display name + room code], an attacker who knows a participant's auto-generated nickname can wait for a disconnect and reclaim the slot during the 30s grace period.

**Decision:** Server issues an opaque session token on join. Token is stored in `sessionStorage` (not `localStorage` — cleared on tab close). Reconnect sends the token; the server validates it before restoring the slot. The token is not transmitted in URLs.

**Implementation notes:**
- Token: cryptographically random, 128-bit minimum
- Stored in `sessionStorage` only (cleared when tab closes)
- Never appears in URLs, logs, or shareable links
- Grace period clock starts when WebSocket drops; token must arrive within 30s to reclaim slot

---

#### 4. Room code enumeration
**Severity:** Medium → **Partially mitigated by design**

The 3-word passphrase (~64 billion combinations) is strong, but without rate limiting a distributed attacker could discover active rooms.

**Decision:** Server-side rate limiting is required (not a UX decision). The agreed approach is:
- Max 10 failed join attempts per IP per 5 minutes
- Exponential backoff after 3 failures
- No feedback distinguishing "wrong code" from "room expired" (prevents oracle attacks)
- Active session count is never exposed publicly

---

#### 5. Input validation / display name sanitization
**Severity:** Low → **Resolved by auto-generated names**

With auto-generated nicknames, the XSS/layout-break vector from user-typed names is eliminated. The nickname wordlist is server-controlled; no user input reaches the display name field.

**Residual:** Any other user-supplied inputs (room code entry field on join) must still be sanitized. Enforce max length (30 chars) and format validation (three lowercase words separated by hyphens).

---

### Low Priority (Informational / UX Improvements)

#### 6. URL leakage of confirmed time
**Severity:** Low-Medium → **Accepted**

The post-lock-in deep link (`?t=1711006400`) encodes the confirmed Unix timestamp. This can be shared in Slack/Discord/email logs. The timestamp alone does not identify any participant; it only reveals the agreed meeting time, which is the intended purpose of sharing.

**Decision:** Accepted as-is. The URL contains no names, timezones, or room codes. Users are sharing the time intentionally.

**Optional UX note:** Consider adding a brief label on the copy button: "Share the time (not names or locations)" to make the privacy properties explicit.

---

#### 7. Implicit presence leakage
**Severity:** Medium → **Accepted with mitigation**

Joining a room reveals your presence (under your auto-generated nickname) to all current members. No waiting room or invisible mode.

**Decision:** Accepted. The room code is the access control; if you have the code, you are expected to be there. Auto-generated nicknames mean presence leaks the nickname, not a real identity.

---

#### 8. Session data retention ambiguity
**Severity:** Medium → **Resolved by logging decision**

Unclear what the server retains after sessions expire.

**Decision:** Minimal operational logs only — errors and anonymized connection events. No names, proposed times, or timezones written to persistent logs. Session state is in-memory only; lost on server restart or 2hr idle expiry.

**Implementation note:** Confirm with infrastructure: structured logging pipelines (e.g. Datadog, CloudWatch) should be configured to exclude or scrub session payload fields.

---

#### 9. No privacy disclosure to users
**Severity:** Low-Medium → **Address with minimal copy**

Users have no indication of what the server sees or how long data is retained.

**Decision:** Add a single line of footer copy to the join screen:
> "Nicknames and proposals exist only during the session. Nothing is stored after it ends."

No full privacy policy required at this stage.

---

## What Changes in the Wireframes

The following wireframe elements need updating based on these decisions:

| Element | Old | New |
|---|---|---|
| Proposals board participant label | `Sarah (EST)` | `Teal Fox` (nickname only, no timezone) |
| Proposals board time display | Time in participant's TZ + TZ label | Time in **viewer's** TZ, no TZ label |
| Join screen name input | Free text "Your display name:" | Auto-generated nickname (static, no re-roll in MVP) |
| Post lock-in export URL | No privacy note | Optional: "Sharing the time only — no names or locations" |
| Join screen (any) | No privacy notice | One-line footer: "Nicknames and proposals exist only during the session." |

---

## What Does NOT Change

- Room code format (3-word passphrase, ~64B combinations)
- Ephemeral sessions (~2hr idle expiry)
- No accounts, no login
- Open room access (anyone with code can join)
- WebSocket relay server model
- Post lock-in read-only export screen
- Solo mode is completely unchanged

---

## Open Technical Items (Not UX Decisions)

These require implementation decisions but are not product UX questions:

| Item | Recommendation |
|---|---|
| Session token storage | `sessionStorage` (not `localStorage`) — cleared on tab close |
| Token entropy | 128-bit cryptographically random |
| Rate limiting | 10 failed joins per IP per 5 min; exponential backoff after 3 |
| Log scrubbing | Confirm logging pipelines exclude session payload fields |
| HTTPS enforcement | Required — all WebSocket connections via `wss://`, all HTTP via HTTPS |
| Nickname wordlist | Curated server-side; no offensive terms; ~1000 adjectives × ~1000 nouns = 1M combinations |
