"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 3001 });
wss.on("connection", (ws, req) => {
    console.log("new connection added ", req);
});
