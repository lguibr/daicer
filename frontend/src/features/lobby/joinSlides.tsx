import { useMemo } from 'react';
import { Palette, ScrollText } from 'lucide-react';
import { type SpotlightCarouselItem } from '../../components/ui';
import { useI18n } from '../../i18n';

export type JoinSlideId = 'assets' | 'rules';

const privateOrder: JoinSlideId[] = ['assets', 'rules'];
const publicOrder: JoinSlideId[] = ['rules'];

const buildSlides = (t: ReturnType<typeof useI18n>['t']): Record<JoinSlideId, SpotlightCarouselItem> => ({
  assets: {
    id: 'assets',
    eyebrow: t('lobby.joinHero.slides.assets.eyebrow'),
    title: t('lobby.joinHero.slides.assets.title'),
    description: t('lobby.joinHero.slides.assets.description'),
    accent: t('lobby.joinHero.slides.assets.accent'),
    icon: <Palette className="h-10 w-10 text-aurora-100" aria-hidden="true" />,
    ctaLabel: t('lobby.joinHero.slides.assets.cta'),
    ctaHref: '/assets',
  },
  rules: {
    id: 'rules',
    eyebrow: t('lobby.joinHero.slides.rules.eyebrow'),
    title: t('lobby.joinHero.slides.rules.title'),
    description: t('lobby.joinHero.slides.rules.description'),
    accent: t('lobby.joinHero.slides.rules.accent'),
    icon: <ScrollText className="h-10 w-10 text-nebula-100" aria-hidden="true" />,
    ctaLabel: t('lobby.joinHero.slides.rules.cta'),
    ctaHref: '/explore',
  },
});

export const useJoinSlides = (variant: 'private' | 'public' = 'private') => {
  const { t } = useI18n();

  return useMemo(() => {
    const slides = buildSlides(t);
    const order = variant === 'public' ? publicOrder : privateOrder;
    return order.map((id) => slides[id]);
  }, [t, variant]);
};
