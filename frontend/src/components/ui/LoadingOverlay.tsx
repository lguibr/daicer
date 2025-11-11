/**
 * Full-screen loading overlay with 3D dice spinner
 */

import { DiceLoader } from './dice-loader';
import type { DiceLoaderSize } from './dice-loader';

interface LoadingOverlayProps {
  message?: string;
  size?: DiceLoaderSize;
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
        <DiceLoader size={size} />
        {message && <p className="text-xl font-semibold text-white animate-pulse">{message}</p>}
      </div>
    </div>
  );
}
