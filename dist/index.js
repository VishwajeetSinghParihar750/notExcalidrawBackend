"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const zodSchemas_1 = require("./types/zodSchemas");
const Room_1 = __importDefault(require("./classes/Room"));
const wss = new ws_1.WebSocketServer({ port: +process.env.PORT });
const rooms = {};
const handleRoomClosed = (roomId) => {
    setTimeout(() => {
        if (rooms[roomId].roomState == "closed") {
            // someone might reopen it, so checking
            delete rooms[roomId];
        }
    }, 5 * 60 * 1000); // 5 mins
};
const handleIncomingMessage = (ws, message) => {
    let roomId = message.roomId;
    if (!roomId && message.payload.type == "createRoom") {
        let newRoomId = crypto.randomUUID();
        while (rooms[newRoomId])
            newRoomId = crypto.randomUUID();
        rooms[newRoomId] = new Room_1.default(newRoomId, ws, handleRoomClosed);
        return;
    }
    else if (roomId && !rooms[roomId]) {
        ws.send(JSON.stringify({
            type: "clientError",
            payload: { message: "roomDoesNotExist" },
        }));
        return;
    }
    else if (!roomId) {
        ws.send(JSON.stringify({
            type: "clientError",
            payload: { message: "invalidRequest" },
        }));
        return;
    }
    rooms[roomId].handleMessage(ws, message.payload);
};
wss.on("connection", (ws, req) => {
    // console.log("some guy connected");
    ws.on("close", (code, reason) => {
        // console.log("some guy disconnected");
    });
    ws.on("message", (networkData, isBinary) => {
        //
        if (!isBinary) {
            let jsonParsedData = JSON.parse(networkData.toString());
            // console.log("received ", networkData.toString());
            try {
                let data = zodSchemas_1.webSocketMessageSchema.parse(jsonParsedData);
                handleIncomingMessage(ws, data);
            }
            catch (error) {
                // console.log(
                //   "wrong format data",
                //   jsonParsedData,
                //   networkData.toString(),
                //   error,
                // );
                ws.send(JSON.stringify({
                    type: "clientError",
                    payload: { message: "invalidRequest" },
                }));
            }
            // wrong format
        }
        else {
            // wrong format
        }
    });
    //close is handled by room itself who owns it , if no room we dont give af anyways
});
// wss.on("error", () => {});
