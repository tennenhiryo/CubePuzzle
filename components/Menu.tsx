
import React from 'react';

interface MenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNewGame: () => void;
    onRestart: () => void;
}

const MenuButton: React.FC<{onClick: () => void, children: React.ReactNode, className?: string}> = ({ onClick, children, className = '' }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-6 py-3 rounded-md font-semibold text-white transition-colors duration-200 ease-in-out text-lg ${className}`}
    >
        {children}
    </button>
);


const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onNewGame, onRestart }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 z-40 animate-fade-in-fast"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="fixed top-0 left-0 h-full z-50 bg-slate-800 shadow-2xl w-64 animate-slide-in"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the menu from closing it
            >
                <div className="p-4 pt-8">
                     <h2 className="text-xl font-bold text-cyan-300 px-6 pb-4">メニュー</h2>
                    <MenuButton onClick={onNewGame} className="hover:bg-slate-700">
                        新しいゲーム
                    </MenuButton>
                    <MenuButton onClick={onRestart} className="hover:bg-slate-700">
                        リスタート
                    </MenuButton>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.3s ease-out forwards;
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Menu;
