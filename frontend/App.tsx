/**
 * Main application component with routing
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './src/hooks/useAuth';
import { DebugPanel } from './src/components/debug/DebugPanel';
import { LandingPage } from './src/pages/Landing';
import { LobbyPage } from './src/pages/Lobby';
import { CreateRoomPage } from './src/pages/CreateRoom';
import { GameRoomPage } from './src/pages/GameRoom';
import { ProtectedRoute } from './src/components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateRoomPage /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><GameRoomPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DebugPanel />
    </BrowserRouter>
  );
}