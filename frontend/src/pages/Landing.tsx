/**
 * Root landing page - shows login for unauthenticated users, lobby for authenticated users
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

import useAuth from '../hooks/useAuth';
import { joinRoom } from '../services/api';
import { useI18n } from '../i18n';
import { DynamicLayout } from '../components/layout';
import Logo from '../components/ui/Logo';

import { gildedTokens } from '../theme/gildedTokens';
import { BackgroundDiceField } from '../components/ui/background/BackgroundDiceField';
import { PWAInstallPrompt } from '../components/pwa/PWAInstallPrompt';

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
      <DynamicLayout showNavbar={false} showLanguageSelector>
        {/* Main Grid Container ensuring full viewport height */}
        <div className="relative grid min-h-dvh w-full place-items-center overflow-hidden">
          {/* Background is absolute/fixed behind the grid */}
          <div className="absolute inset-0 z-0">
            <BackgroundDiceField />
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/60 via-midnight-950/40 to-midnight-950/90 pointer-events-none" />
          </div>

          {/* Central Content Stack */}
          <main className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-16 p-6">
            {/* Illuminated Container - True Cardless with diffuse light */}
            <div className="relative w-full max-w-lg flex flex-col items-center gap-12 p-12">
              {/* Diffuse Light at the Middle - Integrated Blend */}
              <div className="absolute inset-0 top-1/2 -translate-y-1/2 bg-[radial-gradient(circle_closest-side,rgba(139,92,246,0.15),transparent)] scale-150 blur-3xl pointer-events-none" />

              {/* Hero Section */}
              <section className="relative flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-1000">
                <div className="relative animate-float mb-4">
                  <Logo size="xl" noShadow className="filter drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
                  {/* Soft, borderless atmospheric glow behind */}
                  <div className="absolute inset-0 bg-aurora-500/20 blur-[50px] -z-10 rounded-full scale-150 pointer-events-none" />
                </div>

                <div className="space-y-4">
                  <p className={`${gildedTokens.heroEyebrow} tracking-[0.5em] text-aurora-200/60`}>
                    {t('auth.subtitle')}
                  </p>
                  <h1 className={`${gildedTokens.heroTitle} text-6xl sm:text-7xl lg:text-8xl !leading-tight`}>
                    <span className="shiny-text filter drop-shadow-[0_0_30px_rgba(124,58,237,0.3)]">DAICER</span>
                  </h1>
                  <p className={`${gildedTokens.heroBody} max-w-2xl text-lg sm:text-xl text-aurora-100/80`}>
                    {t('auth.heroDescription')}
                  </p>
                </div>
              </section>

              {/* Login Gateway Section */}
              <section className="relative w-full flex flex-col items-center gap-8 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300">
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-4 text-aurora-300/40 mb-2">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-aurora-500/30 to-transparent" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-aurora-200/60">
                      {t('auth.cta.heading')}
                    </span>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-aurora-500/30 to-transparent" />
                  </div>
                  <p className="text-aurora-200/50 text-sm max-w-md tracking-wide">{t('auth.cta.copy')}</p>
                </div>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="group relative w-full py-5 px-8 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                  aria-label={t('auth.login')}
                >
                  {/* Button Background & Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-aurora-500/10 via-nebula-500/10 to-aurora-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-midnight-950/60 backdrop-blur-sm" />
                  <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-aurora-300/30 transition-colors" />
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-aurora-500/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                  {/* Content */}
                  <div className="relative flex items-center justify-center gap-4">
                    <svg className="h-6 w-6 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        className="text-[#4285F4] opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        className="text-[#34A853] opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        className="text-[#FBBC05] opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        className="text-[#EA4335] opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    </svg>
                    <span className="font-display text-aurora-100 tracking-[0.15em] uppercase text-sm font-bold group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all">
                      {authLoading ? t('auth.loggingIn') : t('auth.login')}
                    </span>
                    <Sparkles className="h-4 w-4 text-aurora-300 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </button>

                {authError ? (
                  <p className="text-red-400 text-xs font-medium tracking-wide animate-pulse">{authError}</p>
                ) : null}
              </section>
            </div>
          </main>
        </div>
      </DynamicLayout>
    );
  }

  // Authenticated view - Lobby
  return (
    <DynamicLayout showNavbar showRoomInfo={false}>
      {/* Main Grid Container ensuring full viewport height */}
      <div className="relative grid min-h-dvh w-full place-items-center overflow-hidden">
        {/* Background is absolute/fixed behind the grid */}
        <div className="absolute inset-0 z-0">
          <BackgroundDiceField />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/60 via-midnight-950/40 to-midnight-950/90 pointer-events-none" />
        </div>

        {/* Central Content Stack */}
        <main className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-12 p-6">
          {/* Illuminated Container - True Cardless with diffuse light */}
          <div className="relative w-full max-w-lg flex flex-col items-center gap-8 p-12">
            {/* Diffuse Light at the Middle - Integrated Blend */}
            <div className="absolute inset-0 top-1/2 -translate-y-1/2 bg-[radial-gradient(circle_closest-side,rgba(139,92,246,0.15),transparent)] scale-150 blur-3xl pointer-events-none" />

            {/* Header / Greeting */}
            <section className="relative flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="relative animate-float mb-4">
                <Logo size="xl" noShadow className="filter drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
                {/* Soft, borderless atmospheric glow behind */}
                <div className="absolute inset-0 bg-aurora-500/20 blur-[50px] -z-10 rounded-full scale-150 pointer-events-none" />
              </div>

              <div className="space-y-2">
                <p className={`${gildedTokens.heroEyebrow} tracking-[0.3em] text-aurora-200/60`}>
                  {t('lobby.subtitle')}
                </p>
                <h1 className={`${gildedTokens.heroTitle} text-3xl sm:text-4xl lg:text-5xl !leading-tight`}>
                  <span className="shiny-text filter drop-shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                    {t('lobby.title')}
                  </span>
                </h1>
              </div>
            </section>

            {/* Interaction Zone */}
            <section className="relative w-full flex flex-col items-center gap-6 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-200">
              {/* Guidance Text */}
              <p className="text-center text-aurora-200/50 text-sm font-medium tracking-wide max-w-xs mx-auto">
                {t('lobby.guidance', 'Enter your room code below to join an existing chronicle.')}
              </p>

              {/* Join Room Input */}
              <form onSubmit={handleJoinRoom} className="w-full relative group">
                <div className="absolute inset-0 bg-aurora-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder={t('lobby.joinHero.codePlaceholder')}
                    maxLength={6}
                    className={`${gildedTokens.monoInput} !bg-midnight-900/60 !border-aurora-500/20 !text-3xl !py-5 !text-center !tracking-[0.5em] placeholder:tracking-[0.2em] placeholder:text-2xl placeholder:text-aurora-500/30 hover:!border-aurora-400/40 focus:!border-aurora-400/60 focus:!ring-1 focus:!ring-aurora-400/30 transition-all shadow-lg backdrop-blur-md`}
                  />
                  <button
                    type="submit"
                    disabled={loading || !roomCode.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-2xl bg-aurora-500/10 text-aurora-300 hover:bg-aurora-500/20 hover:text-aurora-100 disabled:opacity-0 disabled:pointer-events-none transition-all duration-300"
                  >
                    <Sparkles className="h-5 w-5" />
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-red-400 text-xs font-medium tracking-wide animate-pulse">{error}</span>
                  </div>
                )}
              </form>

              {/* Or Divider */}
              <div className="flex items-center gap-4 w-full opacity-20 my-2">
                <div className="h-px bg-gradient-to-r from-transparent via-aurora-100 to-transparent flex-1" />
                <span className="text-[10px] uppercase tracking-widest text-aurora-100 font-semibold">Or</span>
                <div className="h-px bg-gradient-to-r from-transparent via-aurora-100 to-transparent flex-1" />
              </div>

              {/* Cooler Create Action */}
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={loading}
                className="group relative w-full py-4 px-6 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Button Background & Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-aurora-500/10 via-nebula-500/10 to-aurora-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-midnight-950/40 backdrop-blur-[2px]" />
                <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-aurora-300/30 transition-colors" />
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-aurora-500/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                {/* Content */}
                <div className="relative flex items-center justify-center gap-3">
                  <Shield className="h-5 w-5 text-aurora-300 group-hover:text-aurora-100 group-hover:drop-shadow-[0_0_8px_rgba(216,130,22,0.5)] transition-all duration-300" />
                  <span className="font-display text-aurora-100 tracking-[0.15em] uppercase text-sm font-bold group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(216,130,22,0.3)] transition-all">
                    {t('lobby.createButton', 'Forge New Adventure')}
                  </span>
                  <Sparkles className="h-4 w-4 text-nebula-300 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0" />
                </div>
              </button>

              <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 delay-500">
                <PWAInstallPrompt />
              </div>
            </section>
          </div>
        </main>
      </div>
    </DynamicLayout>
  );
}
