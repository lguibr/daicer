import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DebugPanel from './components/debug/DebugPanel';
import LandingPage from './pages/Landing';
import LobbyPage from './pages/Lobby';
import CreateRoomPage from './pages/CreateRoom';
import GameRoomPage from './pages/GameRoom';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <LobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <GameRoomPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DebugPanel />
    </BrowserRouter>
  );
}
