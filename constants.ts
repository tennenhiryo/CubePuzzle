
import type { NodeData, CircleData, ColorId, NodeGroup } from './types';

// --- CORE GEOMETRY ---
const CENTER_X = 400;
const CENTER_Y = 325;
// The distance between cluster centers is set to be equal to the middle radius (135).
// This makes the cluster centers form an equilateral triangle with side length 135.
// CLUSTER_OFFSET is the distance from the geometric center to each cluster center (a vertex of the triangle).
// For an equilateral triangle, this is side_length / sqrt(3).
const CLUSTER_OFFSET = 135 / Math.sqrt(3);
const RADII = [110, 135, 160];


// --- CLUSTER CENTERS ---
const CLUSTER_CENTERS = [
    // Top cluster
    { x: CENTER_X, y: CENTER_Y - CLUSTER_OFFSET },
    // Bottom-left cluster
    { x: CENTER_X - CLUSTER_OFFSET * Math.cos(Math.PI / 6), y: CENTER_Y + CLUSTER_OFFSET * Math.sin(Math.PI / 6) },
    // Bottom-right cluster
    { x: CENTER_X + CLUSTER_OFFSET * Math.cos(Math.PI / 6), y: CENTER_Y + CLUSTER_OFFSET * Math.sin(Math.PI / 6) },
];

// --- CIRCLE DEFINITIONS ---
export const CIRCLES: CircleData[] = (() => {
    const circles: CircleData[] = [];
    let id = 0;
    CLUSTER_CENTERS.forEach((center, clusterIndex) => {
        RADII.forEach((radius) => {
            circles.push({
                id: id++,
                cx: center.x,
                cy: center.y,
                r: radius,
                cluster: clusterIndex,
            });
        });
    });
    return circles;
})();

// --- NODE GENERATION from Intersections ---
const getIntersectionPoints = (c1: CircleData, c2: CircleData): {x: number, y: number}[] => {
    const dx = c2.cx - c1.cx;
    const dy = c2.cy - c1.cy;
    const d = Math.sqrt(dx*dx + dy*dy);

    // Check for no intersection or tangency
    if (d > c1.r + c2.r || d < Math.abs(c1.r - c2.r) || d === 0) {
        return [];
    }

    const a = (c1.r*c1.r - c2.r*c2.r + d*d) / (2 * d);
    const h = Math.sqrt(Math.max(0, c1.r*c1.r - a*a)); // Use Math.max to prevent floating point errors causing sqrt of negative

    const x2 = c1.cx + a * dx / d;
    const y2 = c1.cy + a * dy / d;

    const pt1 = {
        x: x2 + h * dy / d,
        y: y2 - h * dx / d,
    };
    const pt2 = {
        x: x2 - h * dy / d,
        y: y2 + h * dx / d,
    };
    
    // Check for tangency
    if (Math.abs(d - (c1.r + c2.r)) < 1e-6 || Math.abs(d - Math.abs(c1.r - c2.r)) < 1e-6) {
        return [pt1];
    }

    return [pt1, pt2];
}

// Helper function to correct floating point inaccuracies by "snapping" a point
// to the mathematically perfect circumference of a circle.
const snapPointToCircle = (point: {x: number, y: number}, circle: CircleData): {x: number, y: number} => {
    const dx = point.x - circle.cx;
    const dy = point.y - circle.cy;
    const distance = Math.hypot(dx, dy);

    // If point is at the center, can't snap. Return original. (Shouldn't happen for intersections)
    if (distance === 0) return point;

    const scale = circle.r / distance;
    
    return {
        x: circle.cx + dx * scale,
        y: circle.cy + dy * scale,
    };
};


