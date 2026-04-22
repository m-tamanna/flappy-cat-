import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, Home, Settings, Trophy as BestIcon, Volume2, Pause } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('flappy-cat-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('flappy-cat-highscore', finalScore.toString());
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none bg-[#a1c4fd]">
      {/* Game Stage */}
      <div className="absolute inset-0 w-full h-full">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState}
          score={score}
          setScore={setScore}
          onGameOver={handleGameOver}
        />
      </div>

      {/* In-Game Score UI (Sleek Badge) */}
      {gameState === GameState.PLAYING && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-8 left-8 z-50 pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.05)] border-2 border-white/50 flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-[#6a82fb]">Score</span>
            <span className="text-2xl font-black text-slate-700">{score}</span>
          </div>
        </motion.div>
      )}

      {/* High Score Badge (Sleek style) */}
      {gameState === GameState.PLAYING && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-8 right-8 z-50"
        >
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.05)] border-2 border-white/50 flex items-center gap-2">
             <BestIcon className="w-4 h-4 text-[#ffd8b1]" />
             <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Best</span>
             <span className="text-2xl font-black text-slate-700">{highScore}</span>
          </div>
        </motion.div>
      )}

      {/* Overlays */}
      <AnimatePresence mode="wait">
        {gameState === GameState.START && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-transparent p-6 pointer-events-none"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/85 backdrop-blur-xl p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white text-center w-full max-w-md pointer-events-auto"
            >
              <div className="text-8xl mb-4">🐱</div>
              <h1 className="text-6xl md:text-7xl font-black text-[#6a82fb] drop-shadow-[3px_3px_0_white] tracking-tight mb-2 uppercase">
                Flappy Cat
              </h1>
              <p className="text-slate-500 font-medium mb-8">
                Flap your butterfly wings and explore the garden!
              </p>

              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState(GameState.PLAYING)}
                  className="bg-gradient-to-br from-[#fbc2eb] to-[#e6a8d7] text-white px-10 py-4 rounded-full font-extrabold uppercase tracking-[2px] shadow-[0_8px_15px_rgba(251,194,235,0.4)] transition-transform flex items-center gap-3 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Adventure
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === GameState.GAME_OVER && (
          <motion.div
            key="game-over"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/85 backdrop-blur-xl p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white text-center w-full max-w-sm pointer-events-auto"
            >
              <div className="text-8xl mb-4">🥺</div>
              <h2 className="text-5xl font-black text-[#ff9a9e] drop-shadow-[2px_2px_0_white] mb-6 uppercase">Oopsie!</h2>
              
              <div className="flex flex-col gap-4 mb-8">
                <div className="bg-slate-50/50 p-4 rounded-3xl border-2 border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Final Score</span>
                  <span className="text-5xl font-black text-slate-700 tracking-tight">{score}</span>
                </div>
                
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-3xl border-2 border-slate-100">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-[#ffd8b1]" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Best</span>
                  </div>
                  <span className="text-2xl font-black text-slate-700">{highScore}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState(GameState.PLAYING)}
                  className="bg-gradient-to-br from-[#fbc2eb] to-[#e6a8d7] text-white py-4 px-10 rounded-full font-black uppercase tracking-[2px] shadow-[0_8px_15px_rgba(251,194,235,0.4)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Try Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState(GameState.START)}
                  className="bg-white/90 text-slate-400 py-4 px-10 rounded-full border-2 border-slate-100 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" /> Home
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
