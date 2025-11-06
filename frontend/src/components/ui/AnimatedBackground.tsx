import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base midnight gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight-100 via-midnight-300 to-midnight-600" />

      {/* Aurora ribbons */}
      <div className="absolute inset-x-[-30%] top-[-10%] h-[70%] rotate-2 opacity-60 mix-blend-screen">
        <div
          className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-aurora-300 via-nebula-300 to-aurora-500 rounded-[45%] blur-3xl animate-aurora-wave"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute inset-x-[10%] top-1/4 h-[80%] bg-gradient-to-r from-nebula-200 via-aurora-200 to-nebula-400 rounded-[55%] blur-[80px] animate-aurora-wave"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Lower horizon glow */}
      <div className="absolute inset-x-[-20%] bottom-[-15%] h-[45%] opacity-70">
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-midnight-600 via-midnight-400/70 to-transparent blur-3xl" />
        <div
          className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-aurora-400/40 via-nebula-300/30 to-transparent blur-[120px] animate-aurora-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Star field */}
      <div
        className="absolute inset-0 opacity-30 animate-stars-twinkle"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.6), transparent),
            radial-gradient(1.5px 1.5px at 70% 40%, rgba(150, 208, 255, 0.6), transparent),
            radial-gradient(1.5px 1.5px at 40% 70%, rgba(230, 200, 255, 0.55), transparent),
            radial-gradient(2px 2px at 80% 80%, rgba(255, 255, 255, 0.45), transparent)
          `,
        }}
      />

      {/* Grid veneer */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(transparent 95%, rgba(255, 255, 255, 0.05) 95%),
            linear-gradient(90deg, transparent 95%, rgba(255, 255, 255, 0.05) 95%)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-midnight-200/60 backdrop-blur-[1px]" />
    </div>
  );
}

