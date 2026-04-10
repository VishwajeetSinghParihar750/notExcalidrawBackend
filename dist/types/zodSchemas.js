"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveRoomSchema = exports.setCurrentStateSchema = exports.getCurrentStateSchema = exports.joinRoomSchema = exports.addEventSchema = exports.playerPositionUpdateSchema = exports.createRoomSchema = exports.webSocketMessageSchema = exports.playerPositionUpdatePayload = exports.setCurrentStatePayload = exports.leaveRoomPayload = exports.webSocketMessagePayload = exports.shapeUpdateEventPayload = void 0;
const zod_1 = __importDefault(require("zod"));
const TextShapeState = zod_1.default.enum(["render", "edit"]);
const shapeType = zod_1.default.enum([
    "arrow",
    "line",
    "rect",
    "rotrect",
    "pen",
    "text",
    "circle",
]);
const fillStyle = zod_1.default.enum(["line", "crosslines", "fill"]);
const strokeStyle = zod_1.default.enum(["line", "dotted", "smalldotted"]);
const arrowType = zod_1.default.enum(["straight", "curve", "snake"]);
const strokeWidth = zod_1.default.union([zod_1.default.literal(2), zod_1.default.literal(4), zod_1.default.literal(6)]);
const edgeRadius = zod_1.default.union([zod_1.default.literal(0), zod_1.default.literal(10)]);
const opacity = zod_1.default.union([
    zod_1.default.literal(0),
    zod_1.default.literal(10),
    zod_1.default.literal(20),
    zod_1.default.literal(30),
    zod_1.default.literal(40),
    zod_1.default.literal(50),
    zod_1.default.literal(60),
    zod_1.default.literal(70),
    zod_1.default.literal(80),
    zod_1.default.literal(90),
    zod_1.default.literal(100),
]);
const backgroundColor = zod_1.default.union([
    zod_1.default.literal(0),
    zod_1.default.literal(1),
    zod_1.default.literal(2),
    zod_1.default.literal(3),
    zod_1.default.literal(4),
]);
const strokeColor = zod_1.default.union([
    zod_1.default.literal(0),
    zod_1.default.literal(1),
    zod_1.default.literal(2),
    zod_1.default.literal(3),
    zod_1.default.literal(4),
]);
const fontFamily = zod_1.default.enum(["hand", "code", "normal"]);
const fontSize = zod_1.default.union([
    zod_1.default.enum(["small", "medium", "large", "extra-large"]),
    zod_1.default.number(),
]);
const toUpdateEnum = zod_1.default.enum(["updateFull", "moveFull"]);
const updateEnclosingRectanglePayload = zod_1.default.object({
    toUpdate: toUpdateEnum,
    delX: zod_1.default.number().optional(),
    delY: zod_1.default.number().optional(),
    x1: zod_1.default.number().optional(),
    y1: zod_1.default.number().optional(),
    x2: zod_1.default.number().optional(),
    y2: zod_1.default.number().optional(),
});
const updatePropertyPayload = zod_1.default.object({
    //styles
    fillStyle: fillStyle.optional(),
    strokeStyle: strokeStyle.optional(),
    arrowType: arrowType.optional(),
    strokeWidth: strokeWidth.optional(),
    edgeRadius: edgeRadius.optional(),
    opacity: opacity.optional(),
    backgroundColor: backgroundColor.optional(),
    strokeColor: strokeColor.optional(),
    fontFamily: fontFamily.optional(),
    fontSize: fontSize.optional(),
    //properties
    points: zod_1.default.array(zod_1.default.unknown()).optional(),
    text: zod_1.default.string().optional(),
    curState: TextShapeState.optional(),
});
const shapeId = zod_1.default.string();
const point = zod_1.default.object({ x: zod_1.default.number(), y: zod_1.default.number() });
const addShapePayload = zod_1.default.object({
    shape: zod_1.default.object({
        shapeId: shapeId,
        shapeType: shapeType,
        startX: zod_1.default.number().optional(),
        startY: zod_1.default.number().optional(),
        endX: zod_1.default.number().optional(),
        endY: zod_1.default.number().optional(),
        shouldUpdateRectangleBasedOnText: zod_1.default.boolean().optional(),
        enclosingRectangle: zod_1.default.tuple([point, point]).optional(),
        //styles
        fillStyle: fillStyle.optional(),
        strokeStyle: strokeStyle.optional(),
        arrowType: arrowType.optional(),
        strokeWidth: strokeWidth.optional(),
        edgeRadius: edgeRadius.optional(),
        opacity: opacity.optional(),
        backgroundColor: backgroundColor.optional(),
        strokeColor: strokeColor.optional(),
        fontFamily: fontFamily.optional(),
        fontSize: fontSize.optional(),
        //properties
        points: zod_1.default.array(zod_1.default.unknown()).optional(),
        text: zod_1.default.string().optional(),
        curState: TextShapeState.optional(),
    }),
});
const shapeUpdateEventId = zod_1.default.string();
const shapeUpdateEventPayload = zod_1.default.union([
    zod_1.default.object({
        _id: shapeUpdateEventId,
        eventType: zod_1.default.literal("updateEnclosingRectangle"),
        shapeId: shapeId,
        payload: updateEnclosingRectanglePayload,
    }),
    zod_1.default.object({
        _id: shapeUpdateEventId,
        eventType: zod_1.default.literal("updateProperty"),
        shapeId: shapeId,
        payload: updatePropertyPayload,
    }),
    zod_1.default.object({
        _id: shapeUpdateEventId,
        shapeId: shapeId,
        eventType: zod_1.default.literal("addShape"),
        payload: addShapePayload,
    }),
    zod_1.default.object({
        _id: shapeUpdateEventId,
        eventType: zod_1.default.literal("deleteShape"),
        shapeId: shapeId,
    }),
]);
exports.shapeUpdateEventPayload = shapeUpdateEventPayload;
const leaveRoomPayload = zod_1.default.object({ roomId: zod_1.default.string() });
exports.leaveRoomPayload = leaveRoomPayload;
const setCurrentStatePayload = zod_1.default.object({
    events: zod_1.default.array(shapeUpdateEventPayload),
});
exports.setCurrentStatePayload = setCurrentStatePayload;
// Schemas for ws messages
const addEventSchema = zod_1.default.object({
    type: zod_1.default.literal("addEvent"),
    payload: shapeUpdateEventPayload,
});
exports.addEventSchema = addEventSchema;
const playerPosition = zod_1.default.object({
    x: zod_1.default.number(),
    y: zod_1.default.number(),
});
const joinRoomSchema = zod_1.default.object({
    type: zod_1.default.literal("joinRoom"),
    payload: zod_1.default.object({
        roomId: zod_1.default.string(),
    }),
});
exports.joinRoomSchema = joinRoomSchema;
const createRoomSchema = zod_1.default.object({
    type: zod_1.default.literal("createRoom"),
});
exports.createRoomSchema = createRoomSchema;
const getCurrentStateSchema = zod_1.default.object({
    type: zod_1.default.literal("getCurrentState"),
});
exports.getCurrentStateSchema = getCurrentStateSchema;
const setCurrentStateSchema = zod_1.default.object({
    type: zod_1.default.literal("setCurrentState"),
    payload: setCurrentStatePayload,
});
exports.setCurrentStateSchema = setCurrentStateSchema;
const leaveRoomSchema = zod_1.default.object({
    type: zod_1.default.literal("leaveRoom"),
    payload: leaveRoomPayload,
});
exports.leaveRoomSchema = leaveRoomSchema;
const playerPositionUpdatePayload = zod_1.default.object({
    playerPosition: playerPosition,
});
exports.playerPositionUpdatePayload = playerPositionUpdatePayload;
const playerPositionUpdateSchema = zod_1.default.object({
    type: zod_1.default.literal("playerPositionUpdate"),
    payload: playerPositionUpdatePayload,
});
exports.playerPositionUpdateSchema = playerPositionUpdateSchema;
const webSocketMessagePayload = zod_1.default.union([
    addEventSchema,
    joinRoomSchema,
    getCurrentStateSchema,
    setCurrentStateSchema,
    leaveRoomSchema,
    playerPositionUpdateSchema,
    createRoomSchema,
]);
exports.webSocketMessagePayload = webSocketMessagePayload;
// schema for ws full message
const webSocketMessageSchema = zod_1.default.object({
    roomId: zod_1.default.union([zod_1.default.string(), zod_1.default.null()]),
    payload: webSocketMessagePayload,
});
exports.webSocketMessageSchema = webSocketMessageSchema;
