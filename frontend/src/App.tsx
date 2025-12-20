import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import CreateRoomPage from './pages/CreateRoom';
import GameRoomPage from './pages/GameRoom';
import RoomsPage from './pages/Rooms';
import GamePage from './pages/Game';
import TestSetupPage from './pages/TestSetup';
import { TacticalCombat } from './pages/TacticalCombat';
import { RulesExplorerLayout } from './pages/RulesExplorer/Layout';
import { RulesDashboard } from './pages/RulesExplorer/RulesDashboard';
import { RulesCategoryPage } from './pages/RulesExplorer/RulesCategoryPage';
import AssetsPage from './pages/Assets';
import Assets2DPage from './pages/Assets2D';
import Assets3DPage from './pages/Assets3D';
import AssetsMapsPage from './pages/AssetsMaps';
import AssetsCharacterSheetPage from './pages/AssetsCharacterSheet';
import AssetsStructuresPage from './pages/AssetsStructures';
import AssetDetailPage from './pages/AssetDetail';
import NotFoundPage from './pages/NotFound';
import ErrorPage from './pages/Error';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AssetsProvider } from './state/assetsStore';

import AuthEventHandler from './components/auth/AuthEventHandler';

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
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateRoomPage />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <GameRoomPage />
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
          path="/tactical"
          element={
            <ProtectedRoute>
              <TacticalCombat />
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
          {/* Detail route is handled via modal in list for now, or we can add :category/:id later */}
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
          path="/assets/maps"
          element={
            <ProtectedRoute>
              <AssetsProvider>
                <AssetsMapsPage />
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
