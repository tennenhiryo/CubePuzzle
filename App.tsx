
import React, { useState, useEffect, useCallback } from 'react';
import { NODES, CIRCLES, TOP_LEFT_GROUP, TOP_GROUP, TOP_RIGHT_GROUP, BOTTOM_LEFT_GROUP, BOTTOM_RIGHT_GROUP, BOTTOM_GROUP } from './constants';
import type { Piece, RotationAnimation, ColorId, NodeGroup } from './types';
import { LINKAGE_RULES } from './puzzle-logic';
import { solve } from './puzzle-solver';
import PuzzleBoard from './components/PuzzleBoard';
import Controls from './components/Controls';
import WinModal from './components/WinModal';
import Menu from './components/Menu';
import StartScreen from './components/StartScreen';
import CelebrationOverlay from './components/CelebrationOverlay';

// Helper function to calculate the result of a rotation
const calculateRotation = (pieces: Piece[], circleId: number, direction: 'cw' | 'ccw'): { newPieces: Piece[], animations: RotationAnimation[] } => {
    const animations: RotationAnimation[] = [];
    const combinedRotationMap = new Map<number, number>(); // from -> to

    // 1. Primary Rotation
    const primaryCircle = CIRCLES.find(c => c.id === circleId);
    if (primaryCircle) {
        const nodesOnCircle = NODES.filter(node => node.parentCircleIds.includes(circleId));
        nodesOnCircle.sort((a, b) => {
            const angleA = Math.atan2(a.y - primaryCircle.cy, a.x - primaryCircle.cx);
            const angleB = Math.atan2(b.y - primaryCircle.cy, b.x - primaryCircle.cx);
            return angleA - angleB;
        });

        const sortedNodeIds = nodesOnCircle.map(n => n.id);
        const len = sortedNodeIds.length;
        const primaryRotationMap = new Map<number, number>();

        const PRIMARY_ROTATION_STEP = 3;

        for (let i = 0; i < len; i++) {
            const currentId = sortedNodeIds[i];
            const targetIndex = direction === 'cw'
                ? (i + PRIMARY_ROTATION_STEP) % len
                : (i - PRIMARY_ROTATION_STEP + len * PRIMARY_ROTATION_STEP) % len;
            const targetId = sortedNodeIds[targetIndex];
            primaryRotationMap.set(currentId, targetId);
        }

        primaryRotationMap.forEach((toId, fromId) => {
            combinedRotationMap.set(fromId, toId);
            animations.push({
                pathDefinition: { type: 'circle', circleId: circleId, rotationStep: PRIMARY_ROTATION_STEP },
                direction,
                endToStartNodeMap: new Map([[toId, fromId]]),
            });
        });
    }

    // 2. Linked Rotation
    const linkageRule = LINKAGE_RULES[circleId];
    if (linkageRule) {
        const { targetGroup, direction: linkageDirectionType } = linkageRule;
        const centerNode = NODES.find(n => n.id === targetGroup.centerNodeId);

        if (centerNode) {
            const linkedDirection = linkageDirectionType === 'same' ? direction : (direction === 'cw' ? 'ccw' : 'cw');
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
                const toId = sortedNodeIds[toIndex];
                combinedRotationMap.set(fromId, toId);

                const fromNode = NODES.find(n => n.id === fromId)!;
                const toNode = NODES.find(n => n.id === toId)!;
                const intermediateIndex = linkedDirection === 'cw' ? (i + 1) % len : (i - 1 + len) % len;
                const intermediateId = sortedNodeIds[intermediateIndex];
                const circleId1 = fromNode.parentCircleIds.find(id => NODES[intermediateId].parentCircleIds.includes(id));
                const circleId2 = NODES[intermediateId].parentCircleIds.find(id => toNode.parentCircleIds.includes(id));
                
                let animation: RotationAnimation;
                 if (circleId1 !== undefined && circleId2 !== undefined && circleId1 !== circleId2) {
                    animation = {
                        pathDefinition: { type: 'compound', circleId1, circleId2, intermediateNodeId: intermediateId },
                        direction: linkedDirection,
                        endToStartNodeMap: new Map([[toId, fromId]]),
                    };
                } else {
                    const commonCircleId = fromNode.parentCircleIds.find(id => toNode.parentCircleIds.includes(id));
                    animation = {
                        pathDefinition: { type: 'circle', circleId: commonCircleId!, rotationStep: LINKED_ROTATION_STEP },
                        direction: linkedDirection,
                        endToStartNodeMap: new Map([[toId, fromId]]),
                    };
                }
                animations.push(animation);
            }
        }
    }

    // 3. Apply all rotations
    const newPieces = pieces.map(piece => {
        if (combinedRotationMap.has(piece.currentNodeId)) {
            return { ...piece, currentNodeId: combinedRotationMap.get(piece.currentNodeId)! };
        }
        return piece;
    });

    return { newPieces, animations };
};


