import React from 'react';
import { useTimeFrame } from '../../../contexts/TimeFrameContext';

export const TimeControls: React.FC = () => {
  const { history, currentTimeFrame, jumpToFrame, goLive, isLive } = useTimeFrame();

  if (!history || history.length === 0) {
    return <div className="text-white/50 text-xs p-2">No History Available</div>;
  }

  // Determine current index
  const currentIndex = isLive
    ? history.length - 1
    : currentTimeFrame
      ? history.findIndex(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f) => (f as any).documentId === (currentTimeFrame as any).documentId || f.id === currentTimeFrame.id
        )
      : history.length - 1;

  const total = history.length;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    if (idx >= history.length - 1) {
      goLive();
    } else {
      const frame = history[idx];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      jumpToFrame((frame as any)?.documentId || frame?.id);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-gray-900 border-t border-white/10 p-3 h-14">
      <div className="text-xs font-mono text-cyan-400 w-24">
        {isLive ? 'LIVE' : `HIST: T${currentTimeFrame?.turnNumber || 0}`}
      </div>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-white/50">START</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={Math.max(0, currentIndex)}
          onChange={handleScrub}
          className="flex-1 accent-cyan-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-white/50">NOW ({total})</span>
      </div>

      <button
        onClick={goLive}
        disabled={isLive}
        className={`px-3 py-1 text-xs rounded border border-cyan-500/50 ${isLive ? 'bg-cyan-500/20 text-cyan-200' : 'bg-transparent text-cyan-500 hover:bg-cyan-900'}`}
      >
        GO LIVE
      </button>
    </div>
  );
};
