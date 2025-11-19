import clsx from 'clsx';

interface CrestIconProps {
  size?: number;
  className?: string;
  title?: string;
  glow?: boolean;
}

/**
 * Ornamental crest icon for branding and hero treatments.
 */
export default function CrestIcon({ size = 120, className, title = 'D20 Crest', glow = true }: CrestIconProps) {
  return (
    <span
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full',
        glow &&
          'before:absolute before:inset-[-18%] before:rounded-full before:bg-gradient-to-br before:from-aurora-400/40 before:via-aurora-500/20 before:to-transparent before:blur-3xl before:content-[""]',
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 144 144"
        role="img"
        aria-label={title}
        className="relative drop-shadow-[0_8px_24px_rgba(12,16,24,0.45)]"
      >
        <defs>
          <linearGradient id="crest-gradient" x1="16%" y1="0%" x2="84%" y2="100%">
            <stop offset="0%" stopColor="#2f3b4a" />
            <stop offset="45%" stopColor="#1c242f" />
            <stop offset="100%" stopColor="#0f141a" />
          </linearGradient>
          <linearGradient id="crest-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c5a163" />
            <stop offset="50%" stopColor="#d38f1f" />
            <stop offset="100%" stopColor="#b67c17" />
          </linearGradient>
        </defs>

        <g filter="url(#shadow-soft)">
          <path
            d="M72 6C46 15 24 21 24 21v42c0 28.5 17.5 55.2 46.3 68.5a8 8 0 0 0 6.6 0C105.5 118.2 123 91.5 123 63V21s-22-6-51-15Z"
            fill="url(#crest-gradient)"
            stroke="url(#crest-edge)"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path
            d="M72 26 52.5 88.2 72 79l19.5 9.2L72 26Zm0 67.5L52 102.4l20 9.6 20-9.6L72 93.5Z"
            fill="#d38f1f"
            opacity={0.85}
          />
          <path
            d="M72 33.5 57 80.2l15-6.9 15 6.9L72 33.5Zm0 51.6-14.8 7L72 99l14.8-6.9L72 85.1Z"
            fill="#1c242f"
            opacity={0.7}
          />
          <circle cx="72" cy="63" r="14" stroke="#d38f1f" strokeWidth="3" fill="none" />
          <path d="M72 51c-6.6 0-12 5.4-12 12h6c0-3.3 2.7-6 6-6s6 2.7 6 6h6c0-6.6-5.4-12-12-12Z" fill="#e7b258" />
          <path d="M72 70.5c-6 0-11 4.5-11 10.5h22c0-6-5-10.5-11-10.5Z" fill="#b67c17" opacity={0.55} />
        </g>
        <defs>
          <filter id="shadow-soft">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(12,16,24,0.45)" />
          </filter>
        </defs>
      </svg>
    </span>
  );
}