const App: React.FC = () => {
    const [pieces, setPieces] = useState<Piece[]>(() =>
        NODES.map((node) => ({
            initialNodeId: node.id,
            currentNodeId: node.id,
            color: node.initialColor,
        }))
    );
    const [isSolved, setIsSolved] = useState<boolean>(true);
    const [moves, setMoves] = useState<number>(0);
    const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
    const [lastRotationAnimations, setLastRotationAnimations] = useState<RotationAnimation[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [gameState, setGameState] = useState<'start' | 'playing'>('start');
    const [history, setHistory] = useState<Piece[][]>([]); // For undo
    const [initialScrambledPieces, setInitialScrambledPieces] = useState<Piece[]>([]); // For restart
    
    const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
    const [showWinModal, setShowWinModal] = useState<boolean>(false);
    const [isSolving, setIsSolving] = useState<boolean>(false);


    const checkSolved = useCallback((currentPieces: Piece[]) => {
        const nodeColorMap = new Map<number, ColorId>();
        for (const piece of currentPieces) {
            nodeColorMap.set(piece.currentNodeId, piece.color);
        }

        const allGroups: NodeGroup[] = [
            TOP_LEFT_GROUP, TOP_GROUP, TOP_RIGHT_GROUP,
            BOTTOM_LEFT_GROUP, BOTTOM_RIGHT_GROUP, BOTTOM_GROUP
        ];

        for (const group of allGroups) {
            const allNodeIdsInGroup = [group.centerNodeId, ...group.surroundingNodeIds];
            const firstNodeColor = nodeColorMap.get(allNodeIdsInGroup[0]);
            if (firstNodeColor === undefined) return false;
            for (let i = 1; i < allNodeIdsInGroup.length; i++) {
                if (nodeColorMap.get(allNodeIdsInGroup[i]) !== firstNodeColor) {
                    return false;
                }
            }
        }
        return true;
    }, []);

    useEffect(() => {
        if (gameState !== 'playing' || isSolving) return;

        const currentlySolved = checkSolved(pieces);
        if (currentlySolved && !isSolved) {
            setIsSolved(true);
            if (moves > 0) {
                setIsCelebrating(true);
                setTimeout(() => {
                    setIsCelebrating(false);
                    setShowWinModal(true);
                }, 2000);
            }
        } else if (!currentlySolved && isSolved) {
            setIsSolved(false);
        }
    }, [pieces, checkSolved, gameState, moves, isSolved, isSolving]);
    
    const toggleMenu = useCallback(() => {
        if (isSolving) return;
        setIsMenuOpen(prev => !prev);
    }, [isSolving]);

    const handleStartGame = useCallback((scrambleMoves: number) => {
        let scrambledPieces: Piece[] = NODES.map((node) => ({
            initialNodeId: node.id,
            currentNodeId: node.id,
            color: node.initialColor,
        }));
    
        const ALL_ROTATABLE_IDS = CIRCLES.map(c => c.id);
        let currentPieces = scrambledPieces;
        for (let i = 0; i < scrambleMoves; i++) {
            const randomCircleId = ALL_ROTATABLE_IDS[Math.floor(Math.random() * ALL_ROTATABLE_IDS.length)];
            const randomDirection = Math.random() < 0.5 ? 'cw' : 'ccw';
            const { newPieces } = calculateRotation(currentPieces, randomCircleId, randomDirection);
            currentPieces = newPieces;
        }
    
        setInitialScrambledPieces(currentPieces);
        setPieces(currentPieces);
        setHistory([currentPieces]);
        setMoves(0);
        setSelectedCircleId(null);
        setLastRotationAnimations([]);
        setIsMenuOpen(false);
        setGameState('playing');
        setIsSolved(checkSolved(currentPieces));
        setShowWinModal(false);
        setIsCelebrating(false);
    }, [checkSolved]);

    const handleNewGame = useCallback(() => {
        setGameState('start');
        setIsMenuOpen(false);
        setIsSolved(true);
        setShowWinModal(false);
        setIsCelebrating(false);
    }, []);

    const handleRestart = useCallback(() => {
        setPieces(initialScrambledPieces);
        setMoves(0);
        setHistory([initialScrambledPieces]);
        setSelectedCircleId(null);
        setLastRotationAnimations([]);
        setIsMenuOpen(false);
        setIsSolved(checkSolved(initialScrambledPieces));
        setShowWinModal(false);
        setIsCelebrating(false);
    }, [initialScrambledPieces, checkSolved]);

    const handleUndo = useCallback(() => {
        if (history.length <= 1 || isSolving) return;

        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        setPieces(newHistory[newHistory.length - 1]);
        setMoves(prev => prev - 1);
        setLastRotationAnimations([]);
    }, [history, isSolving]);

    const handleCloseWinModal = useCallback(() => {
        setShowWinModal(false);
    }, []);

    const handleCircleSelect = useCallback((circleId: number) => {
        if (isSolving) return;
        setSelectedCircleId(prevId => prevId === circleId ? null : circleId);
    }, [isSolving]);

    const rotateSelectedCircle = useCallback((direction: 'cw' | 'ccw') => {
        if (selectedCircleId === null || isSolving) return;

        const { newPieces, animations } = calculateRotation(pieces, selectedCircleId, direction);

        setLastRotationAnimations(animations);
        setPieces(newPieces);
        setHistory(prev => [...prev, newPieces]);
        setMoves(prev => prev + 1);

        setTimeout(() => {
            setLastRotationAnimations([]);
        }, 600);

    }, [selectedCircleId, pieces, isSolving]);
    
    const handleSolve = useCallback(() => {
        if (isSolving || isSolved) return;
        
        const solution = solve(pieces);

        if (!solution) {
            alert("解法が見つかりませんでした。パズルが複雑すぎる可能性があります。");
            return;
        }
        
        if (solution.length === 0) return;

        setIsSolving(true);
        setSelectedCircleId(null);

        let currentPieces = pieces;
        const playNextMove = (moveIndex: number) => {
            if (moveIndex >= solution.length) {
                setIsSolving(false);
                setSelectedCircleId(null);
                // Final state check
                const finalSolved = checkSolved(currentPieces);
                setIsSolved(finalSolved);
                 if (finalSolved) {
                    setIsCelebrating(true);
                    setTimeout(() => {
                        setIsCelebrating(false);
                        setShowWinModal(true);
                    }, 2000);
                }
                return;
            }

            const move = solution[moveIndex];
            const { newPieces, animations } = calculateRotation(currentPieces, move.circleId, move.direction);

            setSelectedCircleId(move.circleId);
            setLastRotationAnimations(animations);
            setPieces(newPieces);
            currentPieces = newPieces;

            setTimeout(() => {
                if (moveIndex < solution.length - 1) {
                    setLastRotationAnimations([]);
                }
                playNextMove(moveIndex + 1);
            }, 600);
        };

        playNextMove(0);

    }, [isSolving, isSolved, pieces, checkSolved]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            {gameState === 'start' ? (
                <StartScreen onStartGame={handleStartGame} />
            ) : (
                <>
                    <Menu 
                        isOpen={isMenuOpen}
                        onClose={toggleMenu}
                        onNewGame={handleNewGame}
                        onRestart={handleRestart}
                    />
                    <h1 className="text-4xl font-bold mb-2 text-cyan-300 tracking-wider">Rubik's Kaleido</h1>
                    <p className="text-slate-400 mb-4">各グループを単色に揃えてください。</p>
                    <div className="w-full max-w-4xl aspect-[800/650] relative">
                         <PuzzleBoard 
                            pieces={pieces} 
                            circles={CIRCLES} 
                            selectedCircleId={selectedCircleId}
                            onCircleSelect={handleCircleSelect}
                            lastRotationAnimations={lastRotationAnimations}
                            isSolving={isSolving}
                        />
                        {isCelebrating && <CelebrationOverlay />}
                    </div>
                    <Controls 
                        onMenuClick={toggleMenu} 
                        onRotate={rotateSelectedCircle}
                        onUndo={handleUndo}
                        onSolve={handleSolve}
                        moves={moves} 
                        selectedCircleId={selectedCircleId}
                        isSolving={isSolving}
                        isSolved={isSolved}
                    />
                    {showWinModal && <WinModal onPlayAgain={handleNewGame} moves={moves} onClose={handleCloseWinModal} />}
                </>
            )}
        </div>
    );
};

export default App;
