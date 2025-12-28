import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import GameRoomPage from './pages/GameRoom';
import RoomsPage from './pages/Rooms';
import GamePage from './pages/Game';
import TestSetupPage from './pages/TestSetup';
import { RulesExplorerLayout } from './pages/RulesExplorer/Layout';
import { RulesDashboard } from './pages/RulesExplorer/RulesDashboard';
import { RulesCategoryPage } from './pages/RulesExplorer/RulesCategoryPage';
import AssetsPage from './pages/Assets';
import Assets2DPage from './pages/Assets2D';
import Assets3DPage from './pages/Assets3D';
import AssetsCharacterSheetPage from './pages/AssetsCharacterSheet';
import AssetsStructuresPage from './pages/AssetsStructures';
import AssetDetailPage from './pages/AssetDetail';
import NotFoundPage from './pages/NotFound';
import ErrorPage from './pages/Error';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AssetsProvider } from './state/assetsStore';
import DebugPage from './pages/DebugPage';
import DebugRoomPage from './pages/DebugRoomPage';

import AuthEventHandler from './components/auth/AuthEventHandler';

// New Create Room Flow
import CreateRoomLayout from './features/create-room/layout/CreateRoomLayout';
import DmSettingsPage from './features/create-room/pages/DmSettingsPage';
import WorldConfigPage from './features/create-room/pages/WorldConfigPage';
import CharacterSelectionPage from './features/create-room/pages/CharacterSelectionPage';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
          <Route
            path="character-selection/:roomId"
            element={
              <AssetsProvider>
                <CharacterSelectionPage />
              </AssetsProvider>
            }
          />
        </Route>

        <Route
          path="/room"
          element={
            <ProtectedRoute>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <GamePage />
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
        <Route path="/room/:roomId" element={<Navigate to="/play/:roomId" />} />

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
        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <AssetsPage />
              </AssetsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets/2d"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <Assets2DPage />
              </AssetsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets/3d"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <Assets3DPage />
              </AssetsProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/character-sheet"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <AssetsCharacterSheetPage />
              </AssetsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets/structures"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <AssetsStructuresPage />
              </AssetsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets/:assetId"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <AssetDetailPage />
              </AssetsProvider>
            </ProtectedRoute>
          }
        />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
