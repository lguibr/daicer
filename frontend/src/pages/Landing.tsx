/**
 * Landing page with login
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/ui/LanguageSelector';
import { PublicLayout } from '../components/layout';

/**
 * Landing/Login page
 * @returns Landing page UI
 */
export default function LandingPage() {
  const { user, loading, signInWithGoogle, error } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const featureCards = [
    {
      title: t('auth.cards.lore.title'),
      body: t('auth.cards.lore.body'),
    },
    {
      title: t('auth.cards.encounters.title'),
      body: t('auth.cards.encounters.body'),
    },
    {
      title: t('auth.cards.party.title'),
      body: t('auth.cards.party.body'),
    },
  ];

  useEffect(() => {
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);

  return (
    <PublicLayout>
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-14 px-6 py-20 sm:px-10 lg:px-16">
        <div className="absolute right-6 top-6">
          <LanguageSelector />
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative space-y-12">
            <div className="absolute -left-6 -top-10 hidden h-32 w-32 rounded-full bg-accent/25 blur-3xl lg:block" />
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start">
              <img
                src="/logo.png"
                alt="DAIcer logo"
                className="h-44 w-44 rounded-full border border-aurora-500/40 shadow-[0_35px_70px_rgba(4,7,12,0.55)]"
              />
              <div className="space-y-6 text-center lg:text-left">
                <p className="text-sm uppercase tracking-[0.55em] text-aurora-200/80">{t('auth.subtitle')}</p>
                <h1 className="font-display text-4xl tracking-[0.28em] text-aurora-200 sm:text-5xl lg:text-6xl">
                  {t('auth.title')}
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-shadow-100/90">{t('auth.heroDescription')}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((card, index) => (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-2xl border border-accent/25 bg-midnight-900/75 p-6 sm:p-7 shadow-[0_25px_45px_rgba(7,5,10,0.55)] transition-transform duration-300 hover:-translate-y-1 hover:border-accent/45"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aurora-400/60 via-accent/50 to-nebula-400/60 opacity-60" />
                  <div className="space-y-3 pt-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.45em] text-aurora-200/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-lg uppercase tracking-[0.32em] text-aurora-200">{card.title}</h3>
                    <p className="text-base leading-relaxed text-shadow-100/95">{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card relative overflow-hidden p-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aurora-400 via-accent to-nebula-400" />
            <div className="space-y-10">
              <div>
                <h2 className="font-display text-center text-xl uppercase tracking-[0.42em] text-aurora-200">
                  {t('auth.cta.heading')}
                </h2>
                <p className="mt-4 text-center text-base leading-relaxed text-shadow-200">{t('auth.cta.copy')}</p>
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-3 text-base"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>

              {error && <p className="text-center text-sm text-red-300">{error}</p>}

              <div className="rounded-xl border border-midnight-500/60 bg-midnight-500/35 p-4 text-xs text-shadow-400">
                <p className="font-semibold uppercase tracking-[0.32em] text-shadow-200">{t('auth.emulatorNote')}</p>
                <p className="mt-2 leading-relaxed text-shadow-300">{t('auth.emulatorTip')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
