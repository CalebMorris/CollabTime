# Jackbox Multi-Device Communication: Architecture Research

## Background

Jackbox Games (Party Pack series) allows a host device (PC, console, smart TV) to run a game while players join from their phones or other browsers — no app installation required. The host screen is shared (typically via a TV or screen share), and all interaction from players happens through a lightweight web client.

This document surveys how Jackbox achieves this, based on community reverse engineering and any available official sources. Jackbox has **not published an official technical specification**.

---

## How Jackbox Actually Works (Reverse-Engineered)

**Sources:** Community WebSocket traffic analysis, GitHub repos (`johnbox`, `jackboxapi-re`, `JackboxGPT3`), AWS blog posts.

### Room Code Flow

1. Host launches a game; the game contacts Jackbox's server to **allocate a session** and receives a 4-letter room code.
2. The room code is displayed on the host screen.
3. Players navigate to `jackbox.tv`, enter the code and a nickname.
4. The browser opens a **persistent WebSocket connection** to `ecast.jackboxgames.com` (or the older Blobcast endpoint).
5. The host also connects via WebSocket and is granted host-level authority over the room.
6. All messages between host and players flow through Jackbox's relay servers — the host and players never connect directly to each other.

### Message Format (JSON over WebSocket)

```json
{
  "seq": 42,
  "opcode": "text",
  "body": {
    "key": "bc:room",
    "val": { ... }
  }
}
```

- `seq` — sequence number for ordering
- `opcode` — operation type (game-specific; e.g., `text`, `object`, `bc:room`)
- `body` — payload (varies per game and event)

### API Versions

| Era | Protocol | Endpoint |
|---|---|---|
| Party Pack 1–5 | Blobcast (Socket.io / v1) | `blobcast.jackboxgames.com` |
| Party Pack 6+ | Ecast v2 (raw WebSocket) | `ecast.jackboxgames.com` |

---

## Solution 1: WebSocket Relay Server (Blobcast / Ecast v1)

### Summary

The original Jackbox approach. A central relay server brokers all messages between the host game process and player browsers using **Socket.io** (which itself runs over WebSockets with HTTP long-poll fallback). The host and players never talk to each other directly — everything is routed through the relay.

This is the pattern used in Party Pack 1–5 and is what most community clone frameworks replicate.

### Pros

- Simple mental model: one server, one source of truth
- Socket.io provides automatic reconnection, heartbeats, and fallback to polling
- Works behind firewalls and NAT (players only need outbound port 443)
- Easy to scale horizontally with sticky sessions or Redis pub/sub adapter
- Supported by `socket.io` on Node.js, with client libraries for every major platform

### Cons

- All traffic flows through your server — bandwidth and compute cost scale with player count
- Socket.io adds overhead vs. raw WebSockets (framing, namespaces, events)
- Requires always-on server infrastructure; no peer-to-peer option
- Socket.io v2/v3/v4 breaking changes have historically caused compatibility headaches
- Blobcast is deprecated by Jackbox themselves

---

## Solution 2: Ecast API v2 (Modern WebSocket Hub)

### Summary

Jackbox's current production system, introduced around Party Pack 6–7. A raw WebSocket API (no Socket.io) at `ecast.jackboxgames.com`. The room code maps to a server-managed room object. Both the host and players connect as WebSocket clients; the server routes messages based on room membership and role (host vs. player).

