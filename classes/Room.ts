import z from "zod";
import WebSocket from "ws";
import {
  playerPositionUpdatePayload,
  shapeUpdateEventPayload,
  webSocketMessagePayload,
} from "../types/zodSchemas";
import { getRandomPlayerName } from "../utils/playerName";

export type RoomId = string;
type eventType = z.infer<typeof shapeUpdateEventPayload>;

type RoomState = "waitingForInitEvents" | "active" | "closed";

export default class Room {
  roomId: RoomId;
  roomState: RoomState = "closed";

  onCloseCallback: ( roomId: RoomId ) => void;
  owner: WebSocket | null;
  players: WebSocket[] = [];
  playerNames: Record<string, WebSocket> = {};
  playerCursorPositions: Record<string, { x: number; y: number }> = {};

  shapes: Set<string> = new Set();

  addEvents: eventType[] = [];
  events: eventType[] = []; // this is not necessary but keeping for ease rn
  perShapeEvents: Record<string, eventType[]> = {};

  addPlayer( ws: WebSocket, isOwner = false ) {
    this.players.push( ws );

    ws.on( "close", ( code, reason ) => {
      // console.log("some guy disconnected");

      let playerName = null;

      for ( let key in this.playerNames ) {
        if ( this.playerNames[key] == ws ) {
          playerName = key;
          break;
        }
      }

      this.players = this.players.filter( ( webs ) => webs != ws );
      if ( isOwner ) {
        this.owner = null;
        if ( this.roomState == "waitingForInitEvents" ) {
          this.roomState = "active"; // careful people might lose local state
        }
      }
      if ( playerName ) {
        Object.values( this.playerNames ).forEach( ( player ) => {
          this.sendMessage( player, {
            type: "playerDisconnected",
            payload: { playerName },
          } );
        } );
        delete this.playerNames[playerName];
        delete this.playerCursorPositions[playerName];

        if ( this.players.length == 0 ) {
          this.roomState = "closed";
          this.onCloseCallback( this.roomId );
        }
      }
    } );
  }

  sendMessage( ws: WebSocket, data: any ) {
    // console.log("sending : ", data);
    ws.send( JSON.stringify( data ) );
  }
  setupRoom( ws: WebSocket ) {
    this.addPlayer( ws, true );
    this.sendMessage( ws, {
      type: "getCurrentState",
      payload: {
        roomId: this.roomId,
      },
    } );

    this.roomState = "waitingForInitEvents";
  }

  constructor(
    roomId: RoomId,
    owner: WebSocket,
    onCloseCb: ( roomId: RoomId ) => void,
  ) {
    this.onCloseCallback = onCloseCb;

    this.roomId = roomId;
    this.owner = owner;

    this.setupRoom( owner );
  }

  addNewEvent( event: eventType ): string | null {
    let prevEventId;
    if ( event.eventType == "addShape" ) {
      if ( event.payload.shape.shapeType == "text" ) {
        event.payload.shape.curState = "render";
      }

      if ( this.addEvents.length > 0 )
        prevEventId = this.addEvents[this.addEvents.length - 1]._id;
      else prevEventId = null;
    } else {
      // make this more robust check for text specifically
      if (
        event.eventType == "updateProperty" &&
        event.payload.curState == "edit"
      )
        event.payload.curState = "render";

      prevEventId =
        this.perShapeEvents[event.shapeId][
          this.perShapeEvents[event.shapeId].length - 1
        ]._id;
    }

    this.events.push( event );

    if ( !this.perShapeEvents[event.shapeId] )
      this.perShapeEvents[event.shapeId] = [];
    this.perShapeEvents[event.shapeId].push( event );

    if ( event.eventType == "deleteShape" ) {
      this.shapes.delete( event.shapeId );
    }

    if ( event.eventType == "addShape" ) {
      this.shapes.add( event.shapeId );
      this.addEvents.push( event );
    }

    return prevEventId;
  }
  broadcastEvent( ev: eventType, prevEventId: string | null ) {
    this.players.forEach( ( ws ) =>
      this.sendMessage( ws, {
        type: "eventAdded",
        payload: {
          addedEvent: ev,
          prevEventId,
        },
      } ),
    );
  }

