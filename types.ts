export const COLORS = {
    red: '#ef4444',      // Brighter Rubik's Red
    green: '#22c55e',    // Brighter Rubik's Green
    yellow: '#fde047',   // Brighter Rubik's Yellow
    orange: '#fb923c',   // Brighter Rubik's Orange
    white: '#f8fafc',    // Rubik's White
    blue: '#3b82f6',     // Brighter Rubik's Blue
} as const;

export type ColorId = keyof typeof COLORS;

export interface NodeData {
  id: number;
  x: number;
  y: number;
  initialColor: ColorId;
  parentCircleIds: [number, number];
}

export interface CircleData {
    id: number;
    cx: number;
    cy: number;
    r: number;
    cluster: number;
}

export interface Piece {
  initialNodeId: number;
  currentNodeId: number;
  color: ColorId;
}

export type RotationAnimation = {
    pathDefinition:
        | { type: 'circle'; circleId: number; rotationStep: number }
        | { type: 'compound'; circleId1: number; circleId2: number; intermediateNodeId: number };
    direction: 'cw' | 'ccw';
    endToStartNodeMap: Map<number, number>; // Map<toNodeId, fromNodeId>
    largeArc?: boolean;
    is180?: boolean; // Flag for special 180-degree rotation case
};

// Moved from puzzle-logic.ts to be used in constants.ts for color assignment
export interface NodeGroup {
    centerNodeId: number;
    surroundingNodeIds: number[];
}