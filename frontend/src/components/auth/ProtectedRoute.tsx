import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { DiceLoader } from '../ui/dice-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protect routes requiring authentication
 * @param props - Component props
 * @returns Protected content or redirect to login
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <DiceLoader size="large" maxDiceCount={3} message="Authenticating..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