  canAddEvent( event: z.infer<typeof shapeUpdateEventPayload> ): boolean {
    switch ( event.eventType ) {
      case "addShape":
        return !this.shapes.has( event.shapeId );
      case "deleteShape":
        return this.shapes.has( event.shapeId );
      case "updateEnclosingRectangle":
        return this.shapes.has( event.shapeId );
      case "updateProperty":
        return this.shapes.has( event.shapeId );
      default:
        return false;
    }
  }

  handleEvent( ws: WebSocket, event: z.infer<typeof shapeUpdateEventPayload> ) {
    if ( this.canAddEvent( event ) ) {
      let prevEventId = this.addNewEvent( event );
      this.broadcastEvent( event, prevEventId );
    } else
      this.sendMessage( ws, {
        type: "addEventFailed",
        payload: {
          addEventId: event._id,
        },
      } );
  }

  assignNameToWebsocket( ws: WebSocket ): string {
    let newPlayerName = getRandomPlayerName();
    while ( this.playerNames[newPlayerName] ) {
      newPlayerName = getRandomPlayerName();
    }
    this.playerCursorPositions[newPlayerName] = { x: 0, y: 0 };
    this.playerNames[newPlayerName] = ws;
    return newPlayerName;
  }

  handlePlayerPositionUpdate(
    ws: WebSocket,
    payload: z.infer<typeof playerPositionUpdatePayload>,
  ) {
    let playerName = Object.keys( this.playerNames ).find(
      ( key ) => this.playerNames[key] == ws,
    );

    if ( !playerName ) return;

    Object.keys( this.playerNames ).forEach( ( player ) => {
      if ( ws != this.playerNames[player] ) {
        this.sendMessage( this.playerNames[player], {
          type: "playerPositionUpdate",
          payload: {
            playerName: playerName,
            playerPosition: payload.playerPosition,
          },
        } );
      } else {
        this.playerCursorPositions[player] = payload.playerPosition;
      }
    } );
  }

  handleJoinRoom( ws: WebSocket ) {
    if ( this.roomState == 'closed' ) this.roomState = 'active'

    this.addPlayer( ws );
    this.sendMessage( ws, {
      type: "setCurrentState",
      payload: {
        events: this.events,
        players: Object.keys( this.playerCursorPositions ).map( ( key ) => {
          return {
            playerName: key,
            playerPosition: this.playerCursorPositions[key],
          };
        } ),
      },
    } );

    this.assignNameToWebsocket( ws );
    this.sendMessage( ws, {
      type: "roomJoined",
      payload: {
        roomId: this.roomId,
      },
    } );
  }
  handleInvalidMessage( ws: WebSocket ) {
    this.sendMessage( ws, {
      type: "clientError",
      payload: {
        message: "invalidRequest",
      },
    } );
  }

  setInitialEvents( events: eventType[] ) {
    events.forEach( ( ev ) => {
      this.addNewEvent( ev );
    } );
  }

  handleMessage(
    ws: WebSocket,
    message: z.infer<typeof webSocketMessagePayload>,
  ) {
    console.log( message )
    if (
      this.roomState == "waitingForInitEvents" &&
      message.type == "setCurrentState" &&
      ws == this.owner
    ) {
      this.setInitialEvents( message.payload.events );
      this.roomState = "active";

      this.assignNameToWebsocket( ws );
      this.sendMessage( ws, {
        type: "roomJoined",
        payload: {
          roomId: this.roomId,
        },
      } );
      return;
    }
    //
    if ( this.roomState == "waitingForInitEvents" ) {
      this.sendMessage( ws, {
        type: "serverError",
        payload: {
          message: "roomWaitingForInitEvents",
        },
      } );
      return;
    }

    if ( this.roomState == 'closed' && message.type != 'joinRoom' ) {
      this.sendMessage( ws, {
        type: "serverError",
        payload: {
          message: "roomClosed",
        },
      } );
      return;
    }


    switch ( message.type ) {
      case "addEvent":
        this.handleEvent( ws, message.payload );
        break;

      case "joinRoom":
        this.handleJoinRoom( ws );
        break;
      case "playerPositionUpdate":
        this.handlePlayerPositionUpdate( ws, message.payload );
        break;
      default:
        this.handleInvalidMessage( ws );
        break;
    }
  }
}
