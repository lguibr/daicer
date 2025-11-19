export const gildedTokens = {
  pageShell:
    'relative mx-auto flex min-h-dvh w-full flex-col items-center gap-16 overflow-hidden px-6 pb-20 pt-16 sm:px-10 lg:px-16 xl:max-w-6xl',
  gradientBackdrop:
    'pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,215,166,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(119,71,255,0.25),transparent_62%)]',
  heroStack: 'relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 text-center',
  heroEyebrow: 'text-[0.68rem] uppercase tracking-[0.55em] text-aurora-100/75',
  heroTitle: 'font-display text-4xl uppercase tracking-[0.24em] text-aurora-50 sm:text-5xl lg:text-[3.5rem]',
  heroBody: 'mx-auto max-w-2xl text-base leading-relaxed text-shadow-100/90 sm:text-lg',
  haloBadge:
    'relative flex h-44 w-44 items-center justify-center rounded-full border border-aurora-400/40 bg-midnight-900/60 shadow-[0_60px_120px_rgba(4,8,18,0.65)]',
  haloInnerGlow:
    'pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-aurora-400/20 via-transparent to-nebula-500/25 blur-[80px]',
  glassPanel:
    'rounded-[32px] border border-aurora-400/25 bg-midnight-950/50 p-8 shadow-[0_40px_90px_rgba(4,7,16,0.55)] backdrop-blur-xl',
  inlineBadge:
    'inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-aurora-100/80',
  sectionHeading: 'font-display text-3xl uppercase tracking-[0.22em] text-aurora-50 sm:text-4xl',
  sectionBody: 'text-base leading-relaxed text-shadow-200 sm:text-lg sm:leading-8',
  detailCopy: 'text-sm leading-relaxed text-shadow-300 sm:text-base',
  monoInput:
    'w-full rounded-3xl border border-midnight-600/80 bg-midnight-800/70 px-4 py-5 text-center font-mono text-2xl tracking-[0.5em] text-shadow-50 transition focus:border-aurora-300 focus:ring-2 focus:ring-aurora-300/40 focus:outline-none sm:text-3xl',
  primaryAction: 'btn-primary w-full py-4 text-sm font-semibold uppercase tracking-[0.32em] sm:w-auto sm:px-12',
  secondaryAction: 'btn-secondary w-full py-4 text-sm font-semibold uppercase tracking-[0.32em]',
  divider: 'h-px w-full bg-white/5',
} as const;

export type GildedTokens = typeof gildedTokens;
