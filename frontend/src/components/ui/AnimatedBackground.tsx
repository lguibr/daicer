export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-600" />

      {/* Moving veils */}
      <div className="absolute inset-0 mix-blend-screen opacity-80">
        <div className="absolute -left-1/3 top-[-12%] h-[80%] w-[85%] rounded-full bg-gradient-to-br from-aurora-400/35 via-aurora-500/18 to-transparent blur-[120px] animate-veil-shift" />
        <div className="absolute -right-1/4 bottom-[-18%] h-[90%] w-[95%] rounded-full bg-gradient-to-bl from-accent/35 via-nebula-400/18 to-transparent blur-[140px] animate-ember-pulse" />
      </div>

      {/* Subtle rune lattice */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(40, 54, 69, 0.3) 1px, transparent 1px),
            linear-gradient(180deg, rgba(40, 54, 69, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '140px 140px',
        }}
      />

      {/* Ember sparks */}
      <div
        className="absolute inset-0 opacity-25 animate-spark-drift"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(231, 178, 88, 0.55), transparent),
            radial-gradient(1.5px 1.5px at 70% 45%, rgba(134, 106, 188, 0.4), transparent),
            radial-gradient(1px 1px at 35% 75%, rgba(211, 143, 31, 0.45), transparent),
            radial-gradient(1.25px 1.25px at 85% 65%, rgba(126, 141, 196, 0.3), transparent)
          `,
        }}
      />

      {/* Horizon glow */}
      <div className="absolute inset-x-[-10%] bottom-[-20%] h-[55%]">
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 via-midnight-800/45 to-transparent blur-[90px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-accent/30 via-aurora-400/25 to-transparent blur-[110px] animate-aurora-pulse" />
      </div>

      {/* Noise layer */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 10%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' fill='none'%3E%3Cpath stroke='rgba(255,255,255,0.06)' stroke-width='0.5' d='M0 80h160M80 0v160'/%3E%3C/svg%3E\")",
          backgroundSize: '100% 100%, 320px 320px',
        }}
      />

      {/* Dark veil for readability */}
      <div className="absolute inset-0 bg-midnight-200/55 backdrop-blur-[1.5px]" />
    </div>
  );
}
