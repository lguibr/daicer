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

import { gildedTokens } from '../theme/gildedTokens';
import { BackgroundDiceField } from '../components/ui/background/BackgroundDiceField';

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

  const handleCreateRoom = () => {
    navigate('/create');
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError(t('landing.errors.missingCode'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const room = await joinRoom(roomCode.toUpperCase());
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('landing.errors.joinFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Unauthenticated view - Login screen
  if (!user) {
    return (
      <DynamicLayout showNavbar showLanguageSelector={false}>
        {/* Main Grid Container ensuring full viewport height */}
        <div className="relative grid min-h-dvh w-full place-items-center overflow-hidden">
          {/* Background is absolute/fixed behind the grid */}
          <div className="absolute inset-0 z-0">
            <BackgroundDiceField />
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/40 via-transparent to-midnight-950/80 pointer-events-none" />
          </div>

          {/* Central Content Stack */}
          <main className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-16 p-6">
            {/* Hero Section */}
            <section className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-1000">
              <div className={`${gildedTokens.haloBadge} animate-float mb-4`}>
                <Logo
                  size="xl"
                  className="rounded-full border border-aurora-500/30 bg-midnight-900/40 p-6 backdrop-blur-sm"
                />
                <div className={gildedTokens.haloInnerGlow} />
              </div>

              <div className="space-y-4">
                <p className={`${gildedTokens.heroEyebrow} tracking-[0.5em] text-aurora-200/80`}>
                  {t('auth.subtitle')}
                </p>
                <h1 className={`${gildedTokens.heroTitle} text-6xl sm:text-7xl lg:text-8xl`}>
                  <span className="shiny-text filter drop-shadow-[0_0_30px_rgba(124,58,237,0.3)]">DAICER</span>
                </h1>
                <p className={`${gildedTokens.heroBody} max-w-2xl text-lg sm:text-xl text-aurora-100/90`}>
                  {t('auth.heroDescription')}
                </p>
              </div>
            </section>

            {/* Login Gateway Section */}
            <section className="flex flex-col items-center gap-8 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-3 text-aurora-300/60 mb-2">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-aurora-500/50" />
                  <span className="text-xs uppercase tracking-[0.3em] font-medium">Portão de Entrada</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-aurora-500/50" />
                </div>
                <p className="text-aurora-200 text-sm max-w-md">
                  Entre com sua carta de aventura e reúna o grupo em instantes.
                </p>
              </div>

              <button
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="group relative flex items-center gap-4 px-8 py-4 bg-midnight-900/40 border border-aurora-500/30 rounded-xl backdrop-blur-md transition-all duration-300 hover:bg-midnight-800/60 hover:border-aurora-400/60 hover:shadow-[0_0_30px_rgba(124,58,237,0.25)] hover:scale-105 active:scale-95"
                aria-label={t('auth.login')}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    className="text-[#4285F4]"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    className="text-[#34A853]"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    className="text-[#FBBC05]"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    className="text-[#EA4335]"
                  />
                </svg>
                <span className="text-aurora-50 font-medium tracking-wider text-sm uppercase">
                  {authLoading ? t('auth.loggingIn') : t('auth.login')}
                </span>
              </button>

              {authError ? <p className="text-red-400 text-xs animate-pulse">{authError}</p> : null}
            </section>
          </main>
        </div>
      </DynamicLayout>
    );
  }

  // Authenticated view - Lobby
  return (
    <DynamicLayout showRoomInfo={false}>
      {/* 
        Full-height container 
        - Override min-h-dvh from pageShell with !min-h-[calc(100dvh-4.5rem)] (navbar height)
        - Remove default top/bottom padding constraints that cause overflow
        - Use flex-1 to fill available space
      */}
      <div className={`${gildedTokens.pageShell} !min-h-[calc(100dvh-4.5rem)] !py-8 justify-center`}>
        <div className={gildedTokens.gradientBackdrop} />

        {/* Header Section */}
        <header className={`${gildedTokens.heroStack} mb-8 flex-none`}>
          <div className={`${gildedTokens.haloBadge} animate-float h-32 w-32`}>
            <UsersIcon className="h-12 w-12 text-aurora-200" aria-hidden="true" />
            <span className="sr-only">Adventuring party lobby icon</span>
            <div className={gildedTokens.haloInnerGlow} />
          </div>
          <p className={gildedTokens.heroEyebrow}>{t('lobby.subtitle')}</p>
          <div className="space-y-4">
            <h1 className={`${gildedTokens.heroTitle} !text-3xl sm:!text-5xl`}>{t('lobby.title')}</h1>
            <p className={gildedTokens.heroBody}>{t('lobby.description')}</p>
          </div>
        </header>

        {/* Main Grid Content */}
        <section className="relative z-10 grid w-full max-w-5xl gap-6 md:grid-cols-2 md:items-stretch flex-1 md:flex-none">
          {/* Create Room Card */}
          <article
            className={`${gildedTokens.glassPanel} flex flex-col gap-6 justify-between h-full hover:border-aurora-500/30 transition-colors duration-300`}
          >
            <div className="space-y-6">
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
            </div>

            <div className="space-y-6">
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
              </div>

              <div
                className={`${gildedTokens.inlineBadge} w-full justify-center rounded-full border border-aurora-300/35 bg-midnight-900/60 px-5 py-2 text-center sm:justify-start`}
              >
                <Shield className="h-4 w-4 text-aurora-200" aria-hidden="true" />
                <span>{t('lobby.joinHero.guardianCallout')}</span>
              </div>
            </div>
          </article>

          {/* Join Room Form */}
          <form
            id="join-room-form"
            onSubmit={handleJoinRoom}
            className={`${gildedTokens.glassPanel} flex flex-col gap-8 justify-center h-full hover:border-aurora-500/30 transition-colors duration-300`}
          >
            <div className="space-y-2">
              <label htmlFor="room-code-input" className={`${gildedTokens.sectionHeading} block`}>
                {t('lobby.joinHero.joinButton')}
              </label>
              <p className={gildedTokens.detailCopy}>{t('lobby.joinHero.helpText')}</p>
            </div>

            <div className="space-y-4">
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
                className={`${gildedTokens.monoInput} !text-4xl py-6`}
              />
            </div>

            <div className="space-y-4">
              <button type="submit" disabled={loading || !roomCode.trim()} className={gildedTokens.secondaryAction}>
                {loading ? t('lobby.joinHero.joining') : 'Entrar no Sanctum'}
              </button>
              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-900/40 p-4 text-sm text-center text-red-200 animate-pulse">
                  {error}
                </div>
              )}
            </div>
          </form>
        </section>
      </div>
    </DynamicLayout>
  );
}
