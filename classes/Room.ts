import z from "zod";
import WebSocket from "ws";
import {
  joinRoomPayload,
  shapeUpdateEventPayload,
  webSocketMessagePayload,
} from "../types/zodSchemas";

export type RoomId = string;
type eventType = z.infer<typeof shapeUpdateEventPayload>;

type RoomState = "waitingForInitEvents" | "active" | "closed";

export default class Room {
  roomId: RoomId;
  roomState: RoomState = "closed";

  owner: WebSocket | null;
  players: WebSocket[];
  shapes: Set<string> = new Set();

  addEvents: eventType[] = [];
  events: eventType[] = []; // this is not necessary but keeping for ease rn
  perShapeEvents: Record<string, eventType[]> = {};

  addPlayer(ws: WebSocket, isOwner = false) {
    ws.on("close", (code, reason) => {
      console.log("some guy disconnected");
      this.players = this.players.filter((webs) => webs != ws);
      if (isOwner) {
        this.owner = null;
        if (this.roomState == "waitingForInitEvents") {
          this.roomState = "active"; // careful people might lose local state
        }
      }
    });
  }

  sendMessage(ws: WebSocket, data: any) {
    console.log("sending : ", data);
    ws.send(JSON.stringify(data));
  }
  setupRoom(ws: WebSocket) {
    this.addPlayer(ws, true);
    this.sendMessage(ws, {
      type: "getCurrentState",
    });

    this.roomState = "waitingForInitEvents";
  }

  constructor(roomId: RoomId, owner: WebSocket) {
    this.roomId = roomId;
    this.owner = owner;
    this.players = [owner];
    this.setupRoom(owner);
  }

  addNewEvent(event: eventType): string | null {
    let prevEventId;
    if (event.eventType == "addShape") {
      if (this.addEvents.length > 0)
        prevEventId = this.addEvents[this.addEvents.length - 1]._id;
      else prevEventId = null;
    } else {
      prevEventId =
        this.perShapeEvents[event.shapeId][
          this.perShapeEvents[event.shapeId].length - 1
        ]._id;
    }

    this.events.push(event);

    if (!this.perShapeEvents[event.shapeId])
      this.perShapeEvents[event.shapeId] = [];
    this.perShapeEvents[event.shapeId].push(event);

    if (event.eventType == "deleteShape") {
      this.shapes.delete(event.shapeId);
    }

    if (event.eventType == "addShape") {
      this.shapes.add(event.shapeId);
      this.addEvents.push(event);
    }

    return prevEventId;
  }
  broadcastEvent(ev: eventType, prevEventId: string | null) {
    this.players.forEach((ws) =>
      this.sendMessage(ws, {
        type: "eventAdded",
        payload: {
          addedEvent: ev,
          prevEventId,
        },
      }),
    );
  }

  canAddEvent(event: z.infer<typeof shapeUpdateEventPayload>): boolean {
    switch (event.eventType) {
      case "addShape":
        return !this.shapes.has(event.shapeId);
      case "deleteShape":
        return this.shapes.has(event.shapeId);
      case "updateEnclosingRectangle":
        return this.shapes.has(event.shapeId);
      case "updateProperty":
        return this.shapes.has(event.shapeId);
      default:
        return false;
    }
  }

  handleEvent(ws: WebSocket, event: z.infer<typeof shapeUpdateEventPayload>) {
    if (this.canAddEvent(event)) {
      let prevEventId = this.addNewEvent(event);
      this.broadcastEvent(event, prevEventId);
    } else
      this.sendMessage(ws, {
        type: "addEventFailed",
        payload: {
          addEventId: event._id,
        },
      });
  }

  handleJoinRoom(ws: WebSocket, payload: z.infer<typeof joinRoomPayload>) {
    this.addPlayer(ws);
    this.sendMessage(ws, {
      type: "setCurrentState",
      payload: {
        events: this.events,
      },
    });
    this.sendMessage(ws, {
      type: "roomJoined",
    });
  }
  handleInvalidMessage(ws: WebSocket) {
    this.sendMessage(ws, {
      type: "clientError",
      payload: {
        message: "invalid request",
      },
    });
  }

  setInitialEvents(events: eventType[]) {
    events.forEach((ev) => {
      this.addNewEvent(ev);
    });
  }
  handleMessage(
    ws: WebSocket,
    message: z.infer<typeof webSocketMessagePayload>,
  ) {
    if (
      this.roomState == "waitingForInitEvents" &&
      message.type == "setCurrentState" &&
      ws == this.owner
    ) {
      this.setInitialEvents(message.payload.events);
      this.roomState = "active";
      this.sendMessage(ws, { type: "roomJoined" });
      return;
    }
    //
    if (this.roomState != "active") {
      this.sendMessage(ws, {
        type: "serverError",
        payload: {
          message: `room is in ${this.roomState} state`,
        },
      });
      return;
    }

    switch (message.type) {
      case "addEvent":
        this.handleEvent(ws, message.payload);
        break;
      case "joinRoom":
        this.handleJoinRoom(ws, message.payload);
        break;

      default:
        this.handleInvalidMessage(ws);
        break;
    }
  }
}
