import { Sparkles } from 'lucide-react';

import cn from '@/lib/utils';
import type { SpotlightCarouselItem } from '../ui';

interface JoinHeroSlideProps {
  item: SpotlightCarouselItem;
  isActive: boolean;
  slideIndex: number;
}

export function JoinHeroSlide({ item, isActive, slideIndex }: JoinHeroSlideProps) {
  return (
    <article
      className={cn(
        'flex w-full flex-col gap-8 lg:flex-row lg:items-center',
        isActive ? 'opacity-100' : 'opacity-60 transition-opacity duration-300'
      )}
      data-slide-index={slideIndex}
    >
      <div className="flex flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
        <div className="flex items-center gap-3">
          {item.icon ? (
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-aurora-300/35 bg-gradient-to-br from-aurora-500/20 via-midnight-900/75 to-nebula-500/28 text-aurora-50 shadow-[0_18px_42px_rgba(45,212,191,0.28)]">
              {item.icon}
            </span>
          ) : null}
        </div>

        {item.eyebrow ? (
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.36em] text-aurora-100/80">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-aurora-400/25 bg-midnight-700/70">
              <Sparkles className="h-3 w-3 text-nebula-200" aria-hidden="true" />
            </span>
            {item.eyebrow}
          </p>
        ) : null}

        <h3 className="font-display text-3xl uppercase tracking-[0.14em] text-aurora-50 sm:text-4xl">{item.title}</h3>
        <p className="max-w-xl text-base leading-relaxed text-shadow-200 sm:text-lg sm:leading-8">{item.description}</p>

        {item.accent ? (
          <span className="inline-flex items-center justify-center rounded-xl border border-aurora-400/30 px-5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-aurora-100/90">
            {item.accent}
          </span>
        ) : null}

        {item.ctaLabel && item.ctaHref ? (
          <a
            href={item.ctaHref}
            className="btn-secondary inline-flex items-center justify-center rounded-full px-7 py-3 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            {item.ctaLabel}
          </a>
        ) : null}
      </div>

      {item.media ? <div className="flex flex-1 items-center justify-center">{item.media}</div> : null}
    </article>
  );
}
