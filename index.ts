import WebSocket, { WebSocketServer } from "ws";
import z, { json } from "zod";
import { webSocketMessageSchema } from "./types/zodSchemas";
import Room from "./classes/Room";
import type { RoomId } from "./classes/Room";

const wss = new WebSocketServer({ port: 3001 });

const rooms: Record<RoomId, Room> = {};

const handleIncomingMessage = (
  ws: WebSocket,
  message: z.infer<typeof webSocketMessageSchema>,
) => {
  let roomId = message.roomId;
  if (!rooms[roomId]) {
    if (message.payload.type == "joinRoom") {
      rooms[roomId] = new Room(roomId, ws);
    } else {
      // invalid
      // return from here
    }
  }

  rooms[roomId].handleMessage(ws, message.payload);
};

wss.on("connection", (ws, req) => {
  console.log("some guy connected");
  ws.on("close", (code, reason) => {
    console.log("some guy disconnected");
  });
  ws.on("message", (networkData, isBinary) => {
    //
    if (!isBinary) {
      let jsonParsedData = JSON.parse(networkData.toString());

      console.log("received ", networkData.toString());

      try {
        let data = webSocketMessageSchema.parse(jsonParsedData);
        handleIncomingMessage(ws, data!);
      } catch (error) {
        console.log(
          "wrong format data",
          jsonParsedData,
          networkData.toString(),
          error,
        );
      }

      // wrong format
    } else {
      // wrong format
    }
  });

  //close is handled by room itself who owns it , if no room we dont give af anyways
});

// wss.on("error", () => {});
