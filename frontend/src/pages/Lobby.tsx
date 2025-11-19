import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Swords } from 'lucide-react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { joinRoom } from '../services/api';
import { PrivateLayout } from '../components/layout';
import { useI18n } from '../i18n';
import { SpotlightCarousel } from '../components/ui';
import { JoinHeroSlide } from '../components//JoinHeroSlide';
import { useJoinSlides } from '../features//joinSlides';
import { gildedTokens } from '../theme/gildedTokens';

/**
 * Lobby page component
 * @returns Lobby UI
 */
export default function LobbyPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const joinSlides = useJoinSlides('private');

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

  return (
    <PrivateLayout showRoomInfo={false}>
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
          {/* Tactical Combat Card */}
          <article className={`${gildedTokens.glassPanel} flex flex-col gap-6`}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-nebula-900/40 p-3 border border-nebula-300/40">
                  <Swords className="h-6 w-6 text-nebula-200" aria-hidden="true" />
                </div>
                <h2 className={gildedTokens.sectionHeading}>Tactical Combat Arena</h2>
              </div>
              <p className={gildedTokens.sectionBody}>
                Command your party with natural language in strategic grid-based combat. Choose from 5 unique arenas,
                plan your moves with AI-powered predictions, and execute D&D 5e rules-validated actions with LLM
                intelligence.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/tactical')}
                className={`${gildedTokens.primaryAction} flex items-center justify-center gap-2`}
              >
                <Swords className="h-4 w-4" />
                Enter Tactical Arena
              </button>
              <p className={`${gildedTokens.detailCopy} text-shadow-300`}>
                AI-powered tactical combat with rule validation
              </p>
            </div>
          </article>

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
              items={joinSlides}
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
    </PrivateLayout>
  );
}
