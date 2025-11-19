/**
 * Assets Hub Page
 *
 * Main page for asset generation and management
 */

import { Link } from 'react-router-dom';
import { Palette, ScrollText, Box, Users, Building2 } from 'lucide-react';
import { PrivateLayout } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { useI18n } from '../i18n';

const cards = [
  {
    key: 'images',
    href: '/assets/2d',
    icon: Palette,
    iconGradient: 'from-aurora-300 via-aurora-400 to-ember-500',
    borderClass: 'border-aurora-400/40',
    glowClass: 'hover:shadow-[0_22px_70px_rgba(218,130,22,0.25)]',
  },
  {
    key: 'models',
    href: '/assets/3d',
    icon: Box,
    iconGradient: 'from-shadow-200 via-shadow-300 to-shadow-500',
    borderClass: 'border-shadow-400/40',
    glowClass: 'hover:shadow-[0_22px_70px_rgba(155,123,89,0.25)]',
  },
  {
    key: 'maps',
    href: '/assets/maps',
    icon: ScrollText,
    iconGradient: 'from-nebula-200 via-nebula-300 to-midnight-500',
    borderClass: 'border-nebula-400/40',
    glowClass: 'hover:shadow-[0_22px_70px_rgba(156,94,245,0.25)]',
  },
  {
    key: 'structures',
    href: '/assets/structures',
    icon: Building2,
    iconGradient: 'from-shadow-200 via-ember-300 to-ember-500',
    borderClass: 'border-ember-400/40',
    glowClass: 'hover:shadow-[0_22px_70px_rgba(218,130,22,0.25)]',
  },
  {
    key: 'characterSheets',
    href: '/assets/character-sheet',
    icon: Users,
    iconGradient: 'from-aurora-200 via-nebula-300 to-nebula-500',
    borderClass: 'border-nebula-400/40',
    glowClass: 'hover:shadow-[0_22px_70px_rgba(156,94,245,0.25)]',
  },
] as const;

export default function AssetsPage() {
  const { t } = useI18n();

  return (
    <PrivateLayout showNavbar>
      <section className="relative isolate overflow-hidden bg-midnight-950/90">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-midnight-800/80 via-midnight-950/95 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(237,214,150,0.12),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(128,66,218,0.08),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(120deg,rgba(249,236,209,0.08),transparent_55%)]" />
        </div>

        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-16 px-6 py-16 sm:px-10 lg:px-16">
          <header className="flex flex-col items-center gap-5 text-center">
            <span className="font-display text-sm uppercase tracking-[0.6em] text-aurora-200/80">
              {t('assets.hero.eyebrow')}
            </span>
            <h1 className="font-display text-4xl tracking-[0.18em] text-shadow-50 sm:text-5xl">
              {t('assets.hero.title')}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-shadow-200 sm:text-lg">
              {t('assets.hero.subtitle')}
            </p>
          </header>

          <div className="flex flex-col gap-6">
            {cards.map(({ key, href, icon: Icon, borderClass, glowClass }) => (
              <Link key={key} to={href} aria-label={t(`assets.cards.${key}.ariaLabel`)} className="group">
                <Card
                  className={`relative border ${borderClass} bg-gradient-to-br from-midnight-900/70 via-midnight-900/60 to-midnight-800/60 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.008] ${glowClass}`}
                >
                  <CardContent className="flex items-center gap-6 p-6 sm:gap-8 sm:p-8">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <Icon
                        className="h-14 w-14 text-ember-400 transition-all duration-300 group-hover:text-ember-300 group-hover:scale-110 sm:h-16 sm:w-16"
                        strokeWidth={1.4}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 sm:gap-3">
                      <h2 className="font-display text-xl tracking-[0.12em] text-shadow-50 sm:text-2xl">
                        {t(`assets.cards.${key}.title`)}
                      </h2>
                      <p className="text-sm leading-relaxed text-shadow-200 sm:text-base">
                        {t(`assets.cards.${key}.body`)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-aurora-200 transition-colors duration-300 group-hover:text-aurora-100">
                      <span className="hidden sm:inline">{t(`assets.cards.${key}.action`)}</span>
                      <span
                        aria-hidden
                        className="translate-y-[1px] text-lg transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
