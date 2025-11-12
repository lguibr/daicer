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

  const handleCreateRoom = () => {
    navigate('/create');
  };

  const handleViewDemo = () => {
    navigate('/combat-demo');
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
      <div className="mx-auto flex min-h-dvh w-full flex-col gap-16 px-6 py-16 sm:px-10 lg:px-16 xl:max-w-7xl">
        <header className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-aurora-400/45 bg-midnight-700/60 shadow-[0_32px_60px_rgba(7,5,10,0.55)] ring-1 ring-inset ring-aurora-200/30">
            <UsersIcon className="h-20 w-20 text-aurora-300" aria-hidden="true" />
            <span className="sr-only">Adventuring party lobby icon</span>
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-aurora-500/15 via-transparent to-nebula-500/20 blur-xl" />
          </div>
          <div className="space-y-5">
            <h1 className="font-display text-4xl uppercase tracking-[0.32em] text-aurora-200 sm:text-5xl">
              {t('lobby.title')}
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-shadow-100/90">{t('lobby.description')}</p>
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 text-center sm:text-left">
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={loading}
            className="btn-primary w-full py-5 text-base"
          >
            {t('lobby.createButton')}
          </button>

          <div className="rounded-3xl border border-aurora-400/20 bg-midnight-900/60 p-8 shadow-[0_28px_58px_rgba(7,5,10,0.5)] backdrop-blur">
            <div className="mb-6 text-center sm:text-left">
              <h2 className="font-display text-base uppercase tracking-[0.42em] text-aurora-200">
                {t('lobby.enterCode')}
              </h2>
              <p className="mt-2 text-sm text-shadow-300">{t('lobby.subtitle')}</p>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading || !roomCode.trim()}
                  className="btn-secondary w-full py-4 text-base sm:w-auto sm:px-8"
                >
                  {loading ? t('lobby.joining') : t('lobby.joinButton')}
                </button>
                <div className="flex flex-col items-center justify-center gap-2 text-xs uppercase tracking-[0.4em] text-shadow-400 sm:flex-row">
                  <span>{t('lobby.orDivider')}</span>
                  <button
                    type="button"
                    onClick={handleViewDemo}
                    className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-shadow-400 transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <FlaskConical className="h-4 w-4 text-nebula-200" aria-hidden="true" />
                    <span className="underline decoration-dotted underline-offset-4">
                      {t('lobby.cards.demo.title')}
                    </span>
                  </button>
                </div>
              </div>
            </form>
            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-900/40 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </PrivateLayout>
  );
}
