/**
 * Game room page - handles character creation and gameplay
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomState } from '../services/api';
import { joinRoom as joinSocketRoom } from '../services/socket';
import useSocket from '../hooks/useSocket';
import CharacterCreation from '../components/room/CharacterCreation';
import GameplayScreen from '../components/game/GameplayScreen';
import { CombatScreen } from '../components/game/CombatScreen';
import { PrivateLayout } from '../components/layout';
import { ToolNotificationContainer } from '../components/ui/ToolNotificationToast';
import type { Room, Player } from '../types/shared';

/**
 * Game room page component
 * @returns Game room UI based on phase
 */
export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentToolCalls, setRecentToolCalls] = useState<typeof socket.toolCalls>([]);

  const socket = useSocket(roomId);

  // Handle new tool calls - show as toasts for most recent 3
  useEffect(() => {
    if (socket.toolCalls.length > recentToolCalls.length) {
      setRecentToolCalls(socket.toolCalls.slice(-3)); // Keep only last 3 for toasts
    }
  }, [socket.toolCalls, recentToolCalls.length]);

  useEffect(() => {
    if (!roomId) {
      navigate('/lobby');
      return;
    }

    const loadRoom = async () => {
      try {
        const data = await getRoomState(roomId);
        setRoom(data.room);
        setPlayers(data.players);

        // Give socket time to initialize before joining
        setTimeout(() => {
          joinSocketRoom(roomId);
        }, 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();

    // No explicit return needed
  }, [roomId, navigate]);

  // Update state from socket
  useEffect(() => {
    if (socket.room) {
      setRoom(socket.room);
    }
    if (socket.players.length > 0) {
      setPlayers(socket.players);
    }
  }, [socket.room, socket.players]);

  if (loading) {
    return (
      <PrivateLayout showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aurora-300" />
        </div>
      </PrivateLayout>
    );
  }

  if (error || !room) {
    return (
      <PrivateLayout showRoomInfo={false}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md p-6 card">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-shadow-200 mb-4">{error || 'Room not found'}</p>
            <button type="button" onClick={() => navigate('/lobby')} className="btn-primary">
              Back to Lobby
            </button>
          </div>
        </div>
      </PrivateLayout>
    );
  }

  const handleDismissToast = (id: string) => {
    setRecentToolCalls((prev) => prev.filter((tc) => tc.id !== id));
  };

  // Render based on game phase
  let content;
  switch (room.phase) {
    case 'SETUP':
    case 'CHARACTER_CREATION':
      content = <CharacterCreation room={room} players={players} />;
      break;

    case 'GAMEPLAY':
      content = <GameplayScreen room={room} players={players} />;
      break;

    case 'COMBAT':
      content = <CombatScreen roomId={room.id} />;
      break;

    default:
      content = (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-shadow-300">Unknown game phase</p>
        </div>
      );
  }

  return (
    <PrivateLayout room={room} playerCount={players.length} showRoomInfo={room.phase !== 'COMBAT'}>
      {content}
      <ToolNotificationContainer toolCalls={recentToolCalls} onDismiss={handleDismissToast} />
    </PrivateLayout>
  );
}
