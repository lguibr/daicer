import clsx from 'clsx';
import type { ComponentType } from 'react';

interface ImageThumbnailProps {
  imageUrl?: string | null;
  alt: string;
  icon: ComponentType<{ className?: string }>;
  size?: number;
  className?: string;
  iconClassName?: string;
}

/**
 * Renders a square thumbnail that falls back to an icon when no image URL is provided.
 */
export default function ImageThumbnail({
  imageUrl,
  alt,
  icon: Icon,
  size = 72,
  className,
  iconClassName,
}: ImageThumbnailProps) {
  const dimensionStyle = { width: size, height: size };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        style={dimensionStyle}
        className={clsx(
          'rounded-xl border border-midnight-500/50 object-cover shadow-[0_12px_28px_rgba(8,12,20,0.42)]',
          className
        )}
      />
    );
  }

  return (
    <div
      style={dimensionStyle}
      className={clsx(
        'flex items-center justify-center rounded-xl border border-midnight-500/60 bg-midnight-500/50 text-aurora-300 shadow-[0_12px_28px_rgba(8,12,20,0.42)]',
        className
      )}
    >
      <Icon className={clsx('h-8 w-8', iconClassName)} aria-hidden="true" />
      <span className="sr-only">{alt}</span>
    </div>
  );
}
