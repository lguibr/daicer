import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, User } from 'lucide-react';
import clsx from 'clsx';
import type { Player } from '@daicer/engine';
type RoomMembership = any;
import { listRooms } from '../services/api';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { useI18n } from '../i18n';

interface GameEntry {
  roomId: string;
  roomCode: string;
  roomName: string;
  phase: string;
  character?: Player['character'];
  createdAt: string;
}

export default function GamePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<RoomMembership[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'noCharacter'>('all');

  const loadMemberships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await listRooms();
      setMemberships(rooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('game.messages.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const gameEntries = useMemo<GameEntry[]>(
    () =>
      memberships.map((m) => ({
        roomId: m.room.id,
        roomCode: m.room.code,
        roomName: 'Adventure Room',
        phase: m.room.phase,
        character: m.player?.character,
        createdAt: new Date(m.room.createdAt).toISOString(),
      })),
    [memberships]
  );

  const filteredEntries = useMemo(() => {
    if (filter === 'active') {
      return gameEntries.filter((e) => e.phase !== 'SETUP');
    }
    if (filter === 'noCharacter') {
      return gameEntries.filter((e) => !e.character);
    }
    return gameEntries;
  }, [gameEntries, filter]);

  if (loading) {
    return (
      <PrivateLayout showNavbar>
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-aurora-400/30 border-t-aurora-400" />
            <p className="text-sm text-shadow-400">{t('game.messages.loading')}</p>
          </div>
        </div>
      </PrivateLayout>
    );
  }

  if (error) {
    return (
      <PrivateLayout showNavbar>
        <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-6 p-8 text-center">
          <p className="text-red-200">{error}</p>
          <Button onClick={loadMemberships}>{t('game.actions.retry')}</Button>
        </div>
      </PrivateLayout>
    );
  }

  if (gameEntries.length === 0) {
    return (
      <PrivateLayout showNavbar>
        <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-8 p-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-shadow-500/50 bg-midnight-800/60">
            <DoorOpen className="h-12 w-12 text-shadow-400" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-aurora-200">{t('game.empty.title')}</h2>
            <p className="max-w-md text-shadow-300">{t('game.empty.description')}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/')}>{t('game.empty.joinGame')}</Button>
            <Button variant="secondary" onClick={() => navigate('/create')}>
              {t('game.empty.createRoom')}
            </Button>
          </div>
        </div>
      </PrivateLayout>
    );
  }

  return (
    <PrivateLayout showNavbar>
      <div className="mx-auto min-h-screen w-full max-w-6xl space-y-8 p-6 sm:p-10">
        <header className="space-y-4 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-aurora-200 md:text-4xl">{t('game.title')}</h1>
          <p className="text-shadow-300">{t('game.subtitle')}</p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] transition-all',
              filter === 'all'
                ? 'bg-aurora-500/20 text-aurora-200 shadow-[0_4px_12px_rgba(29,143,242,0.2)]'
                : 'bg-midnight-800/80 text-shadow-400 hover:bg-midnight-700/90 hover:text-shadow-200'
            )}
          >
            {t('game.filters.all')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] transition-all',
              filter === 'active'
                ? 'bg-aurora-500/20 text-aurora-200 shadow-[0_4px_12px_rgba(29,143,242,0.2)]'
                : 'bg-midnight-800/80 text-shadow-400 hover:bg-midnight-700/90 hover:text-shadow-200'
            )}
          >
            {t('game.filters.active')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('noCharacter')}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] transition-all',
              filter === 'noCharacter'
                ? 'bg-aurora-500/20 text-aurora-200 shadow-[0_4px_12px_rgba(29,143,242,0.2)]'
                : 'bg-midnight-800/80 text-shadow-400 hover:bg-midnight-700/90 hover:text-shadow-200'
            )}
          >
            {t('game.filters.noCharacter')}
          </button>
          <span className="ml-auto text-sm text-shadow-400">
            {filteredEntries.length} {filteredEntries.length === 1 ? t('game.stats.game') : t('game.stats.games')}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredEntries.map((entry) => (
            <div
              key={entry.roomId}
              className="group rounded-3xl border border-midnight-600 bg-midnight-800/70 p-6 shadow-lg transition-all hover:-translate-y-1 hover:border-aurora-400/40 hover:shadow-[0_12px_28px_rgba(29,143,242,0.15)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-aurora-400/40 bg-aurora-500/10">
                      <DoorOpen className="h-6 w-6 text-aurora-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-shadow-50">{entry.roomName}</h3>
                      <p className="text-xs font-mono uppercase tracking-[0.32em] text-shadow-400">{entry.roomCode}</p>
                    </div>
                  </div>

                  {entry.character ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-midnight-600 bg-midnight-900/60 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-aurora-400/40 bg-aurora-500/10">
                        <User className="h-5 w-5 text-aurora-200" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-shadow-100">{entry.character.name}</p>
                        <p className="text-xs text-shadow-400">
                          {t('game.labels.level')} {entry.character.level} {entry.character.race}{' '}
                          {entry.character.characterClass}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-shadow-600 bg-midnight-900/40 p-4 text-center">
                      <p className="text-xs italic text-shadow-500">{t('game.labels.noCharacter')}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-shadow-500">
                    <span className="rounded-full border border-shadow-600 px-2 py-0.5 uppercase tracking-[0.32em]">
                      {entry.phase}
                    </span>
                    <span>•</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={() => navigate(`/room/${entry.roomId}`)} className="flex-1" size="sm">
                  {t('game.actions.enterRoom')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PrivateLayout>
  );
}
