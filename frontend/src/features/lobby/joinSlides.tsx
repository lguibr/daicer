import { useMemo } from 'react';
import { BookOpen, Palette, ScrollText, Swords } from 'lucide-react';
import { DiceLoader, type SpotlightCarouselItem } from '../../components/ui';
import { useI18n } from '../../i18n';

export type JoinSlideId = 'spellbook' | 'combat' | 'assets' | 'rules';

const privateOrder: JoinSlideId[] = ['spellbook', 'combat', 'assets', 'rules'];
const publicOrder: JoinSlideId[] = ['spellbook', 'combat', 'rules'];

const buildSlides = (t: ReturnType<typeof useI18n>['t']): Record<JoinSlideId, SpotlightCarouselItem> => ({
  spellbook: {
    id: 'spellbook',
    eyebrow: t('lobby.joinHero.slides.spellbook.eyebrow'),
    title: t('lobby.joinHero.slides.spellbook.title'),
    description: t('lobby.joinHero.slides.spellbook.description'),
    accent: t('lobby.joinHero.slides.spellbook.accent'),
    icon: <BookOpen className="h-10 w-10 text-aurora-200" aria-hidden="true" />,
    ctaLabel: t('lobby.joinHero.slides.spellbook.cta'),
    ctaHref: '/spellbook-demo',
  },
  combat: {
    id: 'combat',
    eyebrow: t('lobby.joinHero.slides.combat.eyebrow'),
    title: t('lobby.joinHero.slides.combat.title'),
    description: t('lobby.joinHero.slides.combat.description'),
    accent: t('lobby.joinHero.slides.combat.accent'),
    icon: <Swords className="h-10 w-10 text-nebula-200" aria-hidden="true" />,
    media: (
      <DiceLoader
        size="large"
        diceCount={1}
        dieType={20}
        maxDiceCount={3}
        showMessage={false}
        className="mx-auto h-[220px] w-[220px] sm:h-[240px] sm:w-[240px] lg:h-[260px] lg:w-[260px]"
      />
    ),
    ctaLabel: t('lobby.joinHero.slides.combat.cta'),
    ctaHref: '/combat-demo',
  },
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
