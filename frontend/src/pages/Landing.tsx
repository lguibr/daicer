/**
 * Root landing page - shows login for unauthenticated users, lobby for authenticated users
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';
import { UsersIcon } from '@heroicons/react/24/outline';
import useAuth from '../hooks/useAuth';
import { joinRoom } from '../services/api';
import { useI18n } from '../i18n';
import { DynamicLayout } from '../components/layout';
import Logo from '../components/ui/Logo';
import LanguageSelector from '../components/ui/LanguageSelector';
import { SpotlightCarousel } from '../components/ui';
import { JoinHeroSlide } from '../components/lobby/JoinHeroSlide';
import { useJoinSlides } from '../features/lobby/joinSlides';
import { gildedTokens } from '../theme/gildedTokens';

/**
 * Unified landing/ page
 * Shows login screen if not authenticated, lobby if authenticated
 */
export default function LandingPage() {
  const { user, loading: authLoading, signInWithGoogle, error: authError } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicSlides = useJoinSlides('public');
  const privateSlides = useJoinSlides('private');

  const handleCreateRoom = () => {
    navigate('/create');
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const room = await joinRoom(roomCode.toUpperCase());
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Unauthenticated view - Login screen
  if (!user) {
    return (
      <DynamicLayout showNavbar showLanguageSelector={false}>
        {/* Language selector in top-right corner */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector variant="compact" />
        </div>

        <div className={gildedTokens.pageShell}>
          <div className={gildedTokens.gradientBackdrop} />

          <section className={gildedTokens.heroStack}>
            <div className={`${gildedTokens.haloBadge} overflow-hidden`}>
              <Logo
                size="xl"
                className="rounded-full border border-aurora-500/40 bg-midnight-900/70 p-6 shadow-[0_45px_85px_rgba(3,8,14,0.6)]"
              />
              <div className={gildedTokens.haloInnerGlow} />
            </div>
            <p className={gildedTokens.heroEyebrow}>{t('auth.subtitle')}</p>
            <div className="space-y-4">
              <h1 className={gildedTokens.heroTitle}>{t('auth.title')}</h1>
              <p className={gildedTokens.heroBody}>{t('auth.heroDescription')}</p>
            </div>
          </section>

          <section className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6">
            <div className={`${gildedTokens.glassPanel} w-full space-y-6 text-center sm:text-left`}>
              <div className="space-y-3">
                <p className={gildedTokens.inlineBadge}>{t('auth.cta.heading')}</p>
                <p className={gildedTokens.sectionBody}>{t('auth.cta.copy')}</p>
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="btn-primary flex w-full items-center justify-center gap-3 text-base uppercase tracking-[0.32em]"
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
                {authLoading ? t('auth.loggingIn') : t('auth.login')}
              </button>

              {authError ? <p className="text-center text-sm text-red-300">{authError}</p> : null}
            </div>

            <div className="w-full rounded-3xl border border-midnight-500/50 bg-midnight-500/40 px-6 py-5 text-center text-xs uppercase tracking-[0.32em] text-shadow-400">
              <p className="font-semibold text-shadow-200">{t('auth.emulatorNote')}</p>
              <p className="mt-2 text-[0.78rem] tracking-normal text-shadow-300">{t('auth.emulatorTip')}</p>
            </div>
          </section>

          <section className={`${gildedTokens.glassPanel} w-full max-w-5xl space-y-6`}>
            <div className="space-y-2 text-center">
              <p className={gildedTokens.heroEyebrow}>{t('lobby.carouselTitle')}</p>
              <p className="text-sm leading-relaxed text-shadow-300">{t('lobby.carouselDescription')}</p>
            </div>

            <SpotlightCarousel
              items={publicSlides}
              size="lg"
              layout="split"
              showControls={false}
              ariaLabel={t('lobby.joinHero.carouselAria')}
              frameClassName="bg-transparent"
              slideClassName="px-4 py-6"
              renderItem={({ item, index, isActive }) => (
                <JoinHeroSlide item={item} isActive={isActive} slideIndex={index} />
              )}
            />
          </section>
        </div>
      </DynamicLayout>
    );
  }

  // Authenticated view - Lobby
  return (
    <DynamicLayout showRoomInfo={false}>
      <div className={gildedTokens.pageShell}>
        <div className={gildedTokens.gradientBackdrop} />

        <header className={gildedTokens.heroStack}>
          <div className={gildedTokens.haloBadge}>
            <UsersIcon className="h-16 w-16 text-aurora-200" aria-hidden="true" />
            <span className="sr-only">Adventuring party lobby icon</span>
            <div className={gildedTokens.haloInnerGlow} />
          </div>
          <p className={gildedTokens.heroEyebrow}>{t('lobby.subtitle')}</p>
          <div className="space-y-4">
            <h1 className={gildedTokens.heroTitle}>{t('lobby.title')}</h1>
            <p className={gildedTokens.heroBody}>{t('lobby.description')}</p>
          </div>
        </header>

        <section className="relative z-10 flex w-full max-w-5xl flex-col gap-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className={`${gildedTokens.glassPanel} flex flex-col gap-6`}>
              <div
                className={`${gildedTokens.inlineBadge} justify-center rounded-3xl border border-aurora-300/40 bg-midnight-900/40 px-5 py-3 text-center sm:justify-start`}
              >
                <Sparkles className="h-4 w-4 text-nebula-200" aria-hidden="true" />
                <span>{t('lobby.joinHero.overline')}</span>
              </div>
              <div className="space-y-4">
                <h2 className={gildedTokens.sectionHeading}>{t('lobby.joinHero.heading')}</h2>
                <p className={gildedTokens.sectionBody}>{t('lobby.joinHero.copy')}</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  data-testid="lobby-create-room-btn"
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className={gildedTokens.primaryAction}
                >
                  {t('lobby.createButton')}
                </button>
                <p className={`${gildedTokens.detailCopy} text-center text-shadow-300 sm:max-w-xs sm:text-left`}>
                  {t('lobby.joinHero.helpText')}
                </p>
              </div>
              <div
                className={`${gildedTokens.inlineBadge} justify-center rounded-full border border-aurora-300/35 bg-midnight-900/60 px-5 py-2 text-center sm:justify-start`}
              >
                <Shield className="h-4 w-4 text-aurora-200" aria-hidden="true" />
                <span>{t('lobby.joinHero.guardianCallout')}</span>
              </div>
            </article>

            <form
              id="join-room-form"
              onSubmit={handleJoinRoom}
              className={`${gildedTokens.glassPanel} flex flex-col gap-5`}
            >
              <label htmlFor="room-code-input" className={`${gildedTokens.inlineBadge} text-aurora-200/90`}>
                {t('lobby.joinHero.inputLabel')}
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={t('lobby.joinHero.codePlaceholder')}
                maxLength={6}
                className={gildedTokens.monoInput}
              />
              <button type="submit" disabled={loading || !roomCode.trim()} className={gildedTokens.secondaryAction}>
                {loading ? t('lobby.joinHero.joining') : t('lobby.joinHero.joinButton')}
              </button>
              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-900/40 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}
            </form>
          </div>

          <section className={`${gildedTokens.glassPanel} flex flex-col gap-6`}>
            <div className="space-y-2 text-center">
              <p className={gildedTokens.heroEyebrow}>{t('lobby.carouselTitle')}</p>
              <p className="text-sm leading-relaxed text-shadow-300">{t('lobby.carouselDescription')}</p>
            </div>

            <SpotlightCarousel
              items={privateSlides}
              size="lg"
              layout="split"
              showControls={false}
              ariaLabel={t('lobby.joinHero.carouselAria')}
              frameClassName="bg-transparent"
              slideClassName="px-4 py-6"
              renderItem={({ item, index: slideIndex, isActive }) => (
                <JoinHeroSlide item={item} isActive={isActive} slideIndex={slideIndex} />
              )}
            />
          </section>
        </section>
      </div>
    </DynamicLayout>
  );
}
