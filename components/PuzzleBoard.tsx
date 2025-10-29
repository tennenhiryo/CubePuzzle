
import React from 'react';
import { COLORS, type CircleData, type Piece, type RotationAnimation, type NodeData } from '../types';
import { NODES } from '../constants';

interface PuzzleBoardProps {
    pieces: Piece[];
    circles: CircleData[];
    selectedCircleId: number | null;
    onCircleSelect: (circleId: number) => void;
    lastRotationAnimations: RotationAnimation[];
    isSolving: boolean;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ pieces, circles, selectedCircleId, onCircleSelect, lastRotationAnimations, isSolving }) => {
    
    const getArcPath = (
        endPoint: { x: number, y: number },
        circle: CircleData,
        sweepFlag: 0 | 1,
        largeArcFlag: 0 | 1
    ): string => {
        const r = circle.r;
        return `A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;
    };
    
    const getAnimationPathDefinition = (
        animation: RotationAnimation,
        startNode: NodeData,
        endNode: NodeData
    ): string | null => {
        const sweepFlag = animation.direction === 'cw' ? 1 : 0;
        const pathDef = animation.pathDefinition;

        let arcPath: string;

        if (pathDef.type === 'circle') {
            const circle = circles.find(c => c.id === pathDef.circleId);
            if (!circle) return null;
            
            const startAngle = Math.atan2(startNode.y - circle.cy, startNode.x - circle.cx);
            const endAngle = Math.atan2(endNode.y - circle.cy, endNode.x - circle.cx);

            let largeArcFlag: 0 | 1;

            if (pathDef.rotationStep === 2) {
                largeArcFlag = 0;
            } else {
                let rotationDelta = endAngle - startAngle;
                if (animation.direction === 'cw' && rotationDelta < 0) {
                    rotationDelta += 2 * Math.PI;
                } else if (animation.direction === 'ccw' && rotationDelta > 0) {
                    rotationDelta -= 2 * Math.PI;
                }
                largeArcFlag = Math.abs(rotationDelta) > Math.PI ? 1 : 0;
            }

            const perfectEndPoint = {
                x: circle.cx + circle.r * Math.cos(endAngle),
                y: circle.cy + circle.r * Math.sin(endAngle),
            };

            arcPath = getArcPath(perfectEndPoint, circle, sweepFlag, largeArcFlag);
        
        } else if (pathDef.type === 'compound') {
            const circle1 = circles.find(c => c.id === pathDef.circleId1);
            const circle2 = circles.find(c => c.id === pathDef.circleId2);
            const intermediateNode = NODES.find(n => n.id === pathDef.intermediateNodeId);

            if (!circle1 || !circle2 || !intermediateNode) return null;

            const largeArcFlag = 0;
            const arc1 = getArcPath(intermediateNode, circle1, sweepFlag, largeArcFlag);
            const arc2 = getArcPath(endNode, circle2, sweepFlag, largeArcFlag);
            
            arcPath = `${arc1} ${arc2}`;
        } else {
            return null;
        }

        return `M ${startNode.x} ${startNode.y} ${arcPath}`;
    };

    const handleCircleClick = (circleId: number) => {
        if (isSolving) return;
        onCircleSelect(circleId);
    };

    return (
        <svg viewBox="0 0 800 650" className="w-full h-full">
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <style>{`
                @keyframes move-along-path {
                    to {
                        offset-distance: 100%;
                    }
                }
            `}</style>

            <g>
                {circles.map((circle) => (
                    <g 
                        key={circle.id} 
                        onClick={() => handleCircleClick(circle.id)} 
                        className={isSolving ? 'cursor-wait' : 'cursor-pointer'}
                    >
                        <circle 
                            cx={circle.cx}
                            cy={circle.cy}
                            r={circle.r}
                            className="transition-all duration-200"
                            stroke={selectedCircleId === circle.id ? '#22d3ee' : '#475569'}
                            strokeWidth={selectedCircleId === circle.id ? 2.5 : 1}
                            fill="none"
                            style={{ filter: selectedCircleId === circle.id ? 'url(#glow)' : 'none' }}
                        />
                        <circle 
                            cx={circle.cx}
                            cy={circle.cy}
                            r={circle.r}
                            stroke="transparent"
                            strokeWidth="20"
                            fill="none"
                        />
                    </g>
                ))}
            </g>

            <g>
                {pieces.map((piece) => {
                    const toNodeId = piece.currentNodeId;
                    const animation = lastRotationAnimations.find(anim => anim.endToStartNodeMap.has(toNodeId));
                    const isAnimating = !!animation;
                    
                    const fromNodeId = isAnimating ? animation.endToStartNodeMap.get(toNodeId)! : toNodeId;

                    const startNode = NODES[fromNodeId];
                    const endNode = NODES[toNodeId];
                    
                    const cx = isAnimating ? 0 : endNode.x;
                    const cy = isAnimating ? 0 : endNode.y;

                    const animationPath = isAnimating
                        ? getAnimationPathDefinition(animation, startNode, endNode)
                        : null;

                    return (
                        <g key={piece.initialNodeId} style={{ pointerEvents: 'none' }}>
                            <circle
                                cx={cx}
                                cy={cy}
                                r="11"
                                fill={COLORS[piece.color]}
                                stroke="#1e293b"
                                strokeWidth="1.5"
                                style={{
                                    offsetPath: animationPath ? `path('${animationPath}')` : 'none',
                                    animation: animationPath ? 'move-along-path 0.5s ease-in-out forwards' : 'none',
                                }}
                            />
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};

export default PuzzleBoard;
