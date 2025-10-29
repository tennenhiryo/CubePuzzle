
import {
    TOP_LEFT_GROUP,
    TOP_GROUP,
    BOTTOM_GROUP,
    TOP_RIGHT_GROUP,
    BOTTOM_LEFT_GROUP,
    BOTTOM_RIGHT_GROUP,
} from './constants';
import type { NodeGroup } from './types';


// --- TRIGGER DEFINITIONS ---
// This map defines all the cause-and-effect relationships for linked rotations.
// Key: The ID of the circle that is being rotated (the trigger).
// Value: An object containing the target node group and the direction of the linked rotation.
// Rule: Inner circles link to the OPPOSITE side group. Outer circles link to the SAME side group.

export const LINKAGE_RULES: { [triggerCircleId: number]: { targetGroup: NodeGroup, direction: 'same' | 'opposite' } } = {
    // --- Inner Circles (opposite side, opposite rotation) ---
    // "Right-Bottom" inner (ID 6) -> "Top-Left" group (diagonally opposite)
    6: { targetGroup: TOP_LEFT_GROUP, direction: 'opposite' },
    // "Top" inner (ID 0) -> "Bottom" group (vertically opposite)
    0: { targetGroup: BOTTOM_GROUP, direction: 'opposite' },
    // "Left-Bottom" inner (ID 3) -> "Top-Right" group (diagonally opposite)
    3: { targetGroup: TOP_RIGHT_GROUP, direction: 'opposite' },

    // --- Outer Circles (same side, same rotation) ---
    // "Right-Bottom" outer (ID 8) -> "Left-Bottom" group (horizontally opposite/crossed)
    8: { targetGroup: BOTTOM_LEFT_GROUP, direction: 'same' },
    // "Top" outer (ID 2) -> "Top" group (same side)
    2: { targetGroup: TOP_GROUP, direction: 'same' },
    // "Left-Bottom" outer (ID 5) -> "Right-Bottom" group (horizontally opposite/crossed)
    5: { targetGroup: BOTTOM_RIGHT_GROUP, direction: 'same' },
};
