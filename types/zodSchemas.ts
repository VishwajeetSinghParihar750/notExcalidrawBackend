import z from "zod";

const TextShapeState = z.enum(["render", "edit"]);
const shapeType = z.enum([
  "arrow",
  "line",
  "rect",
  "rotrect",
  "pen",
  "text",
  "circle",
]);

const fillStyle = z.enum(["line", "crosslines", "fill"]);

const strokeStyle = z.enum(["line", "dotted", "smalldotted"]);

const arrowType = z.enum(["straight", "curve", "snake"]);

const strokeWidth = z.union([z.literal(2), z.literal(4), z.literal(6)]);

const edgeRadius = z.union([z.literal(0), z.literal(10)]);

const opacity = z.union([
  z.literal(0),
  z.literal(10),
  z.literal(20),
  z.literal(30),
  z.literal(40),
  z.literal(50),
  z.literal(60),
  z.literal(70),
  z.literal(80),
  z.literal(90),
  z.literal(100),
]);

const backgroundColor = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const strokeColor = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const fontFamily = z.enum(["hand", "code", "normal"]);

const fontSize = z.union([
  z.enum(["small", "medium", "large", "extra-large"]),
  z.number(),
]);

const toUpdateEnum = z.enum(["updateFull", "moveFull"]);

const updateEnclosingRectanglePayload = z.object({
  toUpdate: toUpdateEnum,

  delX: z.number().optional(),
  delY: z.number().optional(),
  x1: z.number().optional(),
  y1: z.number().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
});

const updatePropertyPayload = z.object({
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
  points: z.array(z.unknown()).optional(),
  text: z.string().optional(),
  curState: TextShapeState.optional(),
});

const shapeId = z.string();
const point = z.object({ x: z.number(), y: z.number() });

const addShapePayload = z.object({
  shape: z.object({
    shapeId: shapeId,
    shapeType: shapeType,

    startX: z.number().optional(),
    startY: z.number().optional(),
    endX: z.number().optional(),
    endY: z.number().optional(),
    shouldUpdateRectangleBasedOnText: z.boolean().optional(),
    enclosingRectangle: z.tuple([point, point]).optional(),
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
    points: z.array(z.unknown()).optional(),
    text: z.string().optional(),
    curState: TextShapeState.optional(),
  }),
});

const shapeUpdateEventId = z.string();

const shapeUpdateEventPayload = z.union([
  z.object({
    _id: shapeUpdateEventId,
    eventType: z.literal("updateEnclosingRectangle"),
    shapeId: shapeId,
    payload: updateEnclosingRectanglePayload,
  }),
  z.object({
    _id: shapeUpdateEventId,
    eventType: z.literal("updateProperty"),
    shapeId: shapeId,
    payload: updatePropertyPayload,
  }),
  z.object({
    _id: shapeUpdateEventId,
    shapeId: shapeId,
    eventType: z.literal("addShape"),
    payload: addShapePayload,
  }),
  z.object({
    _id: shapeUpdateEventId,
    eventType: z.literal("deleteShape"),
    shapeId: shapeId,
  }),
]);

const joinRoomPayload = z.object({ roomId: z.string() });
const leaveRoomPayload = z.object({ roomId: z.string() });

const setCurrentStatePayload = z.object({
  events: z.array(shapeUpdateEventPayload),
});

// Schemas for ws messages
const addEventSchema = z.object({
  type: z.literal("addEvent"),
  payload: shapeUpdateEventPayload,
});
const joinRoomSchema = z.object({
  type: z.literal("joinRoom"),
  payload: joinRoomPayload,
});
const getCurrentStateSchema = z.object({
  type: z.literal("getCurrentState"),
});
const setCurrentStateSchema = z.object({
  type: z.literal("setCurrentState"),
  payload: setCurrentStatePayload,
});
const leaveRoomSchema = z.object({
  type: z.literal("leaveRoom"),
  payload: leaveRoomPayload,
});

const webSocketMessagePayload = z.union([
  addEventSchema,
  joinRoomSchema,
  getCurrentStateSchema,
  setCurrentStateSchema,
  leaveRoomSchema,
]);
// schema for ws full message
const webSocketMessageSchema = z.object({
  roomId: z.string(),
  payload: webSocketMessagePayload,
});

export {
  shapeUpdateEventPayload,
  webSocketMessagePayload,
  leaveRoomPayload,
  joinRoomPayload,
  setCurrentStatePayload,
};

export {
  webSocketMessageSchema,
  addEventSchema,
  joinRoomSchema,
  getCurrentStateSchema,
  setCurrentStateSchema,
  leaveRoomSchema,
};
