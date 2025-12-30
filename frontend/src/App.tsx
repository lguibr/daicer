import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import GameRoomPage from './pages/GameRoom';
import RoomsPage from './pages/Rooms';

import TestSetupPage from './pages/TestSetup';
import { RulesExplorerLayout } from './pages/RulesExplorer/Layout';
import { RulesDashboard } from './pages/RulesExplorer/RulesDashboard';
import { RulesCategoryPage } from './pages/RulesExplorer/RulesCategoryPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DebugPage from './pages/DebugPage';
import DebugRoomPage from './pages/DebugRoomPage';
import NotFoundPage from './pages/NotFound';
import ErrorPage from './pages/Error';
import { NavigateToPlay } from './components/common/NavigateToPlay';

import AuthEventHandler from './components/auth/AuthEventHandler';

// New Create Room Flow
import CreateRoomLayout from './features/create-room/layout/CreateRoomLayout';
import DmSettingsPage from './features/create-room/pages/DmSettingsPage';
import WorldConfigPage from './features/create-room/pages/WorldConfigPage';
import CharacterSelectionPage from './features/create-room/pages/CharacterSelectionPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthEventHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connect/google/redirect" element={<GoogleAuthCallback />} />

        {/* Create Room Wizard Flow */}
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateRoomLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dm-settings" replace />} />
          <Route path="dm-settings" element={<DmSettingsPage />} />
          <Route path="world-generation" element={<WorldConfigPage />} />
          <Route path="character-selection/:roomId" element={<CharacterSelectionPage />} />
        </Route>

        <Route
          path="/room"
          element={
            <ProtectedRoute>
              <RoomsPage />
            </ProtectedRoute>
          }
        />

        {/* Play Route (Canonical Game View) */}
        <Route
          path="/play/:roomId"
          element={
            <ProtectedRoute>
              <GameRoomPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy redirect or alias */}
        {/* Legacy redirect or alias - Render GameRoomPage directly or redirect properly. 
            Since we want canonical /play/, let's use a small inline component or just let GameRoomPage handle it if it doesn't mind the URL.
            Actually, let's just make RoomsPage link to /play and keep this as a valid route rendering the room for backward compat.
        */}
        <Route path="/room/:roomId" element={<NavigateToPlay />} />

        {/* Debug Room Route */}
        <Route
          path="/debug/:roomId"
          element={
            <ProtectedRoute>
              <DebugRoomPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/test-setup"
          element={
            <ProtectedRoute>
              <TestSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rules"
          element={
            <ProtectedRoute>
              <RulesExplorerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RulesDashboard />} />
          <Route path=":category" element={<RulesCategoryPage />} />
        </Route>

        <Route path="/error" element={<ErrorPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
