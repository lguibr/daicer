import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

import cn from '@/lib/utils';
import { Carousel } from '../Carousel';

export type SpotlightCarouselSize = 'sm' | 'md' | 'lg';
export type SpotlightCarouselLayout = 'split' | 'stacked';

export interface SpotlightCarouselItem {
  id: string;
  badge?: string;
  eyebrow?: string;
  title: string;
  description: string;
  accent?: string;
  icon?: ReactNode;
  media?: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SpotlightCarouselProps {
  items: SpotlightCarouselItem[];
  className?: string;
  size?: SpotlightCarouselSize;
  layout?: SpotlightCarouselLayout;
  autoPlay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showControls?: boolean;
  ariaLabel?: string;
  startIndex?: number;
  onSlideChange?: (index: number) => void;
  frameClassName?: string;
  slideClassName?: string;
  itemClassName?: string;
  contentClassName?: string;
  mediaClassName?: string;
  renderItem?: (params: {
    item: SpotlightCarouselItem;
    index: number;
    isActive: boolean;
    size: SpotlightCarouselSize;
    layout: SpotlightCarouselLayout;
  }) => ReactNode;
}

const SIZE_CLASS_MAP: Record<
  SpotlightCarouselSize,
  {
    title: string;
    description: string;
    badge: string;
    icon: string;
    eyebrow: string;
    accent: string;
    spacing: string;
  }
> = {
  sm: {
    title: 'text-2xl tracking-[0.18em]',
    description: 'text-sm leading-relaxed',
    badge: 'text-[0.62rem] tracking-[0.46em]',
    icon: 'h-14 w-14 text-2xl',
    eyebrow: 'text-[0.62rem] tracking-[0.48em]',
    accent: 'text-[0.68rem] tracking-[0.48em]',
    spacing: 'gap-4',
  },
  md: {
    title: 'text-3xl tracking-[0.22em]',
    description: 'text-base leading-relaxed',
    badge: 'text-[0.7rem] tracking-[0.5em]',
    icon: 'h-16 w-16 text-3xl',
    eyebrow: 'text-[0.7rem] tracking-[0.5em]',
    accent: 'text-[0.72rem] tracking-[0.5em]',
    spacing: 'gap-5',
  },
  lg: {
    title: 'text-4xl tracking-[0.24em]',
    description: 'text-lg leading-relaxed',
    badge: 'text-[0.78rem] tracking-[0.52em]',
    icon: 'h-20 w-20 text-3xl',
    eyebrow: 'text-[0.74rem] tracking-[0.52em]',
    accent: 'text-[0.74rem] tracking-[0.52em]',
    spacing: 'gap-6',
  },
};

export function SpotlightCarousel({
  items,
  className,
  size = 'md',
  layout = 'split',
  autoPlay = true,
  interval = 8000,
  showIndicators = true,
  showControls = true,
  ariaLabel,
  startIndex,
  onSlideChange,
  frameClassName,
  slideClassName,
  itemClassName,
  contentClassName,
  mediaClassName,
  renderItem,
}: SpotlightCarouselProps) {
  const sanitizedItems = useMemo(
    () => items.filter((item): item is SpotlightCarouselItem => Boolean(item && item.id)),
    [items]
  );
  const slideCount = sanitizedItems.length;
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (typeof startIndex === 'number' && slideCount > 0) {
      const clamped = Math.max(0, Math.min(slideCount - 1, Math.floor(startIndex)));
      return clamped;
    }
    return 0;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex((prev) => {
      if (slideCount === 0) {
        return 0;
      }
      if (prev >= slideCount) {
        return slideCount - 1;
      }
      return prev;
    });
  }, [slideCount]);

  useEffect(() => {
    if (typeof startIndex === 'number' && slideCount > 0) {
      const clamped = Math.max(0, Math.min(slideCount - 1, Math.floor(startIndex)));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(clamped);
    }
  }, [startIndex, slideCount]);

  const sizeClasses = SIZE_CLASS_MAP[size];
  const gridTemplate =
    layout === 'split' ? 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'flex flex-col gap-6';
  const computedSlideClassName = cn('w-full flex-shrink-0', slideClassName);
  const baseItemClass = cn(
    gridTemplate,
    'w-full h-full items-center',
    layout === 'split' ? 'text-left' : 'text-center',
    itemClassName
  );
  const baseContentClass = cn(
    'flex flex-col justify-center',
    sizeClasses.spacing,
    layout === 'split' ? 'lg:text-left text-center' : 'text-center',
    contentClassName
  );
  const baseMediaClass = cn('flex items-center justify-center', mediaClassName);

  return (
    <Carousel
      className={className}
      autoPlay={autoPlay}
      interval={interval}
      showIndicators={showIndicators}
      showControls={showControls}
      ariaLabel={ariaLabel}
      initialIndex={startIndex}
      frameClassName={frameClassName}
      slideClassName={computedSlideClassName}
      onSlideChange={(index) => {
        setActiveIndex(index);
        onSlideChange?.(index);
      }}
      trackClassName="items-stretch"
    >
      {sanitizedItems.map((item, index) => {
        const isActive = index === activeIndex;

        if (renderItem) {
          return (
            <div key={item.id} className="flex h-full w-full flex-col">
              {renderItem({ item, index, isActive, size, layout })}
            </div>
          );
        }

        return (
          <div key={item.id} className={baseItemClass} data-active={isActive}>
            <div
              className={cn(
                baseContentClass,
                isActive ? 'animate-in fade-in slide-in-from-bottom-4 duration-400' : 'opacity-60 transition-opacity'
              )}
              aria-hidden={!isActive}
            >
              <div className="flex flex-col items-center justify-center gap-3 lg:items-start lg:justify-start">
                <div className="flex items-center gap-3">
                  {item.badge ? (
                    <span
                      className={cn(
                        'inline-flex rounded-full border border-aurora-400/30 px-4 py-2 font-display uppercase text-aurora-200',
                        sizeClasses.badge
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                  {item.icon ? (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full border border-aurora-300/40 bg-gradient-to-br from-aurora-500/20 via-midnight-900/80 to-nebula-500/30 text-aurora-50 shadow-[0_18px_42px_rgba(45,212,191,0.28)]',
                        sizeClasses.icon
                      )}
                    >
                      {item.icon}
                    </span>
                  ) : null}
                </div>

                {item.eyebrow ? (
                  <p
                    className={cn(
                      'flex items-center gap-2 uppercase text-aurora-200/80',
                      sizeClasses.eyebrow,
                      layout === 'split' ? 'justify-start' : 'justify-center'
                    )}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-aurora-400/25 bg-midnight-700/70">
                      <Sparkles className="h-3 w-3 text-nebula-200" aria-hidden="true" />
                    </span>
                    {item.eyebrow}
                  </p>
                ) : null}
              </div>

              <h3 className={cn('font-display uppercase text-aurora-100', sizeClasses.title)}>{item.title}</h3>
              <p className={cn('text-shadow-200', sizeClasses.description)}>{item.description}</p>
              {item.accent ? (
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-full border border-aurora-400/25 px-4 py-2 uppercase text-aurora-100/90',
                    sizeClasses.accent,
                    layout === 'split' ? 'self-start' : 'self-center'
                  )}
                >
                  {item.accent}
                </span>
              ) : null}
              {item.ctaLabel && item.ctaHref ? (
                <a
                  href={item.ctaHref}
                  className="btn-secondary inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em]"
                >
                  {item.ctaLabel}
                </a>
              ) : null}
            </div>

            {item.media ? (
              <div className={baseMediaClass} aria-hidden={!isActive}>
                {item.media}
              </div>
            ) : null}
          </div>
        );
      })}
    </Carousel>
  );
}
