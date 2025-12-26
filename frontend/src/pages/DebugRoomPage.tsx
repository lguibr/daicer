import { useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { GameDebugView } from '../features/debug/components/GameDebugView';

export default function DebugRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId) {
    return <div className="p-8 text-center text-red-500">Room ID is required</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-midnight-950 text-shadow-100 font-sans">
      {/* Reuse standard Navbar or a specific Debug Navbar */}
      <Navbar />
      <div className="flex-1 overflow-hidden relative">
        <GameDebugView roomId={roomId} />
      </div>
    </div>
  );
}
