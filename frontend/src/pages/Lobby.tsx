import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { joinRoom } from '../services/api';
import Layout from '../components/layout/Layout';
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
    <Layout showRoomInfo={false}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-6 py-16 sm:px-10 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-aurora-500/40 bg-midnight-600/40 shadow-[0_20px_45px_rgba(4,7,12,0.5)]">
                <UsersIcon className="h-20 w-20 text-aurora-300" aria-hidden="true" />
                <span className="sr-only">Adventuring party lobby icon</span>
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-3xl uppercase tracking-[0.4em] text-aurora-300 sm:text-4xl">
                  {t('lobby.title')}
                </h1>
                <p className="text-lg leading-relaxed text-shadow-100">{t('lobby.description')}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {highlightCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-midnight-500/60 bg-midnight-500/35 p-6 shadow-xl flex flex-col gap-4"
                >
                  <p className="font-display text-xs uppercase tracking-[0.35em] text-aurora-400">{card.title}</p>
                  <p className="mt-3 leading-relaxed text-shadow-200">{card.body}</p>
                  {card.onAction && card.actionLabel && (
                    <button
                      type="button"
                      onClick={card.onAction}
                      className="self-start px-4 py-2 bg-nebula-600 hover:bg-nebula-500 text-white text-xs font-semibold uppercase tracking-[0.3em] rounded-lg transition"
                    >
                      {card.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-6 p-10">
            <button type="button" onClick={handleCreateRoom} disabled={loading} className="btn-primary w-full py-4">
              {t('lobby.createButton')}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-midnight-600/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="rounded-full bg-midnight-400/90 px-4 py-1 text-xs font-semibold tracking-[0.35em] text-shadow-300">
                  {t('lobby.orDivider')}
                </span>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <label
                htmlFor="room-code-input"
                className="block text-xs font-semibold uppercase tracking-[0.35em] text-shadow-300"
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
                className="w-full rounded-lg border border-midnight-500 bg-midnight-500/70 px-4 py-4 text-center font-mono text-2xl tracking-[0.75em] text-shadow-50 transition focus:border-aurora-400 focus:ring-2 focus:ring-aurora-400/40 focus:outline-none"
              />
              <button type="submit" disabled={loading || !roomCode.trim()} className="btn-secondary w-full py-3">
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
    </Layout>
  );
}
