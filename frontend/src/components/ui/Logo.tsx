import { useEffect, useState } from 'react';
import cn from '@/lib/utils';

type ShakeIntensity = 'none' | 'subtle' | 'normal' | 'strong' | 'extreme' | 'chaotic';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  shakeIntensity?: ShakeIntensity;
  shakeMinInterval?: number;
  shakeMaxInterval?: number;
  shakeDuration?: number;
  noShadow?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 min-h-[2rem] min-w-[2rem]',
  md: 'h-12 w-12 min-h-[3rem] min-w-[3rem]',
  lg: 'h-32 w-32 min-h-[8rem] min-w-[8rem]',
  xl: 'h-48 w-48 min-h-[12rem] min-w-[12rem]',
};

const intensityClasses: Record<ShakeIntensity, string> = {
  none: '',
  subtle: 'animate-shake-subtle',
  normal: 'animate-shake',
  strong: 'animate-shake-strong',
  extreme: 'animate-shake-extreme',
  chaotic: 'animate-shake-chaotic',
};

/**
 * Logo component with configurable random shake animation
 */
export default function Logo({
  size = 'md',
  className,
  onClick,
  shakeIntensity = 'normal',
  shakeMinInterval = 8,
  shakeMaxInterval = 25,
  shakeDuration = 600,
  noShadow = false,
}: LogoProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (shakeIntensity === 'none') return undefined;

    const scheduleNextShake = () => {
      const intervalRange = (shakeMaxInterval - shakeMinInterval) * 1000;
      const nextShakeIn = Math.random() * intervalRange + shakeMinInterval * 1000;

      const timeout = setTimeout(() => {
        setIsShaking(true);

        setTimeout(() => {
          setIsShaking(false);
          scheduleNextShake();
        }, shakeDuration);
      }, nextShakeIn);

      return timeout;
    };

    const timeout = scheduleNextShake();
    return () => clearTimeout(timeout);
  }, [shakeIntensity, shakeMinInterval, shakeMaxInterval, shakeDuration]);

  const containerClasses = cn('relative inline-block', sizeClasses[size], onClick && 'cursor-pointer group', className);

  const imageClasses = cn(
    'h-full w-full rounded-full object-cover transition-transform duration-300',
    !noShadow && 'shadow-[0_10px_25px_rgba(4,7,12,0.45)]',
    onClick && 'group-hover:scale-105',
    isShaking && intensityClasses[shakeIntensity]
  );

  const shakeStyle = isShaking && shakeDuration !== 600 ? { animationDuration: `${shakeDuration}ms` } : undefined;

  const logoElement = (
    <div className={containerClasses}>
      <img src="/logo.png" alt="DAIcer Logo" className={imageClasses} style={shakeStyle} />
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="focus:outline-none">
        {logoElement}
      </button>
    );
  }

  return logoElement;
}
