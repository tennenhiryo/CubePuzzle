
import React from 'react';

interface WinModalProps {
    onPlayAgain: () => void;
    moves: number;
    onClose: () => void;
}

const WinModal: React.FC<WinModalProps> = ({ onPlayAgain, moves, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-8 text-center border border-cyan-500 animate-fade-in relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition-colors duration-200"
                    aria-label="閉じる"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <h2 className="text-4xl font-bold text-yellow-300 mb-2">クリアおめでとう！</h2>
                <p className="text-slate-300 text-lg mb-6">
                    <span className="font-bold text-white">{moves}</span> 手でパズルをクリアしました。
                </p>
                <button
                    onClick={onPlayAgain}
                    className="px-8 py-3 rounded-md font-semibold text-white transition-all duration-200 ease-in-out bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
                >
                    もう一度プレイ
                </button>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WinModal;
