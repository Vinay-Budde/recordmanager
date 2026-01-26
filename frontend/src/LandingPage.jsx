import React, { useEffect, useState } from 'react';

export default function LandingPage({ onFinish }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger fade-in animation slightly after mount
        const timerIn = setTimeout(() => setIsVisible(true), 100);

        // Trigger onFinish callback after a delay (e.g., 3 seconds total)
        const timerOut = setTimeout(() => {
            setIsVisible(false); // Optional: fade out
            setTimeout(onFinish, 500); // Wait for fade out to finish before unmounting
        }, 3000);

        return () => {
            clearTimeout(timerIn);
            clearTimeout(timerOut);
        };
    }, [onFinish]);

    return (
        <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center p-8">
                <div className="mb-6 animate-bounce">
                    <span className="text-8xl">🎓</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200 tracking-tight drop-shadow-lg mb-4 transform transition-all duration-1000 translate-y-0">
                    Welcome to
                </h1>
                <h2 className="text-6xl md:text-8xl font-black text-white tracking-widest uppercase drop-shadow-2xl">
                    EduManager
                </h2>
                <p className="mt-8 text-xl text-indigo-200 font-light tracking-wide animate-pulse">
                    Your Gateway to Academic Excellence
                </p>
            </div>
        </div>
    );
}
