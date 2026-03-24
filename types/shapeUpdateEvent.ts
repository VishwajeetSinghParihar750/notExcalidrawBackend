// import type { Point } from "../classes/Point";
// import { Shape } from "../classes/Shape";

// type shapeId = string;
// type TextShapeState = "render" | "edit";

// type fillStyle = "line" | "crosslines" | "fill";
// type strokeStyle = "line" | "dotted" | "smalldotted";
// type arrowType = "straight" | "curve" | "snake";
// type strokeWidth = 2 | 4 | 6;
// type edgeRadius = 0 | 10;
// type opacity = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
// type backgroundColor = 0 | 1 | 2 | 3 | 4; // index
// type strokeColor = 0 | 1 | 2 | 3 | 4; // index

// type fontFamily = "hand" | "code" | "normal";
// type fontSize = "small" | "medium" | "large" | "extra-large" | number;
// type updateEnclosingRectangleSchema = {
//   toUpdate: "updateFull" | "moveFull";

//   delX?: number;
//   delY?: number;
//   x1?: number;
//   y1?: number;
//   x2?: number;
//   y2?: number; // either send new coords or change to coords
// };

// type updatePropertySchema = {
//   //styles
//   fillStyle?: fillStyle;
//   strokeStyle?: strokeStyle;
//   arrowType?: arrowType;
//   strokeWidth?: strokeWidth;
//   edgeRadius?: edgeRadius;
//   opacity?: opacity;
//   backgroundColor?: backgroundColor;
//   strokeColor?: strokeColor;
//   fontFamily?: fontFamily;
//   fontSize?: fontSize;

//   //properties
//   points?: Point[];
//   text?: string;
//   curState?: TextShapeState;
// };

// type addShapeSchema = {
//   shape: Shape;
// };

// type eventType =
//   | "updateEnclosingRectangle"
//   | "updateProperty"
//   | "deleteShape"
//   | "addShape";
// type shapeUpdateEventId = string;
// type shapeUpdateEvent =
//   | {
//       _id: shapeUpdateEventId;
//       eventType: "updateEnclosingRectangle";
//       shapeId: shapeId;
//       payload: updateEnclosingRectangleSchema;
//     }
//   | {
//       _id: shapeUpdateEventId;
//       eventType: "updateProperty";
//       shapeId: shapeId;
//       payload: updatePropertySchema;
//     }
//   | {
//       _id: shapeUpdateEventId;
//       eventType: "addShape";
//       payload: addShapeSchema;
//     }
//   | {
//       _id: shapeUpdateEventId;
//       eventType: "deleteShape";
//       shapeId: shapeId;
//     };

// export type {
//   shapeUpdateEvent,
//   updateEnclosingRectangleSchema,
//   updatePropertySchema,
//   eventType,
//   shapeUpdateEventId,
// };
