import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Paintbrush, Edit3, MessageSquare, Flame, Zap } from 'lucide-react';

interface FloatingItem {
  id: number;
  x: number; // percentage width
  y: number; // percentage height
  scale: number;
  duration: number;
  delay: number;
  type: 'icon' | 'sfx' | 'panel';
  content?: string;
  icon?: React.ReactNode;
  rotate: number;
}

export default function LoginBackground() {
  const sfxList = ["BÙM!", "GÔ GÔ...", "DODODO", "XOẠCH!", "SHIK!", "ZAP!", "KHOAN!"];

  // Generate deterministic-looking random floating elements to keep performance stable
  const floaters: FloatingItem[] = [
    {
      id: 1,
      x: 10,
      y: 20,
      scale: 1.1,
      duration: 18,
      delay: 0,
      type: 'sfx',
      content: 'ドンッ!',
      rotate: -12,
    },
    {
      id: 2,
      x: 82,
      y: 15,
      scale: 1.2,
      duration: 22,
      delay: 1,
      type: 'sfx',
      content: 'GOGO...',
      rotate: 15,
    },
    {
      id: 3,
      x: 75,
      y: 75,
      scale: 0.95,
      duration: 25,
      delay: 3,
      type: 'sfx',
      content: 'シュッ!',
      rotate: -8,
    },
    {
      id: 4,
      x: 14,
      y: 78,
      scale: 1.1,
      duration: 20,
      delay: 2,
      type: 'sfx',
      content: 'DODODO',
      rotate: 10,
    },
    {
      id: 5,
      x: 48,
      y: 8,
      scale: 0.85,
      duration: 24,
      delay: 4,
      type: 'icon',
      icon: <Sparkles className="w-5 h-5 text-[#E63946]" />,
      rotate: 20,
    },
    {
      id: 6,
      x: 88,
      y: 45,
      scale: 1.0,
      duration: 16,
      delay: 1.5,
      type: 'icon',
      icon: <Paintbrush className="w-6 h-6 text-ink-black opacity-80" />,
      rotate: -25,
    },
    {
      id: 7,
      x: 5,
      y: 48,
      scale: 0.95,
      duration: 19,
      delay: 2.5,
      type: 'icon',
      icon: <Edit3 className="w-5 h-5 text-ink-black opacity-70" />,
      rotate: 14,
    },
    {
      id: 8,
      x: 90,
      y: 82,
      scale: 0.8,
      duration: 28,
      delay: 0.5,
      type: 'icon',
      icon: <Zap className="w-6 h-6 text-[#E63946]" />,
      rotate: 35,
    },
    {
      id: 9,
      x: 25,
      y: 10,
      scale: 1.15,
      duration: 21,
      delay: 5,
      type: 'icon',
      icon: <MessageSquare className="w-5 h-5 text-[#E63946]/90" />,
      rotate: -15,
    },
    {
      id: 10,
      x: 65,
      y: 85,
      scale: 0.9,
      duration: 23,
      delay: 3.5,
      type: 'icon',
      icon: <Flame className="w-5 h-5 text-[#E63946]" />,
      rotate: 18,
    },
    {
      id: 11,
      x: 35,
      y: 88,
      scale: 1.05,
      duration: 26,
      delay: 1,
      type: 'sfx',
      content: 'ニヤッ!',
      rotate: -5,
    },
    {
      id: 12,
      x: 80,
      y: 30,
      scale: 1.0,
      duration: 20,
      delay: 2.2,
      type: 'sfx',
      content: 'FLASH!',
      rotate: 22,
    },
    {
      id: 13,
      x: 50,
      y: 85,
      scale: 1.3,
      duration: 17,
      delay: 0.8,
      type: 'sfx',
      content: 'ゴゴゴ...',
      rotate: -15,
    },
    {
      id: 14,
      x: 5,
      y: 35,
      scale: 1.1,
      duration: 23,
      delay: 1.4,
      type: 'sfx',
      content: 'ZAP!',
      rotate: 8,
    }
  ];

  // Dynamic diagonal speed lines configuration
  const speedLines = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    top: `${(i * 7) + 5}%`,
    delay: i * 0.4,
    duration: 3 + (i % 3),
    opacity: 0.04 + (i % 5) * 0.015,
    height: `${1 + (i % 2)}px`,
    width: `${100 + (i % 4) * 50}px`
  }));

  return (
    <div id="login-perf-bg" className="absolute inset-0 overflow-hidden select-none pointer-events-none bg-manuscript-gray">
      {/* 1. Manga Halftone Screentone Panel overlay */}
      <div 
        className="absolute inset-0 opacity-25 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle, #a1a0a5 1.2px, transparent 1.2px)
          `,
          backgroundSize: '16px 16px',
        }}
      />

      {/* 2. Abstract background manga panels layout */}
      <div className="absolute inset-0 z-0 opacity-15 overflow-hidden flex items-center justify-center">
        <div className="w-[140%] h-[140%] grid grid-cols-3 grid-rows-3 gap-6 rotate-[-6deg]">
          <div className="border-4 border-dashed border-ink-black/20 rounded-none bg-white/40 h-full w-full"></div>
          <div className="border-4 border-ink-black/10 rounded-none bg-transparent h-full w-full col-span-2"></div>
          <div className="border-4 border-ink-black/15 rounded-none bg-white/30 h-full w-full col-span-2"></div>
          <div className="border-4 border-dashed border-ink-black/20 rounded-none bg-transparent h-full w-full"></div>
          <div className="border-4 border-ink-black/10 rounded-none bg-white/20 h-full w-full"></div>
          <div className="border-4 border-ink-black/15 rounded-none bg-transparent h-full w-full col-span-2"></div>
        </div>
      </div>

      {/* 3. Action / Speed lines shooting from Left to Right */}
      <div className="absolute inset-x-0 top-0 bottom-0 z-0 overflow-hidden pointer-events-none">
        {speedLines.map((line) => (
          <motion.div
            key={line.id}
            className="absolute bg-gradient-to-r from-transparent via-ink-black to-transparent"
            style={{
              top: line.top,
              height: line.height,
              width: line.width,
              opacity: line.opacity,
            }}
            initial={{ left: '-10%', x: '-100%' }}
            animate={{ 
              left: '110%',
              x: '100%'
            }}
            transition={{
              duration: line.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: line.delay
            }}
          />
        ))}
      </div>

      {/* 4. Giant Anime Speed lines emanating from bottom corners */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-[0.03] z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-ink-black">
          <polygon points="100,100 0,90 100,95" />
          <polygon points="100,100 0,60 100,80" />
          <polygon points="100,100 10,20 100,65" />
          <polygon points="100,100 40,0 100,50" />
          <polygon points="100,100 70,0 100,35" />
          <polygon points="100,100 90,0 100,15" />
        </svg>
      </div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none opacity-[0.03] z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-ink-black rotate-180">
          <polygon points="100,100 0,90 100,95" />
          <polygon points="100,100 0,60 100,80" />
          <polygon points="100,100 10,20 100,65" />
          <polygon points="100,100 40,0 100,50" />
          <polygon points="100,100 70,0 100,35" />
          <polygon points="100,100 90,0 100,15" />
        </svg>
      </div>

      {/* 5. Floating Manga sound elements / Hand-drawn artifacts */}
      {floaters.map((floater) => (
        <motion.div
          key={floater.id}
          className="absolute z-10 pointer-events-none flex items-center justify-center"
          style={{
            left: `${floater.x}%`,
            top: `${floater.y}%`,
          }}
          initial={{ 
            y: 0, 
            rotate: floater.rotate, 
            scale: floater.scale * 0.95,
            opacity: 0.15 
          }}
          animate={{
            y: [-15, 15, -15],
            rotate: [floater.rotate - 5, floater.rotate + 5, floater.rotate - 5],
            scale: [floater.scale * 0.95, floater.scale * 1.05, floater.scale * 0.95],
            opacity: [0.35, 0.65, 0.35]
          }}
          transition={{
            duration: floater.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floater.delay
          }}
        >
          {floater.type === 'sfx' ? (
            <div className="relative group">
              {/* Outer stroke effect styled beautifully */}
              <span className="absolute inset-0 select-none font-syne font-black text-xs text-white stroke-2 pointer-events-none select-none text-center"
                style={{
                  textShadow: '3px 3px 0px #141414, -1px -1px 0px #141414, 1px -1px 0px #141414, -1px 1px 0px #141414, 1px 1px 0px #141414'
                }}
              >
                {floater.content}
              </span>
              <span className="relative select-none font-syne font-black text-xs text-[#E63946] pointer-events-none select-none text-center block transform -skew-x-6 tracking-wide">
                {floater.content}
              </span>
            </div>
          ) : (
            <div className="p-2 border border-ink-black/20 bg-white/60 backdrop-blur-xs rounded-none shadow-[2px_2px_0px_rgba(20,20,20,0.08)]">
              {floater.icon}
            </div>
          )}
        </motion.div>
      ))}

      {/* 6. Pure Ink splatter dynamic overlays */}
      <div className="absolute top-[15%] right-[25%] opacity-[0.03] w-24 h-24 bg-ink-black rounded-full filter blur-xl animate-pulse" />
      <div className="absolute bottom-[20%] left-[20%] opacity-[0.03] w-32 h-32 bg-[#E63946] rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}
