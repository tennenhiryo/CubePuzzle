
import React, { useState } from 'react';

interface StartScreenProps {
    onStartGame: (scrambleMoves: number) => void;
}

const DifficultyButton: React.FC<{onClick: () => void, children: React.ReactNode, description: string}> = ({ onClick, children, description }) => (
    <button
        onClick={onClick}
        className="w-full px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ease-in-out bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 text-left"
    >
        <span className="text-xl">{children}</span>
        <span className="block text-sm text-slate-400">{description}</span>
    </button>
);


const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
    const [customMoves, setCustomMoves] = useState<string>('25');

    const handleCustomStart = () => {
        const moves = parseInt(customMoves, 10);
        if (!isNaN(moves) && moves > 0) {
            onStartGame(moves);
        }
    };
    
    const isCustomStartDisabled = !customMoves || parseInt(customMoves, 10) <= 0 || parseInt(customMoves, 10) > 999;


    return (
        <div className="flex flex-col items-center justify-center text-center max-w-md w-full animate-fade-in">
             <h1 className="text-5xl font-bold mb-2 text-cyan-300 tracking-wider">ルービック・カレイド</h1>
             <p className="text-slate-400 mb-8 text-lg">難易度を選択して開始してください。</p>
             <div className="w-full space-y-4">
                <DifficultyButton onClick={() => onStartGame(5)} description="ウォーミングアップに最適 (5回転)">
                    かんたん
                </DifficultyButton>
                 <DifficultyButton onClick={() => onStartGame(10)} description="標準的な難易度 (10回転)">
                    ふつう
                </DifficultyButton>
                 <DifficultyButton onClick={() => onStartGame(15)} description="熟練者向け (15回転)">
                    むずかしい
                </DifficultyButton>
                 <DifficultyButton onClick={() => onStartGame(50)} description="論理の限界に挑戦 (50回転)">
                    エキスパート
                </DifficultyButton>
             </div>

            <div className="my-6 flex items-center w-full">
                <div className="flex-grow border-t border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-400">または</span>
                <div className="flex-grow border-t border-slate-600"></div>
            </div>

            <div className="w-full space-y-3">
                <label htmlFor="custom-moves" className="text-xl font-semibold text-white">カスタム難易度</label>
                <p className="text-sm text-slate-400 -mt-2 mb-2">回転数を入力してください (1-999)。</p>
                <div className="flex space-x-2">
                    <input
                        type="number"
                        id="custom-moves"
                        value={customMoves}
                        onChange={(e) => setCustomMoves(e.target.value)}
                        min="1"
                        max="999"
                        className="flex-grow w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white text-center text-lg"
                        placeholder="例: 25"
                    />
                    <button
                        onClick={handleCustomStart}
                        className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ease-in-out bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600"
                        disabled={isCustomStartDisabled}
                    >
                        スタート
                    </button>
                </div>
            </div>

             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
                /* Hide number input arrows */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                  -webkit-appearance: none; 
                  margin: 0; 
                }
                input[type=number] {
                  -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
};

export default StartScreen;