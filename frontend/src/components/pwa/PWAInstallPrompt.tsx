import { Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallPrompt() {
  const { canInstall, promptInstall } = usePWA();

  if (!canInstall) return null;

  return (
    <button
      onClick={promptInstall}
      className="group relative flex items-center gap-2 px-4 py-2 rounded-lg bg-midnight-800/80 border border-aurora-500/30 text-aurora-100 hover:bg-midnight-700 hover:border-aurora-400 transition-all duration-300 shadow-lg backdrop-blur-sm"
      aria-label="Install App"
    >
      <Download className="w-4 h-4 text-aurora-300 group-hover:text-aurora-100 transition-colors" />
      <span className="text-xs font-medium tracking-wide uppercase">Install App</span>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-lg bg-aurora-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
