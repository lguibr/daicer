import { Children, useEffect, useId, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import cn from '../../lib/utils';

interface CarouselProps {
  children: ReactNode;
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showControls?: boolean;
  ariaLabel?: string;
  onSlideChange?: (index: number) => void;
  initialIndex?: number;
  frameClassName?: string;
  trackClassName?: string;
  slideClassName?: string;
}

type ValidSlide = ReactElement<Record<string, unknown>>;

function isReactElement(node: ReactNode): node is ValidSlide {
  return typeof node === 'object' && node !== null && 'props' in node;
}

export function Carousel({
  children,
  className,
  autoPlay = true,
  interval = 7000,
  showIndicators = true,
  showControls = true,
  ariaLabel,
  onSlideChange,
  initialIndex,
  frameClassName,
  trackClassName,
  slideClassName,
}: CarouselProps) {
  const regionId = useId();
  const slides = useMemo(() => {
    const nodes = Children.toArray(children);
    return nodes.filter(isReactElement);
  }, [children]);
  const slideCount = slides.length;
  const sanitizeIndex = (index: number | undefined) => {
    if (typeof index !== 'number' || Number.isNaN(index)) {
      return 0;
    }
    const normalized = Math.max(0, Math.floor(index));
    if (slideCount === 0) {
      return normalized;
    }
    if (normalized >= slideCount) {
      return Math.max(0, slideCount - 1);
    }
    return normalized;
  };
  const [currentIndex, setCurrentIndex] = useState(() => sanitizeIndex(initialIndex));
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (typeof initialIndex === 'number') {
      setCurrentIndex(sanitizeIndex(initialIndex));
    }
  }, [initialIndex, slideCount]);

  useEffect(() => {
    if (slideCount === 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((prev) => {
      if (prev < slideCount) {
        return prev;
      }
      return 0;
    });
  }, [slideCount]);

  useEffect(() => {
    if (!autoPlay || isPaused || slideCount <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, interval, isPaused, slideCount]);

  const safeIndex = slideCount === 0 ? 0 : currentIndex % slideCount;

  useEffect(() => {
    onSlideChange?.(safeIndex);
  }, [onSlideChange, safeIndex]);

  const goToSlide = (index: number) => {
    if (slideCount === 0) {
      return;
    }
    const normalized = (index + slideCount) % slideCount;
    setCurrentIndex(normalized);
  };

  const handlePrev = () => {
    goToSlide(safeIndex - 1);
  };

  const handleNext = () => {
    goToSlide(safeIndex + 1);
  };

  return (
    <section
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className={cn('relative w-full', className)}
      id={regionId}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onBlur={() => setIsPaused(false)}
      role="group"
    >
      <div className={cn('overflow-hidden', frameClassName)}>
        <div
          className={cn('flex transition-transform duration-700 ease-out', trackClassName)}
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              aria-hidden={safeIndex !== index}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slideCount}`}
              className={cn('flex w-full flex-shrink-0 flex-col', slideClassName)}
              key={`carousel-slide-${index.toString()}`}
              role="group"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {showControls && slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="group absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-aurora-400/40 bg-midnight-900/80 p-3 text-aurora-200 shadow-lg backdrop-blur transition hover:-translate-y-1/2 hover:border-aurora-300/70 hover:text-aurora-100 lg:flex"
            aria-controls={regionId}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 transition group-hover:-translate-x-0.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="group absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-aurora-400/40 bg-midnight-900/80 p-3 text-aurora-200 shadow-lg backdrop-blur transition hover:-translate-y-1/2 hover:border-aurora-300/70 hover:text-aurora-100 lg:flex"
            aria-controls={regionId}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </>
      )}

      {showIndicators && slideCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {slides.map((_, index) => {
            const isActive = index === safeIndex;
            return (
              <button
                type="button"
                key={`carousel-indicator-${index.toString()}`}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-500',
                  isActive
                    ? 'w-10 bg-gradient-to-r from-aurora-400 via-accent to-nebula-400 shadow-[0_0_18px_rgba(94,234,212,0.35)]'
                    : 'w-2.5 bg-aurora-400/30 hover:bg-aurora-400/60'
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-controls={regionId}
                aria-current={isActive}
                onClick={() => goToSlide(index)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

interface CarouselHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  alignment?: 'left' | 'center';
}

export function CarouselHeader({ eyebrow, title, description, alignment = 'center' }: CarouselHeaderProps) {
  return (
    <div className={cn('space-y-5 max-w-3xl', alignment === 'center' ? 'mx-auto text-center' : 'text-left')}>
      {eyebrow && <p className="text-[0.62rem] uppercase tracking-[0.48em] text-aurora-200/70">{eyebrow}</p>}
      <h2 className="font-display text-3xl tracking-[0.26em] text-aurora-100 sm:text-4xl">{title}</h2>
      {description && <p className="text-base leading-relaxed text-shadow-100/95">{description}</p>}
    </div>
  );
}
