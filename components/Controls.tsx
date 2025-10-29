
import React from 'react';

interface ControlsProps {
    onMenuClick: () => void;
    onRotate: (direction: 'cw' | 'ccw') => void;
    onUndo: () => void;
    onSolve: () => void;
    moves: number;
    selectedCircleId: number | null;
    isSolving: boolean;
    isSolved: boolean;
}

const ControlButton: React.FC<{onClick: () => void, children: React.ReactNode, className?: string, disabled?: boolean, title?: string}> = ({ onClick, children, className = '', disabled = false, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`w-12 h-10 rounded-md font-semibold text-white transition-all duration-200 ease-in-out bg-slate-700 hover:enabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
    >
        {children}
    </button>
);


const Controls: React.FC<ControlsProps> = ({ onMenuClick, onRotate, onUndo, onSolve, moves, selectedCircleId, isSolving, isSolved }) => {
    const isRotationDisabled = selectedCircleId === null || isSolving;
    const isUndoDisabled = moves === 0 || isSolving;
    const isMenuDisabled = isSolving;
    const isSolveDisabled = isSolved || isSolving;

    return (
        <div className="mt-6 flex w-full max-w-lg items-center justify-between px-4">
            <ControlButton onClick={onMenuClick} disabled={isMenuDisabled} title="メニュー">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </ControlButton>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
                <ControlButton onClick={() => onRotate('ccw')} disabled={isRotationDisabled} title="反時計回り">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </ControlButton>

                <div className="flex items-center bg-slate-800 px-3 sm:px-4 py-2 rounded-md space-x-3 sm:space-x-4">
                     <ControlButton onClick={onSolve} disabled={isSolveDisabled} title="自動解決" className="bg-slate-600 hover:enabled:bg-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2 18l-2 4 4-2 16.36-16.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg>
                    </ControlButton>
                    <div className="text-lg text-center min-w-[100px] sm:min-w-[120px]">
                        手数: <span className="font-bold text-yellow-300">{moves}</span>
                    </div>
                </div>
            
                <ControlButton onClick={() => onRotate('cw')} disabled={isRotationDisabled} title="時計回り">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </ControlButton>
            </div>
            
            <ControlButton onClick={onUndo} disabled={isUndoDisabled} title="元に戻す">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18H6.62c-1.9 0-3.62-1.55-3.62-3.47v0c0-1.92 1.72-3.47 3.62-3.47H18"/><polyline points="12 12 18 18 12 24" transform="translate(-0, -6)"/></svg>
            </ControlButton>
        </div>
    );
};

export default Controls;
