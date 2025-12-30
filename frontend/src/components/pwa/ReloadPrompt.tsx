import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function ReloadPrompt() {
  const { needRefresh, updateServiceWorker, closeNeedRefresh } = usePWA();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="relative flex items-center gap-4 p-4 rounded-xl border border-aurora-500/30 bg-midnight-900/90 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-aurora-100">Update Available</h4>
          <p className="text-xs text-aurora-200/70">A new version of Daicer is ready.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="p-2 rounded-lg bg-aurora-500/20 text-aurora-100 hover:bg-aurora-500/30 transition-colors"
            title="Reload to update"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => closeNeedRefresh()}
            className="p-2 rounded-lg bg-midnight-800 text-shadow-300 hover:bg-midnight-700 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Glow border */}
        <div className="absolute inset-0 rounded-xl border border-aurora-500/10 pointer-events-none" />
      </div>
    </div>
  );
}
