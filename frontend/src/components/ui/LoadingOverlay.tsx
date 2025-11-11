/**
 * Full-screen loading overlay with icosahedron spinner
 */

import { IcosahedronLoader } from './IcosahedronLoader';

interface LoadingOverlayProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingOverlay({ message, size = 'large' }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <IcosahedronLoader size={size} />
        {message && <p className="text-xl font-semibold text-white animate-pulse">{message}</p>}
      </div>
    </div>
  );
}
