import { useParams, Navigate } from 'react-router-dom';

export function NavigateToPlay() {
  const { roomId } = useParams();
  return <Navigate to={`/play/${roomId}`} replace />;
}
