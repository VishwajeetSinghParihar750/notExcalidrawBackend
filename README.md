# notExcalidrawBackend

WebSocket backend for [notExcalidraw](https://github.com/VishwajeetSinghParihar750/notExcalidraw) — handles real-time collaboration rooms, shape event sync, and live cursor presence.

**Frontend:** [notExcalidraw](https://github.com/VishwajeetSinghParihar750/notExcalidraw) · **Live demo:** [not-excalidraw.vercel.app](https://not-excalidraw.vercel.app)

## What it does

- **Room management** — create and join collaboration rooms by ID
- **Event sync** — broadcast shape create/update/delete events to all players in a room
- **State bootstrap** — room owner uploads initial canvas state when creating a room; joiners receive the full event log
- **Cursor presence** — relay player cursor positions with randomly assigned display names
- **Validation** — all incoming messages validated with Zod schemas

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| WebSocket | `ws` |
| Validation | Zod |
| Language | TypeScript |

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
git clone https://github.com/VishwajeetSinghParihar750/notExcalidrawBackend.git
cd notExcalidrawBackend
npm install
npm run dev
```

The server listens on port **3001** by default.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | WebSocket server port |

### Connect the frontend

In the [notExcalidraw](https://github.com/VishwajeetSinghParihar750/notExcalidraw) repo, set:

```env
VITE_BACKEND_WEBSOCKET_URL=ws://localhost:3001
```

Then run the frontend with `npm run dev` and use the share button to start a collab session.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |

## Docker

```bash
docker build -t notexcalidraw-backend .
docker run -p 3001:3001 notexcalidraw-backend
```

## Architecture

```
WebSocketServer (index.ts)
  └── rooms: Record<roomId, Room>
        ├── players[]          — connected WebSocket clients
        ├── events[]           — ordered shape update event log
        ├── perShapeEvents{}   — events grouped by shape ID
        └── playerNames{}      — display name → WebSocket mapping
```

### Room lifecycle

1. **Create** — client sends `{ roomId: null, payload: { type: "createRoom" } }`; server creates a room and asks the owner for initial state via `getCurrentState`
2. **Init** — owner responds with `setCurrentState` containing serialized shape events; room becomes `active`
3. **Join** — other clients send `joinRoom`; server sends back the full event log and existing player cursors
4. **Sync** — clients send `addEvent` for local changes; server validates, appends, and broadcasts `eventAdded` to all players
5. **Close** — when the last player disconnects, the room is marked closed and deleted after 5 minutes

### Message protocol

All client messages follow this envelope:

```json
{
  "roomId": "<uuid or null>",
  "payload": { "type": "...", ... }
}
```

Client → server payload types: `createRoom`, `joinRoom`, `setCurrentState`, `addEvent`, `playerPositionUpdate`

Server → client message types: `roomJoined`, `getCurrentState`, `setCurrentState`, `eventAdded`, `addEventFailed`, `playerPositionUpdate`, `playerDisconnected`, `clientError`, `serverError`

Schemas are defined in `types/zodSchemas.ts` (mirrored on the frontend in `src/types/wsZodSchemas.ts`).

## Project structure

```
├── index.ts           # WebSocket server entry point
├── classes/
│   └── Room.ts        # Room state, event handling, player management
├── types/
│   └── zodSchemas.ts  # Message and shape event validation
└── utils/
    └── playerName.ts  # Random adjective + noun name generator
```

## Acknowledgements

Built as the collaboration backend for [notExcalidraw](https://github.com/VishwajeetSinghParihar750/notExcalidraw), an Excalidraw-inspired whiteboard.
