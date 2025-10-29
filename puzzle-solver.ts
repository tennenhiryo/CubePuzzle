
import type { Piece } from './types';
import { CIRCLES, NODES } from './constants';
import { LINKAGE_RULES } from './puzzle-logic';

type Move = {
    circleId: number;
    direction: 'cw' | 'ccw';
};

const ALL_MOVES: Move[] = CIRCLES.flatMap(c => [
    { circleId: c.id, direction: 'cw' },
    { circleId: c.id, direction: 'ccw' },
]);

// A pure function to apply a move and return the new state
const applyMove = (pieces: Piece[], move: Move): Piece[] => {
    const combinedRotationMap = new Map<number, number>();

    // 1. Primary Rotation
    const primaryCircle = CIRCLES.find(c => c.id === move.circleId);
    if (primaryCircle) {
        const nodesOnCircle = NODES.filter(node => node.parentCircleIds.includes(move.circleId));
        nodesOnCircle.sort((a, b) => {
            const angleA = Math.atan2(a.y - primaryCircle.cy, a.x - primaryCircle.cx);
            const angleB = Math.atan2(b.y - primaryCircle.cy, b.x - primaryCircle.cx);
            return angleA - angleB;
        });
        const sortedNodeIds = nodesOnCircle.map(n => n.id);
        const len = sortedNodeIds.length;
        const PRIMARY_ROTATION_STEP = 3;
        for (let i = 0; i < len; i++) {
            const currentId = sortedNodeIds[i];
            const targetIndex = move.direction === 'cw'
                ? (i + PRIMARY_ROTATION_STEP) % len
                : (i - PRIMARY_ROTATION_STEP + len * PRIMARY_ROTATION_STEP) % len;
            combinedRotationMap.set(currentId, sortedNodeIds[targetIndex]);
        }
    }

    // 2. Linked Rotation
    const linkageRule = LINKAGE_RULES[move.circleId];
    if (linkageRule) {
        const { targetGroup, direction: linkageDirectionType } = linkageRule;
        const centerNode = NODES.find(n => n.id === targetGroup.centerNodeId);
        if (centerNode) {
            const linkedDirection = linkageDirectionType === 'same' ? move.direction : (move.direction === 'cw' ? 'ccw' : 'cw');
            const nodesToRotate = targetGroup.surroundingNodeIds.map(id => NODES.find(n => n.id === id)).filter(Boolean) as typeof NODES;
            nodesToRotate.sort((a, b) => {
                const angleA = Math.atan2(a.y - centerNode.y, a.x - centerNode.x);
                const angleB = Math.atan2(b.y - centerNode.y, b.x - centerNode.x);
                return angleA - angleB;
            });
            const sortedNodeIds = nodesToRotate.map(n => n.id);
            const len = sortedNodeIds.length;
            const LINKED_ROTATION_STEP = 2;
            for (let i = 0; i < len; i++) {
                const fromId = sortedNodeIds[i];
                const toIndex = linkedDirection === 'cw'
                    ? (i + LINKED_ROTATION_STEP) % len
                    : (i - LINKED_ROTATION_STEP + len * LINKED_ROTATION_STEP) % len;
                combinedRotationMap.set(fromId, sortedNodeIds[toIndex]);
            }
        }
    }

    return pieces.map(piece => {
        if (combinedRotationMap.has(piece.currentNodeId)) {
            return { ...piece, currentNodeId: combinedRotationMap.get(piece.currentNodeId)! };
        }
        return piece;
    });
};

const isSolved = (pieces: Piece[]): boolean => {
    return pieces.every(p => p.currentNodeId === p.initialNodeId);
};

// Creates a canonical string representation of the puzzle state for the visited set.
const getStateKey = (pieces: Piece[]): string => {
    // Sort by initialNodeId to ensure consistent key order
    return pieces
        .slice()
        .sort((a, b) => a.initialNodeId - b.initialNodeId)
        .map(p => p.currentNodeId)
        .join(',');
};

// Breadth-First Search (BFS) to find the shortest solution path
export const solve = (startPieces: Piece[]): Move[] | null => {
    if (isSolved(startPieces)) {
        return [];
    }
    
    // The maximum number of states to explore to prevent browser freezing
    const MAX_STATES_TO_VISIT = 25000;

    const queue: { pieces: Piece[], path: Move[] }[] = [{ pieces: startPieces, path: [] }];
    const visited = new Set<string>([getStateKey(startPieces)]);

    while (queue.length > 0) {
        const { pieces, path } = queue.shift()!;

        if (visited.size > MAX_STATES_TO_VISIT) {
            console.warn(`Solver exceeded limit of ${MAX_STATES_TO_VISIT} states.`);
            return null; // Search is too complex
        }

        for (const move of ALL_MOVES) {
            const newPieces = applyMove(pieces, move);
            const newPath = [...path, move];

            if (isSolved(newPieces)) {
                return newPath; // Solution found!
            }
            
            const key = getStateKey(newPieces);
            if (!visited.has(key)) {
                visited.add(key);
                queue.push({ pieces: newPieces, path: newPath });
            }
        }
    }

    return null; // No solution found
};