// First, generate node geometry without the final colors.
const NODES_GEOMETRY: NodeData[] = (() => {
    const pointsMap = new Map<string, NodeData>();
    let idCounter = 0;

    for (let i = 0; i < CIRCLES.length; i++) {
        for (let j = i + 1; j < CIRCLES.length; j++) {
            const c1 = CIRCLES[i];
            const c2 = CIRCLES[j];

            // Only find intersections between circles from different clusters
            if (c1.cluster === c2.cluster) continue;
            
            const intersections = getIntersectionPoints(c1, c2);

            intersections.forEach(p => {
                const key = `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
                if (!pointsMap.has(key)) {
                    // Snap the point to the first parent circle to correct floating point inaccuracies.
                    const snappedPoint = snapPointToCircle(p, c1);
                    pointsMap.set(key, {
                        id: idCounter++,
                        x: snappedPoint.x,
                        y: snappedPoint.y,
                        parentCircleIds: [c1.id, c2.id],
                        initialColor: 'red', // Placeholder color, will be replaced below
                    });
                }
            });
        }
    }
    // Sort nodes by ID to ensure consistent order
    return Array.from(pointsMap.values()).sort((a, b) => a.id - b.id);
})();


// --- 9-NODE GROUP DEFINITIONS --- (Moved from puzzle-logic.ts)
function defineNodeGroups(): { [key: string]: NodeGroup } {
    const groups: { [key: string]: NodeGroup } = {};

    const midC_Top = CIRCLES.find(c => c.cluster === 0 && c.r === 135)!;
    const midC_BL = CIRCLES.find(c => c.cluster === 1 && c.r === 135)!;
    const midC_BR = CIRCLES.find(c => c.cluster === 2 && c.r === 135)!;

    const centers_0_1 = NODES_GEOMETRY.filter(n => n.parentCircleIds.includes(midC_Top.id) && n.parentCircleIds.includes(midC_BL.id)).sort((a,b) => a.y - b.y);
    const center_TL = centers_0_1[0];
    const center_BL = centers_0_1[1];

    const centers_0_2 = NODES_GEOMETRY.filter(n => n.parentCircleIds.includes(midC_Top.id) && n.parentCircleIds.includes(midC_BR.id)).sort((a,b) => a.y - b.y);
    const center_TR = centers_0_2[0];
    const center_BR = centers_0_2[1];

    const centers_1_2 = NODES_GEOMETRY.filter(n => n.parentCircleIds.includes(midC_BL.id) && n.parentCircleIds.includes(midC_BR.id)).sort((a,b) => a.y - b.y);
    const center_T = centers_1_2[0];
    const center_B = centers_1_2[1];

    const createPairedGroups = (
        centerA: NodeData,
        centerB: NodeData,
        clusterId1: number,
        clusterId2: number
    ): [NodeGroup, NodeGroup] => {
        const allNodesInPair = NODES_GEOMETRY.filter(n => {
            const nodeCircle1 = CIRCLES.find(c => c.id === n.parentCircleIds[0]);
            const nodeCircle2 = CIRCLES.find(c => c.id === n.parentCircleIds[1]);
            if (!nodeCircle1 || !nodeCircle2) return false;
            
            const nodeClusters = [nodeCircle1.cluster, nodeCircle2.cluster].sort();
            return nodeClusters[0] === clusterId1 && nodeClusters[1] === clusterId2;
        });

        const surroundingNodesA: number[] = [];
        const surroundingNodesB: number[] = [];

        allNodesInPair.forEach(node => {
            if (node.id === centerA.id || node.id === centerB.id) return;
            const distToA = Math.hypot(node.x - centerA.x, node.y - centerA.y);
            const distToB = Math.hypot(node.x - centerB.x, node.y - centerB.y);
            if (distToA < distToB) {
                surroundingNodesA.push(node.id);
            } else {
                surroundingNodesB.push(node.id);
            }
        });

        return [
            { centerNodeId: centerA.id, surroundingNodeIds: surroundingNodesA },
            { centerNodeId: centerB.id, surroundingNodeIds: surroundingNodesB }
        ];
    };

    const [group_TL, group_BL] = createPairedGroups(center_TL, center_BL, 0, 1);
    const [group_TR, group_BR] = createPairedGroups(center_TR, center_BR, 0, 2);
    const [group_T, group_B] = createPairedGroups(center_T, center_B, 1, 2);

    groups['TOP_LEFT'] = group_TL;
    groups['BOTTOM_LEFT'] = group_BL;
    groups['TOP_RIGHT'] = group_TR;
    groups['BOTTOM_RIGHT'] = group_BR;
    groups['TOP'] = group_T;
    groups['BOTTOM'] = group_B;

    return groups;
}

const ALL_GROUPS = defineNodeGroups();

export const TOP_LEFT_GROUP = ALL_GROUPS['TOP_LEFT'];
export const TOP_GROUP = ALL_GROUPS['TOP'];
export const TOP_RIGHT_GROUP = ALL_GROUPS['TOP_RIGHT'];
export const BOTTOM_LEFT_GROUP = ALL_GROUPS['BOTTOM_LEFT'];
export const BOTTOM_RIGHT_GROUP = ALL_GROUPS['BOTTOM_RIGHT'];
export const BOTTOM_GROUP = ALL_GROUPS['BOTTOM'];

// --- COLOR ASSIGNMENT ---
const GROUP_TO_COLOR_MAP: { [key: string]: ColorId } = {
    TOP_LEFT: 'red',
    TOP: 'green',
    TOP_RIGHT: 'yellow',
    BOTTOM_LEFT: 'orange',
    BOTTOM_RIGHT: 'white',
    BOTTOM: 'blue',
};

const NODE_ID_TO_COLOR_MAP = new Map<number, ColorId>();
for (const groupName in ALL_GROUPS) {
    if (Object.prototype.hasOwnProperty.call(ALL_GROUPS, groupName)) {
        const color = GROUP_TO_COLOR_MAP[groupName];
        const group = ALL_GROUPS[groupName];
        NODE_ID_TO_COLOR_MAP.set(group.centerNodeId, color);
        group.surroundingNodeIds.forEach(id => {
            NODE_ID_TO_COLOR_MAP.set(id, color);
        });
    }
}

// --- FINAL NODES EXPORT WITH CORRECT COLORS ---
export const NODES: NodeData[] = NODES_GEOMETRY.map(node => ({
    ...node,
    initialColor: NODE_ID_TO_COLOR_MAP.get(node.id)!,
}));

export const INITIAL_COLORS: ColorId[] = NODES.map(node => node.initialColor);
