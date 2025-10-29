
import React, { useState, useEffect } from 'react';
import { COLORS } from '../types';

const CONFETTI_COUNT = 150;
const SPARKLE_COUNT = 50;
const COLORS_ARRAY = Object.values(COLORS);

// Fix: Define a custom CSS properties type to allow for CSS variables (e.g., '--final-x').
// React's default CSSProperties type does not include support for custom properties.
interface CustomCSSProperties extends React.CSSProperties {
    [key: `--${string}`]: string | number;
}

interface Particle {
    id: string;
    style: CustomCSSProperties;
    type: 'confetti' | 'sparkle';
}

const CelebrationOverlay: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles: Particle[] = [];
        
        // 1. Generate Confetti that bursts outwards
        for (let i = 0; i < CONFETTI_COUNT; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const velocity = 250 + Math.random() * 350; // Explosion force
            const finalX = Math.cos(angle) * velocity;
            // Create a parabolic arc for a more natural falling effect
            const finalY = Math.sin(angle) * velocity * 0.5 + (velocity * 1.2); 

            const rotation = Math.random() * 1080 - 540;
            const shape = ['circle', 'rect'][Math.floor(Math.random() * 2)];
            const width = 6 + Math.random() * 8;

            newParticles.push({
                id: `c-${i}`,
                type: 'confetti',
                style: {
                    '--final-x': `${finalX}px`,
                    '--final-y': `${finalY}px`,
                    '--rotation': `${rotation}deg`,
                    left: '50%',
                    top: '50%',
                    backgroundColor: COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)],
                    animationDelay: `${Math.random() * 0.15}s`, // Near-simultaneous burst
                    animationDuration: `${1.5 + Math.random() * 0.5}s`,
                    width: `${width}px`,
                    height: shape === 'rect' ? `${width * 1.5}px` : `${width}px`,
                    borderRadius: shape === 'circle' ? '50%' : '2px',
                }
            });
        }
        
        // 2. Generate Sparkles that blink around the center
        for (let i = 0; i < SPARKLE_COUNT; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * 200; // Spread sparkles in a radius

            newParticles.push({
                id: `s-${i}`,
                type: 'sparkle',
                style: {
                    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                    top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                    backgroundColor: COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)],
                    animationDelay: `${Math.random() * 1}s`,
                    animationDuration: `${0.5 + Math.random() * 1}s`,
                    width: '3px',
                    height: '3px',
                }
            });
        }
        
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
            {/* Background Radial Flash */}
            <div className="absolute inset-0 flex items-center justify-center">
                 <div 
                    className="w-2/3 max-w-2xl aspect-square rounded-full animate-radial-flash" 
                    style={{
                        background: 'radial-gradient(circle, rgba(253, 224, 71, 0.5) 0%, rgba(253, 224, 71, 0) 70%)',
                        filter: 'blur(20px)'
                    }}
                ></div>
            </div>
           
            {particles.map(p => (
                <div 
                    key={p.id} 
                    className={`absolute ${p.type === 'confetti' ? 'animate-confetti-burst' : 'animate-sparkle-blink rounded-full'}`} 
                    style={p.style}
                ></div>
            ))}

            <style>{`
                @keyframes confetti-burst {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(-50% + var(--final-x)), calc(-50% + var(--final-y))) rotate(var(--rotation)) scale(0);
                        opacity: 0;
                    }
                }
                
                @keyframes sparkle-blink {
                    0%, 100% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.5);
                        opacity: 1;
                    }
                }

                @keyframes radial-flash {
                    0% {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                    }
                    100% {
                        transform: scale(3.5);
                        opacity: 0;
                    }
                }

                .animate-confetti-burst {
                    animation-name: confetti-burst;
                    animation-timing-function: cubic-bezier(0.1, 1, 0.7, 1);
                    animation-fill-mode: forwards;
                }
                .animate-sparkle-blink {
                    animation-name: sparkle-blink;
                    animation-timing-function: ease-in-out;
                    animation-fill-mode: forwards;
                }
                .animate-radial-flash {
                    animation: radial-flash 1.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CelebrationOverlay;
