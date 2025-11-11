import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { joinRoom } from '../services/api';
import { PrivateLayout } from '../components/layout';
import { useI18n } from '../i18n';

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

  const highlightCards: Array<{
    title: string;
    body: string;
    actionLabel?: string;
    onAction?: () => void;
  }> = [
    {
      title: t('lobby.cards.create.title'),
      body: t('lobby.cards.create.body'),
    },
    {
      title: t('lobby.cards.join.title'),
      body: t('lobby.cards.join.body'),
    },
    {
      title: t('lobby.cards.demo.title'),
      body: t('lobby.cards.demo.body'),
      actionLabel: t('lobby.cards.demo.action'),
      onAction: () => navigate('/combat-demo'),
    },
  ];

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
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-14 px-6 py-20 sm:px-10 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-12">
            <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border border-accent/35 bg-midnight-700/60 shadow-[0_28px_55px_rgba(7,5,10,0.55)]">
                <UsersIcon className="h-20 w-20 text-aurora-300" aria-hidden="true" />
                <span className="sr-only">Adventuring party lobby icon</span>
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-3xl uppercase tracking-[0.32em] text-aurora-200 sm:text-4xl">
                  {t('lobby.title')}
                </h1>
                <p className="text-lg leading-relaxed text-shadow-100/90">{t('lobby.description')}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {highlightCards.map((card) => (
                <div
                  key={card.title}
                  className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-accent/25 bg-midnight-900/75 p-6 shadow-[0_25px_45px_rgba(7,5,10,0.55)] transition-transform duration-300 hover:-translate-y-1 hover:border-accent/45"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aurora-400/50 via-accent/40 to-nebula-400/50 opacity-70" />
                  <div className="space-y-3 pt-2">
                    <p className="font-display text-sm uppercase tracking-[0.38em] text-aurora-200">{card.title}</p>
                    <p className="text-base leading-relaxed text-shadow-100">{card.body}</p>
                  </div>
                  {card.onAction && card.actionLabel && (
                    <button
                      type="button"
                      onClick={card.onAction}
                      className="inline-flex items-center gap-2 self-start rounded-lg border border-accent/40 bg-gradient-to-r from-aurora-500 via-accent to-aurora-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-midnight-100 shadow-[0_15px_30px_rgba(122,73,217,0.28)] transition hover:from-aurora-400 hover:via-accent/90 hover:to-aurora-300"
                    >
                      {card.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-7 p-12">
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={loading}
              className="btn-primary w-full py-5 text-base"
            >
              {t('lobby.createButton')}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-midnight-600/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="rounded-full bg-midnight-400/90 px-4 py-1 text-xs font-semibold tracking-[0.38em] text-shadow-300">
                  {t('lobby.orDivider')}
                </span>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-5">
              <label
                htmlFor="room-code-input"
                className="block text-xs font-semibold uppercase tracking-[0.38em] text-shadow-300"
              >
                {t('lobby.inputLabel')}
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={t('lobby.codePlaceholder')}
                maxLength={6}
                className="w-full rounded-2xl border border-midnight-600 bg-midnight-700/70 px-4 py-5 text-center font-mono text-3xl tracking-[0.8em] text-shadow-50 transition focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !roomCode.trim()}
                className="btn-secondary w-full py-4 text-base"
              >
                {loading ? t('lobby.joining') : t('lobby.joinButton')}
              </button>
            </form>

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-900/40 p-4 text-sm text-red-200">{error}</div>
            )}
          </div>
        </div>

        {(import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV) && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/test-setup')}
              className="inline-flex items-center gap-2 rounded-lg border border-nebula-500/50 bg-nebula-500/25 px-4 py-2 text-sm font-semibold text-nebula-200 transition hover:border-nebula-400/70 hover:bg-nebula-500/35"
            >
              <FlaskConical className="h-4 w-4" />
              {t('lobby.devButton')}
            </button>
          </div>
        )}
      </div>
    </PrivateLayout>
  );
}
