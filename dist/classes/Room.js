"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playerName_1 = require("../utils/playerName");
class Room {
    addPlayer(ws, isOwner = false) {
        this.players.push(ws);
        ws.on("close", (code, reason) => {
            // console.log("some guy disconnected");
            let playerName = null;
            for (let key in this.playerNames) {
                if (this.playerNames[key] == ws) {
                    playerName = key;
                    break;
                }
            }
            this.players = this.players.filter((webs) => webs != ws);
            if (isOwner) {
                this.owner = null;
                if (this.roomState == "waitingForInitEvents") {
                    this.roomState = "active"; // careful people might lose local state
                }
            }
            if (playerName) {
                Object.values(this.playerNames).forEach((player) => {
                    this.sendMessage(player, {
                        type: "playerDisconnected",
                        payload: { playerName },
                    });
                });
                delete this.playerNames[playerName];
                delete this.playerCursorPositions[playerName];
                if (this.players.length == 0) {
                    this.roomState = "closed";
                    this.onCloseCallback(this.roomId);
                }
            }
        });
    }
    sendMessage(ws, data) {
        // console.log("sending : ", data);
        ws.send(JSON.stringify(data));
    }
    setupRoom(ws) {
        this.addPlayer(ws, true);
        this.sendMessage(ws, {
            type: "getCurrentState",
            payload: {
                roomId: this.roomId,
            },
        });
        this.roomState = "waitingForInitEvents";
    }
    constructor(roomId, owner, onCloseCb) {
        this.roomState = "closed";
        this.players = [];
        this.playerNames = {};
        this.playerCursorPositions = {};
        this.shapes = new Set();
        this.addEvents = [];
        this.events = []; // this is not necessary but keeping for ease rn
        this.perShapeEvents = {};
        this.onCloseCallback = onCloseCb;
        this.roomId = roomId;
        this.owner = owner;
        this.setupRoom(owner);
    }
    addNewEvent(event) {
        let prevEventId;
        if (event.eventType == "addShape") {
            if (event.payload.shape.shapeType == "text") {
                event.payload.shape.curState = "render";
            }
            if (this.addEvents.length > 0)
                prevEventId = this.addEvents[this.addEvents.length - 1]._id;
            else
                prevEventId = null;
        }
        else {
            // make this more robust check for text specifically
            if (event.eventType == "updateProperty" &&
                event.payload.curState == "edit")
                event.payload.curState = "render";
            prevEventId =
                this.perShapeEvents[event.shapeId][this.perShapeEvents[event.shapeId].length - 1]._id;
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
    broadcastEvent(ev, prevEventId) {
        this.players.forEach((ws) => this.sendMessage(ws, {
            type: "eventAdded",
            payload: {
                addedEvent: ev,
                prevEventId,
            },
        }));
    }
    canAddEvent(event) {
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
    handleEvent(ws, event) {
        if (this.canAddEvent(event)) {
            let prevEventId = this.addNewEvent(event);
            this.broadcastEvent(event, prevEventId);
        }
        else
            this.sendMessage(ws, {
                type: "addEventFailed",
                payload: {
                    addEventId: event._id,
                },
            });
    }
    assignNameToWebsocket(ws) {
        let newPlayerName = (0, playerName_1.getRandomPlayerName)();
        while (this.playerNames[newPlayerName]) {
            newPlayerName = (0, playerName_1.getRandomPlayerName)();
        }
        this.playerCursorPositions[newPlayerName] = { x: 0, y: 0 };
        this.playerNames[newPlayerName] = ws;
        return newPlayerName;
    }
    handlePlayerPositionUpdate(ws, payload) {
        let playerName = Object.keys(this.playerNames).find((key) => this.playerNames[key] == ws);
        if (!playerName)
            return;
        Object.keys(this.playerNames).forEach((player) => {
            if (ws != this.playerNames[player]) {
                this.sendMessage(this.playerNames[player], {
                    type: "playerPositionUpdate",
                    payload: {
                        playerName: playerName,
                        playerPosition: payload.playerPosition,
                    },
                });
            }
            else {
                this.playerCursorPositions[player] = payload.playerPosition;
            }
        });
    }
    handleJoinRoom(ws) {
        this.addPlayer(ws);
        this.sendMessage(ws, {
            type: "setCurrentState",
            payload: {
                events: this.events,
                players: Object.keys(this.playerCursorPositions).map((key) => {
                    return {
                        playerName: key,
                        playerPosition: this.playerCursorPositions[key],
                    };
                }),
            },
        });
        this.assignNameToWebsocket(ws);
        this.sendMessage(ws, {
            type: "roomJoined",
            payload: {
                roomId: this.roomId,
            },
        });
    }
    handleInvalidMessage(ws) {
        this.sendMessage(ws, {
            type: "clientError",
            payload: {
                message: "invalidRequest",
            },
        });
    }
    setInitialEvents(events) {
        events.forEach((ev) => {
            this.addNewEvent(ev);
        });
    }
    handleMessage(ws, message) {
        if (this.roomState == "waitingForInitEvents" &&
            message.type == "setCurrentState" &&
            ws == this.owner) {
            this.setInitialEvents(message.payload.events);
            this.roomState = "active";
            this.assignNameToWebsocket(ws);
            this.sendMessage(ws, {
                type: "roomJoined",
                payload: {
                    roomId: this.roomId,
                },
            });
            return;
        }
        //
        if (this.roomState != "active") {
            this.sendMessage(ws, {
                type: "serverError",
                payload: {
                    message: "roomNotActive",
                },
            });
            return;
        }
        switch (message.type) {
            case "addEvent":
                this.handleEvent(ws, message.payload);
                break;
            case "joinRoom":
                this.handleJoinRoom(ws);
                break;
            case "playerPositionUpdate":
                this.handlePlayerPositionUpdate(ws, message.payload);
                break;
            default:
                this.handleInvalidMessage(ws);
                break;
        }
    }
}
exports.default = Room;