Community implementation: [`johnbox`](https://github.com/InvoxiPlayGames/johnbox) — a Node.js private server that reimplements the Ecast v2 protocol, demonstrating it's fully self-hostable.

### Pros

- Raw WebSockets = lower overhead than Socket.io
- Structured JSON protocol with sequence numbers and opcodes is easy to parse and debug
- Self-hostable (demonstrated by `johnbox`)
- Supports audience mode (spectators beyond the player cap)
- Clean separation of host vs. player roles at the protocol level

### Cons

- No official spec; derived entirely from reverse engineering
- Breaking changes between game titles (each game uses different opcodes)
- Requires always-on server; same infrastructure cost model as v1
- No built-in fallback to long-polling — older or restrictive networks may have issues
- Protocol stability not guaranteed (Jackbox can change it silently)

---

## Solution 3: WebRTC Peer-to-Peer

### Summary

A community-hypothesized alternative: use **WebRTC Data Channels** to establish direct browser-to-browser connections between the host and each player, eliminating the need for a relay server for game data. A lightweight **signaling server** (WebSocket or HTTP) is still needed for the initial handshake, but ongoing game traffic flows peer-to-peer.

This approach is not used by Jackbox but appears frequently in Unity forum threads and indie dev discussions as a lower-cost alternative.

### Pros

- No relay server for game data — dramatically lower bandwidth costs at scale
- Lower latency (no relay hop) when peers are geographically close
- Built-in encryption (DTLS/SRTP)
- Works in all modern browsers natively

### Cons

- NAT traversal is complex; requires STUN/TURN servers — TURN is a relay fallback that reintroduces server cost
- Corporate firewalls and restrictive networks (hotels, schools) often block WebRTC
- Host device (PC/console) must be a browser or support a WebRTC library — native game engines need plugins (e.g., `webrtc-for-the-curious`)
- Peer connection management is significantly more complex than WebSocket relay
- Not suitable when the host is a native app on a console (PS5, Xbox, etc.)

---

## Solution 4: HTTP Long Polling

### Summary

The oldest and most compatible approach. Players repeatedly send HTTP requests to a server, which holds the connection open until there is new data to return (or a timeout). Upon receiving a response, the client immediately issues a new request. Effectively simulates push notifications over plain HTTP.

Socket.io uses this as a fallback. It was Jackbox's implied fallback path in the Blobcast era.

### Pros

- Works everywhere — any HTTP client, any network, any firewall
- Extremely simple to implement on the server side
- No special infrastructure beyond a standard HTTP server
- Easy to debug with standard browser dev tools

### Cons

- High latency compared to WebSockets — each poll cycle adds a round trip
- Server holds many open connections, consuming threads/file descriptors
- Not suitable for high-frequency updates (drawing strokes, real-time text collaboration)
- Wastes bandwidth on empty poll responses
- Modern alternatives (WebSockets, SSE) are strictly better for new projects

---

## Solution 5: Server-Sent Events (SSE)

### Summary

A lesser-discussed alternative. The server pushes events to clients over a persistent HTTP connection using `text/event-stream`. Clients send inputs via regular HTTP POST. This gives server→client push without the bidirectionality of WebSockets.

Not used by Jackbox, but proposed in some indie dev circles as a simpler alternative when full duplex is not strictly needed.

### Pros

- Simpler than WebSockets — standard HTTP, works through most proxies
- Automatic reconnection built into the browser `EventSource` API
- Easy to implement on top of any HTTP framework
- Lower server overhead than WebSockets for many concurrent read-heavy connections

### Cons

- Unidirectional (server → client only); player inputs must use separate HTTP requests — adds latency
- Not all proxies handle long-lived streaming connections well
- IE/Edge Legacy had no native support (less relevant now)
- Combining SSE for push + REST for input creates a split-protocol system that's harder to reason about
- Jackbox-style drawing or text collaboration would be awkward to implement

---

## Solution 6: Cloud Game Streaming (Amazon GameLift Streams)

### Summary

Jackbox's newest architectural addition, announced in 2024. Rather than requiring users to own a console or PC to run the host game, **the host game itself runs in the cloud** and is streamed to any device via GameLift Streams. Players still use `jackbox.tv` as before; only the host side changes — it becomes a cloud-rendered video stream.

Blog post: [Jackbox Games unlocks new opportunities with Amazon GameLift Streams](https://aws.amazon.com/blogs/gametech/jackbox-games-unlocks-new-opportunities-with-amazon-gamelift-streams/)

### Pros

- No host device required — lowers the barrier to play (no PC/console needed)
- Single GameLift Streams instance can run multiple simultaneous Jackbox games (low GPU demand)
- Jackbox's existing game builds run unmodified
- Scales with AWS infrastructure globally

### Cons

- Adds cloud compute cost for every hosted session (GPU/CPU hours)
- Introduces video streaming latency on top of existing network latency
- Requires robust video encoding pipeline (H.264/H.265) and CDN delivery
- Complex failure surface: video stream issues compound with WebSocket issues
- Overkill for most indie developers trying to replicate the Jackbox pattern

---

## Comparison Table

| Solution | Latency | Infra Cost | Complexity | Firewall Friendly | Used by Jackbox |
|---|---|---|---|---|---|
| WebSocket Relay (Blobcast/v1) | Low | Medium | Low | Yes | Yes (legacy) |
| Ecast v2 WebSocket Hub | Low | Medium | Medium | Yes | Yes (current) |
| WebRTC Peer-to-Peer | Lowest | Low (+ TURN) | High | Partial | No |
| HTTP Long Polling | High | Low | Very Low | Yes | Fallback only |
| Server-Sent Events | Medium | Low | Medium | Mostly | No |
| GameLift Streams | Medium+ | High | Very High | Yes | Yes (new) |

---

## References

- [Jackbox Games – How to Play](https://www.jackboxgames.com/how-to-play)
- [AWS Blog – Jackbox Games unlocks new opportunities with Amazon GameLift Streams](https://aws.amazon.com/blogs/gametech/jackbox-games-unlocks-new-opportunities-with-amazon-gamelift-streams/)
- [Jackbox Engineering Blog – Behind the Scenes of Party Pack 10](https://www.jackboxgames.com/blog/behind-the-scenes-of-pp10-engineering)
- [GitHub – InvoxiPlayGames/johnbox (Ecast v2 private server)](https://github.com/InvoxiPlayGames/johnbox)
- [GitHub – SergeyMC9730/jackboxapi-re (protocol reverse engineering)](https://github.com/SergeyMC9730/jackboxapi-re)
- [GitHub – tjhorner/JackboxGPT3 (bot that plays Jackbox via WebSocket)](https://github.com/tjhorner/JackboxGPT3)
- [GitHub – hammre/party-box (Jackbox-style game framework)](https://github.com/hammre/party-box)
- [GitHub – axlan/jill_box (React + Python WebSocket clone)](https://github.com/axlan/jill_box)
- [Robopenguins – Lying Game with React and WebSockets](https://www.robopenguins.com/react-websockets-lying-game/)
- [Unity Forums – Connecting browser clients to Unity for a Jackbox style game](https://forum.unity.com/threads/connecting-browser-clients-to-unity-for-a-jackbox-style-game.605320/)
- [StackShare – Jackbox Games tech stack](https://stackshare.io/companies/jackbox-games)
